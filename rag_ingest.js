'use strict';

/**
 * rag_ingest.js — PDF Ingestion Script for BlockEdu Pro RAG
 *
 * Run ONCE to process all 14 PDFs and create rag_index.json
 * Usage: node rag_ingest.js
 *
 * What it does:
 *  1. Reads all PDFs from ./Documents/
 *  2. Extracts text using pdf-parse
 *  3. Splits into chunks (~500 chars, 80 chars overlap) manually
 *  4. Embeds each chunk via OpenAI text-embedding-3-small
 *  5. Saves rag_index.json with all chunks + embeddings + metadata
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { getDocTitle } = require('./rag_titles');

// ─── Config ───────────────────────────────────────────────────────
const DOCS_DIR = path.join(__dirname, 'Documents');
const OUTPUT_PATH = path.join(__dirname, 'rag_index.json');
const CHUNK_SIZE = 1200;    // characters per chunk (~300 tokens)
const CHUNK_OVERLAP = 150;  // overlap characters
const BATCH_SIZE = 5;       // embed N chunks at once (rate limit friendly)
const EMBED_MODEL_OPENAI = 'text-embedding-3-small';
const EMBED_MODEL_GEMINI = 'gemini-embedding-001';

// ─── Load .env manually ───────────────────────────────────────────
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envText = fs.readFileSync(envPath, 'utf8');
    for (const line of envText.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx < 1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) process.env[key] = val;
    }
  }
} catch (e) { /* ignore */ }

const GEMINI_KEY = (process.env.GEMINI_API_KEY || '').trim();
const OPENAI_KEY = (process.env.OPENAI_API_KEY || '').trim();
const USE_GEMINI = !!GEMINI_KEY;
const API_KEY = GEMINI_KEY || OPENAI_KEY;

// ─── Text splitter (manual, no langchain needed) ──────────────────
function splitTextIntoChunks(text, chunkSize, overlap) {
  const chunks = [];
  let start = 0;

  // Clean up whitespace
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  while (start < cleaned.length) {
    let end = start + chunkSize;

    // Try to break at paragraph or sentence boundary
    if (end < cleaned.length) {
      const breakAt = cleaned.lastIndexOf('\n\n', end);
      const sentBreak = cleaned.lastIndexOf('. ', end);
      const best = Math.max(breakAt, sentBreak);
      if (best > start + chunkSize * 0.5) {
        end = best + 1;
      }
    }

    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 50) { // skip tiny chunks
      chunks.push(chunk);
    }

    start = end - overlap;
    if (start >= cleaned.length) break;
  }

  return chunks;
}

// ─── Estimate page number from character offset ───────────────────
function estimatePage(charOffset, totalChars, totalPages) {
  if (!totalPages || totalPages <= 1) return 1;
  return Math.max(1, Math.ceil((charOffset / totalChars) * totalPages));
}

