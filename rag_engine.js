'use strict';

/**
 * rag_engine.js — RAG Search Engine for BlockEdu Pro
 *
 * Loads the pre-built rag_index.json (created by rag_ingest.js)
 * and provides cosine-similarity search over document embeddings.
 *
 * Usage in server.js:
 *   const ragEngine = require('./rag_engine');
 *   await ragEngine.init();
 *   const chunks = await ragEngine.searchSimilar('what is bitcoin', 4);
 *   const context = ragEngine.buildRAGContext(chunks);
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const INDEX_PATH = path.join(__dirname, 'rag_index.json');
const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';

let store = []; // in-memory vector store
let initialized = false;

// ─── Cosine similarity ────────────────────────────────────────────
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

// ─── Embed a single text via OpenAI ──────────────────────────────
function embedText(text, apiKey) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: text.slice(0, 8000), // max safe length
    });

    let data = '';
    const req = https.request({
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/embeddings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          resolve(parsed.data[0].embedding);
        } catch (e) {
          reject(new Error('Embedding parse error: ' + data.slice(0, 100)));
        }
      });
    });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Embedding timeout')); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
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
    store = JSON.parse(raw);
    console.log(`[RAG] Loaded ${store.length} chunks from rag_index.json`);
    initialized = true;
  } catch (e) {
    console.error('[RAG] Failed to load index:', e.message);
    initialized = true;
  }
}

// ─── Search for similar chunks ────────────────────────────────────
async function searchSimilar(query, k = 4) {
  if (store.length === 0) return [];

  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) return [];

  try {
    const queryVec = await embedText(query, apiKey);

    // Score all chunks
    const scored = store.map(chunk => ({
      ...chunk,
      score: cosineSimilarity(queryVec, chunk.embedding),
    }));

    // Sort by score descending, pick top-k
    scored.sort((a, b) => b.score - a.score);
    const topK = scored.slice(0, k);

    // Remove embedding from results (save memory)
    return topK.map(({ embedding, ...rest }) => rest);
  } catch (e) {
    console.error('[RAG] searchSimilar error:', e.message);
    return [];
  }
}

// ─── Build RAG context string for system prompt ───────────────────
function buildRAGContext(chunks, lang = 'vi') {
  if (!chunks || chunks.length === 0) return '';

  const isVi = lang === 'vi';
  const sourceLabel = isVi ? 'NGUỒN' : 'SOURCE';

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

module.exports = { init, searchSimilar, buildRAGContext, buildSourcesList };
