'use strict';

/**
 * rag_engine.js — RAG Search Engine for HubBlock
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
const GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';

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

// ─── Embed via OpenAI ────────────────────────────────────────
function embedTextOpenAI(text, apiKey) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: text.slice(0, 8000),
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

// ─── Embed via Google Gemini ────────────────────────────────────
function embedTextGemini(text, apiKey) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: `models/${GEMINI_EMBEDDING_MODEL}`,
      content: { parts: [{ text: text.slice(0, 8000) }] },
    });

    let data = '';
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message || JSON.stringify(parsed.error)));
          if (parsed.embedding && parsed.embedding.values) {
            resolve(parsed.embedding.values);
          } else {
            reject(new Error('No embedding in response'));
          }
        } catch (e) {
          reject(new Error('Gemini embedding parse error: ' + data.slice(0, 200)));
        }
      });
    });
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Embedding timeout')); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ─── Unified embed ──────────────────────────────────────────
function embedText(text) {
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (geminiKey) return embedTextGemini(text, geminiKey);
  if (openaiKey) return embedTextOpenAI(text, openaiKey);
  return Promise.reject(new Error('No API key for embeddings'));
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

// ─── Keyword / BM25-lite search (no API needed) ─────────────────────
function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
}

// Pre-build IDF map on init for faster keyword search
let idfMap = null;
function buildIDF() {
  if (idfMap) return;
  idfMap = {};
  const N = store.length;
  const df = {};
  for (const chunk of store) {
    const words = new Set(tokenize(chunk.text));
    for (const w of words) {
      df[w] = (df[w] || 0) + 1;
    }
  }
  for (const w in df) {
    idfMap[w] = Math.log((N - df[w] + 0.5) / (df[w] + 0.5) + 1);
  }
}

function keywordSearch(query, k = 4) {
  buildIDF();
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];

  const scored = store.map(chunk => {
    const text = chunk.text.toLowerCase();
    const docTokens = tokenize(chunk.text);
    const docLen = docTokens.length;
    const avgDL = 300; // approximate average doc length in tokens
    const kParam = 1.2;
    const b = 0.75;
    let score = 0;

    // BM25 scoring
    const tf = {};
    for (const t of docTokens) tf[t] = (tf[t] || 0) + 1;
    for (const qt of qTokens) {
      const termFreq = tf[qt] || 0;
      if (termFreq === 0) continue;
      const idf = idfMap[qt] || 0;
      score += idf * (termFreq * (kParam + 1)) / (termFreq + kParam * (1 - b + b * docLen / avgDL));
    }

    // Bonus for exact phrase match
    if (text.includes(query.toLowerCase().trim())) {
      score += 5;
    }

    return { ...chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).filter(c => c.score > 0).map(({ embedding, ...rest }) => rest);
}

// ─── Search for similar chunks ────────────────────────────────────
async function searchSimilar(query, k = 4) {
  if (store.length === 0) return [];

  // Try vector search first if embedding API available
  const hasEmbedKey = (process.env.GEMINI_API_KEY || '').trim() || (process.env.OPENAI_API_KEY || '').trim();
  if (hasEmbedKey) {
    try {
      const queryVec = await embedText(query);

      // Dimension mismatch → fall through to keyword search
      if (store[0].embedding && store[0].embedding.length !== queryVec.length) {
        console.warn(`[RAG] Dimension mismatch (stored=${store[0].embedding.length}, query=${queryVec.length}). Using keyword search.`);
      } else {
        const scored = store.map(chunk => ({
          ...chunk,
          score: cosineSimilarity(queryVec, chunk.embedding),
        }));
        scored.sort((a, b) => b.score - a.score);
        const topK = scored.slice(0, k);
        return topK.map(({ embedding, ...rest }) => rest);
      }
    } catch (e) {
      console.warn('[RAG] Embedding failed, using keyword search:', e.message);
    }
  }

  // Fallback: keyword/BM25 search (no API needed)
  return keywordSearch(query, k);
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