// ─── Embed batch via OpenAI ─────────────────────────────────
function embedBatchOpenAI(texts) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: EMBED_MODEL_OPENAI,
      input: texts.map(t => t.slice(0, 8000)),
    });

    let data = '';
    const req = https.request({
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/embeddings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return reject(new Error(parsed.error.message));
          const embeddings = parsed.data
            .sort((a, b) => a.index - b.index)
            .map(d => d.embedding);
          resolve(embeddings);
        } catch (e) {
          reject(new Error('Parse error: ' + data.slice(0, 200)));
        }
      });
    });
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ─── Embed batch via Google Gemini (batchEmbedContents) ───────
function embedBatchGemini(texts) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      requests: texts.map(t => ({
        model: `models/${EMBED_MODEL_GEMINI}`,
        content: { parts: [{ text: t.slice(0, 8000) }] },
      })),
    });

    let data = '';
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${EMBED_MODEL_GEMINI}:batchEmbedContents?key=${GEMINI_KEY}`,
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
          if (parsed.embeddings) {
            resolve(parsed.embeddings.map(e => e.values));
          } else {
            reject(new Error('No embeddings in Gemini response'));
          }
        } catch (e) {
          reject(new Error('Gemini parse error: ' + data.slice(0, 200)));
        }
      });
    });
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ─── Unified batch embed ───────────────────────────────────
function embedBatch(texts) {
  return USE_GEMINI ? embedBatchGemini(texts) : embedBatchOpenAI(texts);
}

// ─── Sleep helper ─────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Process one PDF ──────────────────────────────────────────────
async function processPDF(filename) {
  const filePath = path.join(DOCS_DIR, filename);
  console.log(`\n📄 Processing: ${filename}`);

  let pdfParseLib;
  try {
    pdfParseLib = require('pdf-parse');
    if (typeof pdfParseLib !== 'function') {
      pdfParseLib = pdfParseLib.default || Object.values(pdfParseLib).find(v => typeof v === 'function');
    }
    if (typeof pdfParseLib !== 'function') throw new Error('pdf-parse: no callable export found');
  } catch (e) {
    throw new Error('pdf-parse not installed. Run: npm install pdf-parse@1.1.1 — ' + e.message);
  }

  const buffer = fs.readFileSync(filePath);
  let pdfData;
  try {
    pdfData = await pdfParseLib(buffer);
  } catch (e) {
    console.warn(`  ⚠️  Could not parse ${filename}: ${e.message}`);
    return [];
  }

  const rawText = pdfData.text || '';
  const totalPages = pdfData.numpages || 1;
  const metaTitle = pdfData.info?.Title || '';
  const docTitle = getDocTitle(filename, metaTitle);

  console.log(`  📚 Title: ${docTitle}`);
  console.log(`  📖 Pages: ${totalPages}, Text length: ${rawText.length} chars`);

  if (rawText.length < 100) {
    console.warn(`  ⚠️  Very little text extracted (possibly scanned PDF). Skipping.`);
    return [];
  }

  const textChunks = splitTextIntoChunks(rawText, CHUNK_SIZE, CHUNK_OVERLAP);
  console.log(`  ✂️  Split into ${textChunks.length} chunks`);

  // Build chunk objects with metadata
  const chunkObjects = textChunks.map((text, i) => {
    const charOffset = rawText.indexOf(text.slice(0, 50));
    const page = estimatePage(charOffset >= 0 ? charOffset : i * CHUNK_SIZE, rawText.length, totalPages);
    return {
      chunk_id: `${filename}::${i}`,
      filename,
      title: docTitle,
      page,
      text,
      embedding: null, // will be filled
    };
  });

  return chunkObjects;
}

// ─── Main ingestion ───────────────────────────────────────────────
async function main() {
  console.log('🚀 BlockEdu Pro — RAG Ingestion Script');
  console.log('='.repeat(50));

  if (!API_KEY) {
    console.error('❌ No API key found! Add GEMINI_API_KEY or OPENAI_API_KEY to .env');
    process.exit(1);
  }
  console.log(`🔑 Using: ${USE_GEMINI ? 'Google Gemini (text-embedding-004)' : 'OpenAI (text-embedding-3-small)'}`);

  // Get PDF list
  const files = fs.readdirSync(DOCS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log(`\n📂 Found ${files.length} PDF files in ./Documents/`);

  if (files.length === 0) {
    console.error('❌ No PDF files found in ./Documents/');
    process.exit(1);
  }

  // Extract text from all PDFs
  let allChunks = [];
  for (const filename of files) {
    try {
      const chunks = await processPDF(filename);
      allChunks = allChunks.concat(chunks);
    } catch (e) {
      console.error(`  ❌ Error processing ${filename}:`, e.message);
    }
  }

  console.log(`\n\n📊 Total chunks to embed: ${allChunks.length}`);
  console.log(`💰 Estimated cost: ~$${(allChunks.length * CHUNK_SIZE * 0.00000002).toFixed(4)} USD`);
  const embLabel = USE_GEMINI ? 'Gemini text-embedding-004' : 'OpenAI text-embedding-3-small';
  console.log(`\n🔗 Starting embedding via ${embLabel}...\n`);

  // Embed in batches
  let embedded = 0;
  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map(c => c.text);

    try {
      const embeddings = await embedBatch(texts);
      for (let j = 0; j < batch.length; j++) {
        allChunks[i + j].embedding = embeddings[j];
      }
      embedded += batch.length;
      const pct = Math.round((embedded / allChunks.length) * 100);
      process.stdout.write(`\r  ⚡ Progress: ${embedded}/${allChunks.length} chunks (${pct}%)`);

      // Rate limit: Gemini free = 15 RPM, so ~4s between requests
      if (i + BATCH_SIZE < allChunks.length) {
        await sleep(USE_GEMINI ? 5000 : 500);
      }
    } catch (e) {
      console.error(`\n  ❌ Embedding batch ${i}-${i + BATCH_SIZE} failed:`, e.message);
      // Retry once
      await sleep(2000);
      try {
        const embeddings = await embedBatch(texts);
        for (let j = 0; j < batch.length; j++) {
          allChunks[i + j].embedding = embeddings[j];
        }
        embedded += batch.length;
      } catch (e2) {
        console.error(`  ❌ Retry failed. Skipping batch.`);
      }
    }
  }

  // Filter out chunks without embeddings
  const validChunks = allChunks.filter(c => c.embedding !== null);
  console.log(`\n\n✅ Successfully embedded: ${validChunks.length}/${allChunks.length} chunks`);

  // Save to disk
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(validChunks), 'utf8');

  const fileSizeMB = (fs.statSync(OUTPUT_PATH).size / 1024 / 1024).toFixed(2);
  console.log(`\n💾 Saved to: rag_index.json (${fileSizeMB} MB)`);
  console.log('\n🎉 Ingestion complete! Your chatbot is now RAG-powered.');
  console.log('   Restart your server: node server.js\n');
}

main().catch(e => {
  console.error('\n❌ Fatal error:', e.message);
  process.exit(1);
});
