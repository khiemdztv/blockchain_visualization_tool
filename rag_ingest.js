'use strict';

/**
 * rag_ingest.js — PDF Ingestion Script for HubBlock RAG (LangChain)
 *
 * Run ONCE to process all PDFs and create rag_index.json
 * Usage: node rag_ingest.js
 *
 * What it does:
 *  1. Reads all PDFs from ./Documents/ with LangChain PDFLoader (one Document per page)
 *  2. Splits pages into chunks with RecursiveCharacterTextSplitter
 *  3. Embeds each chunk via GoogleGenerativeAIEmbeddings / OpenAIEmbeddings
 *     (skipped when no API key — the server then uses BM25 keyword search only)
 *  4. Saves rag_index.json with all chunks + embeddings + metadata
 *     (chunks whose source is not a PDF in ./Documents/, e.g. team info, are kept)
 */

const fs = require('fs');
const path = require('path');
const { PDFLoader } = require('@langchain/community/document_loaders/fs/pdf');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { getDocTitle } = require('./rag_titles');

// ─── Config ───────────────────────────────────────────────────────
const DOCS_DIR = path.join(__dirname, 'Documents');
const OUTPUT_PATH = path.join(__dirname, 'rag_index.json');
const CHUNK_SIZE = 1200;    // characters per chunk (~300 tokens)
const CHUNK_OVERLAP = 150;  // overlap characters
const BATCH_SIZE = 5;       // embed N chunks at once (rate limit friendly)

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

// Required after .env is loaded so the embedding keys are visible
const { getEmbeddings } = require('./rag_engine');
const USE_GEMINI = !!(process.env.GEMINI_API_KEY || '').trim();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_OVERLAP,
  separators: ['\n\n', '\n', '. ', ' ', ''],
});

// ─── Sleep helper ─────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Process one PDF ──────────────────────────────────────────────
async function processPDF(filename) {
  console.log(`\n📄 Processing: ${filename}`);

  let pages;
  try {
    pages = await new PDFLoader(path.join(DOCS_DIR, filename), { splitPages: true }).load();
  } catch (e) {
    console.warn(`  ⚠️  Could not parse ${filename}: ${e.message}`);
    return [];
  }

  const totalChars = pages.reduce((n, p) => n + p.pageContent.length, 0);
  const metaTitle = pages[0]?.metadata?.pdf?.info?.Title || '';
  const docTitle = getDocTitle(filename, metaTitle);

  console.log(`  📚 Title: ${docTitle}`);
  console.log(`  📖 Pages: ${pages.length}, Text length: ${totalChars} chars`);

  if (totalChars < 100) {
    console.warn(`  ⚠️  Very little text extracted (possibly scanned PDF). Skipping.`);
    return [];
  }

  for (const p of pages) {
    p.pageContent = p.pageContent.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  const chunks = (await splitter.splitDocuments(pages)).filter(c => c.pageContent.length > 50);
  console.log(`  ✂️  Split into ${chunks.length} chunks`);

  return chunks.map((chunk, i) => ({
    chunk_id: `${filename}::${i}`,
    filename,
    title: docTitle,
    page: chunk.metadata.loc?.pageNumber || 1,
    text: chunk.pageContent,
    embedding: null, // will be filled
  }));
}

// ─── Main ingestion ───────────────────────────────────────────────
async function main() {
  console.log('🚀 HubBlock — RAG Ingestion Script (LangChain)');
  console.log('='.repeat(50));

  const embeddings = getEmbeddings();
  if (embeddings) {
    console.log(`🔑 Using: ${USE_GEMINI ? 'GoogleGenerativeAIEmbeddings (gemini-embedding-001)' : 'OpenAIEmbeddings (text-embedding-3-small)'}`);
  } else {
    console.warn('⚠️  No GEMINI_API_KEY or OPENAI_API_KEY — chunks will be saved without embeddings (BM25 search only).');
  }

  // Get PDF list
  const files = fs.readdirSync(DOCS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log(`\n📂 Found ${files.length} PDF files in ./Documents/`);

  if (files.length === 0) {
    console.error('❌ No PDF files found in ./Documents/');
    process.exit(1);
  }

  // Keep hand-written chunks (e.g. project/team info) that have no PDF in ./Documents/
  let preserved = [];
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      preserved = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8')).filter(c => !files.includes(c.filename));
      if (preserved.length) console.log(`📌 Keeping ${preserved.length} existing non-PDF chunks`);
    } catch (e) {
      console.warn('⚠️  Could not read existing rag_index.json:', e.message);
    }
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

  console.log(`\n\n📊 Total chunks: ${allChunks.length}`);

  let validChunks = allChunks;
  if (embeddings) {
    console.log(`\n🔗 Starting embedding...\n`);

    // Preserved chunks are kept either way; embed them too so vector search can find them
    const toEmbed = preserved.filter(c => !c.embedding).concat(allChunks);

    // Embed in batches
    let embedded = 0;
    for (let i = 0; i < toEmbed.length; i += BATCH_SIZE) {
      const batch = toEmbed.slice(i, i + BATCH_SIZE);
      const texts = batch.map(c => c.text.slice(0, 8000));

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const vectors = await embeddings.embedDocuments(texts);
          batch.forEach((c, j) => { c.embedding = vectors[j]; });
          embedded += batch.length;
          break;
        } catch (e) {
          console.error(`\n  ❌ Embedding batch ${i}-${i + BATCH_SIZE} failed:`, e.message);
          if (attempt === 0) await sleep(2000);
          else console.error(`  ❌ Retry failed. Skipping batch.`);
        }
      }

      const pct = Math.round((embedded / toEmbed.length) * 100);
      process.stdout.write(`\r  ⚡ Progress: ${embedded}/${toEmbed.length} chunks (${pct}%)`);

      // Rate limit: Gemini free = 15 RPM, so ~4s between requests
      if (i + BATCH_SIZE < toEmbed.length) {
        await sleep(USE_GEMINI ? 5000 : 500);
      }
    }

    // Filter out chunks without embeddings
    validChunks = allChunks.filter(c => c.embedding !== null);
    console.log(`\n\n✅ Successfully embedded: ${validChunks.length}/${allChunks.length} chunks`);
  }

  // Save to disk
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(preserved.concat(validChunks)), 'utf8');

  const fileSizeMB = (fs.statSync(OUTPUT_PATH).size / 1024 / 1024).toFixed(2);
  console.log(`\n💾 Saved to: rag_index.json (${fileSizeMB} MB)`);
  console.log('\n🎉 Ingestion complete! Your chatbot is now RAG-powered.');
  console.log('   Restart your server: node server.js\n');
}

main().catch(e => {
  console.error('\n❌ Fatal error:', e.message);
  process.exit(1);
});
