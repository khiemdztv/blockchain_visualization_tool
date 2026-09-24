'use strict';

/**
 * rag_engine.js — RAG Search Engine for HubBlock (LangChain)
 *
 * Loads the pre-built rag_index.json (created by rag_ingest.js) into
 * LangChain Documents and exposes two retrievers:
 *   - VectorStoreRetriever over an in-memory vector store (needs chunk
 *     embeddings in the index + GEMINI_API_KEY / OPENAI_API_KEY)
 *   - BM25Retriever (offline keyword search, no API needed)
 * Vector search is used first and falls back to BM25 via .withFallbacks().
 *
 * Usage in server.js:
 *   const ragEngine = require('./rag_engine');
 *   await ragEngine.init();
 *   const chunks = await ragEngine.searchSimilar('what is bitcoin', 4);
 *   const context = ragEngine.buildRAGContext(chunks);
 */

const fs = require('fs');
const path = require('path');
const { Document } = require('@langchain/core/documents');
const { VectorStore } = require('@langchain/core/vectorstores');
const { BM25Retriever } = require('@langchain/community/retrievers/bm25');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');

const INDEX_PATH = path.join(__dirname, 'rag_index.json');
const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';
const GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';

let documents = [];  // LangChain Documents built from rag_index.json
let retriever = null; // Runnable: vector retriever with BM25 fallback, or BM25 only
let retrieverK = 0;
let initialized = false;

// ─── Embeddings (Gemini preferred, then OpenAI) ───────────────────
function getEmbeddings() {
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (geminiKey) return new GoogleGenerativeAIEmbeddings({ apiKey: geminiKey, model: GEMINI_EMBEDDING_MODEL });
  if (openaiKey) return new OpenAIEmbeddings({ apiKey: openaiKey, model: OPENAI_EMBEDDING_MODEL, timeout: 15000 });
  return null;
}

// ─── In-memory vector store (cosine similarity) ───────────────────
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

class InMemoryVectorStore extends VectorStore {
  constructor(embeddings) {
    super(embeddings, {});
    this.vectors = [];
  }

  _vectorstoreType() {
    return 'hubblock_memory';
  }

  async addVectors(vectors, docs) {
    for (let i = 0; i < docs.length; i++) {
      this.vectors.push({ embedding: vectors[i], doc: docs[i] });
    }
  }

  async addDocuments(docs) {
    const vectors = await this.embeddings.embedDocuments(docs.map(d => d.pageContent));
    return this.addVectors(vectors, docs);
  }

  async similaritySearchVectorWithScore(query, k) {
    if (this.vectors.length > 0 && this.vectors[0].embedding.length !== query.length) {
      throw new Error(`Embedding dimension mismatch (index ${this.vectors[0].embedding.length}, query ${query.length})`);
    }
    return this.vectors
      .map(v => [v.doc, cosineSimilarity(query, v.embedding)])
      .sort((a, b) => b[1] - a[1])
      .slice(0, k);
  }
}

// ─── BM25 tokenizer (Unicode-aware, works for Vietnamese) ─────────
function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
}

class HubBlockBM25Retriever extends BM25Retriever {
  preprocessFunc(text) {
    return tokenize(text);
  }
}

// ─── Build retriever chain for a given k ──────────────────────────
function buildRetriever(k) {
  const bm25 = HubBlockBM25Retriever.fromDocuments(documents, { k });

  const embeddings = getEmbeddings();
  const vectorDocs = documents.filter(d => Array.isArray(d.metadata.embedding) && d.metadata.embedding.length > 0);
  if (!embeddings || vectorDocs.length === 0) return bm25;

  const store = new InMemoryVectorStore(embeddings);
  store.addVectors(vectorDocs.map(d => d.metadata.embedding), vectorDocs);
  return store.asRetriever({ k }).withFallbacks([bm25]);
}

// ─── Init: load index from disk ───────────────────────────────────
async function init() {
  if (initialized) return;

  if (!fs.existsSync(INDEX_PATH)) {
    console.warn('[RAG] rag_index.json not found. Run: node rag_ingest.js');
    initialized = true;
    return;
  }

  try {
    const raw = fs.readFileSync(INDEX_PATH, 'utf8');
    documents = JSON.parse(raw).map(chunk => new Document({
      id: chunk.chunk_id,
      pageContent: chunk.text,
      metadata: {
        chunk_id: chunk.chunk_id,
        filename: chunk.filename,
        title: chunk.title,
        page: chunk.page,
        embedding: chunk.embedding || null,
      },
    }));
    console.log(`[RAG] Loaded ${documents.length} chunks from rag_index.json`);
    initialized = true;
  } catch (e) {
    console.error('[RAG] Failed to load index:', e.message);
    initialized = true;
  }
}

// ─── Search for similar chunks ────────────────────────────────────
async function searchSimilar(query, k = 4) {
  if (documents.length === 0) return [];

  if (!retriever || retrieverK !== k) {
    retriever = buildRetriever(k);
    retrieverK = k;
  }

  const docs = await retriever.invoke(query);
  return docs.map(d => ({
    chunk_id: d.metadata.chunk_id,
    filename: d.metadata.filename,
    title: d.metadata.title,
    page: d.metadata.page,
    text: d.pageContent,
  }));
}

// ─── Build RAG context string for system prompt ───────────────────
function buildRAGContext(chunks, lang = 'vi') {
  if (!chunks || chunks.length === 0) return '';

  const isVi = lang === 'vi';

  const contextParts = chunks.map((chunk, i) => {
    const pageInfo = chunk.page ? (isVi ? `, tr. ${chunk.page}` : `, p. ${chunk.page}`) : '';
    const citeFormat = `[${chunk.title}${pageInfo}]`;
    return `TÀI LIỆU ${i + 1}:\nDùng phần chữ trong ngoặc vuông sau để trích dẫn: ${citeFormat}\nNội dung:\n"${chunk.text.trim()}"`;
  });

  return contextParts.join('\n\n');
}

// ─── Build sources list for API response ─────────────────────────
function buildSourcesList(chunks) {
  const seen = new Set();
  return chunks
    .filter(c => {
      const key = `${c.title}|${c.page}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(c => ({
      title: c.title,
      filename: c.filename,
      page: c.page || null,
    }));
}

module.exports = { init, searchSimilar, buildRAGContext, buildSourcesList, getEmbeddings };
