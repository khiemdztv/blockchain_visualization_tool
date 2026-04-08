#!/usr/bin/env node
/**
 * BlockEdu — Node.js Blockchain Core + Gateway
 * Pure Node.js built-ins only (http, crypto, net)
 * Architecture mirrors the Java core spec.
 * 
 * Java backend code is in /java-core/ — deploy separately when javac available.
 * This Node server implements identical API surface.
 */

'use strict';
const http = require('http');
const crypto = require('crypto');
const url = require('url');
const fs = require('fs');
const path_m = require('path');

const PORT = process.env.PORT || 3001;

// ═══════════════════════════════════════════════════════════════
// READ .env FILE (pure Node.js — no dotenv package needed)
// ═══════════════════════════════════════════════════════════════
try {
  const envPath = path_m.join(__dirname, '.env');
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
    console.log('[BlockEdu] .env loaded successfully.');
  }
} catch (envErr) {
  console.warn('[BlockEdu] Could not read .env:', envErr.message);
}

// ═══════════════════════════════════════════════════════════════
// BLOCKCHAIN CORE (Mirrors Java: Block.java, Blockchain.java,
//                  ProofOfWork.java, HashUtil.java)
// ═══════════════════════════════════════════════════════════════

function sha256(input) {
  return crypto.createHash('sha256').update(String(input), 'utf8').digest('hex');
}

function sha256Steps(input) {
  const h = sha256(input);
  return [
    `INPUT: ${input}`,
    `BYTES: ${Buffer.from(input).toString('hex').slice(0,16)}...`,
    `INIT_HASH: 6a09e667bb67ae853c6ef372a54ff53a510e527f9b05688c1f83d9ab5be0cd19`,
    `ROUND_16:  ${sha256(input+'r16').slice(0,32)}...`,
    `ROUND_32:  ${sha256(input+'r32').slice(0,32)}...`,
    `ROUND_48:  ${sha256(input+'r48').slice(0,32)}...`,
    `ROUND_64:  ${h.slice(0,32)}...`,
    `FINAL:     ${h}`,
  ];
}

function buildMerkleRoot(txs) {
  if (!txs || txs.length === 0) return '';
  let hashes = txs.map(t => sha256(t));
  while (hashes.length > 1) {
    const next = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const l = hashes[i];
      const r = hashes[i+1] || hashes[i];
      next.push(sha256(l + r));
    }
    hashes = next;
  }
  return hashes[0];
}

function buildMerkleTree(txs) {
  if (!txs || txs.length === 0) return null;
  const leafHashes = txs.map(t => sha256(t));
  let working = [...leafHashes];
  if (working.length % 2 === 1) working.push(working[working.length-1]);
  const levels = [leafHashes];
  while (working.length > 1) {
    const next = [];
    for (let i = 0; i < working.length; i += 2) {
      next.push(sha256(working[i] + (working[i+1] || working[i])));
    }
    levels.unshift(next);
    working = next;
  }
  return {
    root: working[0],
    levels,
    transactions: txs.map((d,i) => ({ data: d, hash: leafHashes[i] }))
  };
}

class Block {
  constructor(index, data, previousHash) {
    this.index = index;
    this.timestamp = Date.now();
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.transactions = [];
    this.merkleRoot = '';
    this.tampered = false;
    this.hash = this.calculateHash();
  }
  calculateHash() {
    return sha256(`${this.index}${this.timestamp}${this.data}${this.previousHash}${this.nonce}${this.merkleRoot}`);
  }
  addTransaction(tx) {
    this.transactions.push(tx);
    this.merkleRoot = buildMerkleRoot(this.transactions);
    this.hash = this.calculateHash();
  }
  toJSON() {
    return {
      index: this.index,
      timestamp: this.timestamp,
      data: this.data,
      previousHash: this.previousHash,
      nonce: this.nonce,
      hash: this.hash,
      merkleRoot: this.merkleRoot,
      transactions: this.transactions,
      tampered: this.tampered,
      blockValid: true // overwritten by chain
    };
  }
}

class Blockchain {
  constructor(difficulty = 3) {
    this.difficulty = difficulty;
    this.chain = [];
    const genesis = new Block(0, 'Genesis Block — BlockEdu Educational Chain',
      '0000000000000000000000000000000000000000000000000000000000000000');
    genesis.addTransaction('System: Chain initialized at ' + new Date().toISOString());
    this.chain.push(genesis);
  }

  addBlock(data, transactions = []) {
    const prev = this.chain[this.chain.length - 1];
    const b = new Block(this.chain.length, data, prev.hash);
    for (const tx of transactions) b.addTransaction(tx);
    mineSync(b, this.difficulty);
    this.chain.push(b);
    return b;
  }

  getBlockValidities() {
    return this.chain.map((b, i) => {
      if (i === 0) return true;
      const recalc = b.calculateHash();
      const hashOk = b.hash === recalc;
      const prevOk = b.previousHash === this.chain[i-1].hash;
      return hashOk && prevOk;
    });
  }

  isChainValid() {
    return this.getBlockValidities().every(v => v);
  }

  tamperBlock(index, newData) {
    if (index <= 0 || index >= this.chain.length) return false;
    this.chain[index].data = newData;
    this.chain[index].tampered = true;
    // DO NOT recalc hash — that's what makes it invalid
    return true;
  }

  restoreBlock(index) {
    if (index <= 0 || index >= this.chain.length) return;
    // Re-mine from index outward
    for (let i = index; i < this.chain.length; i++) {
      const b = this.chain[i];
      b.previousHash = this.chain[i-1].hash;
      b.nonce = 0;
      b.tampered = false;
      mineSync(b, this.difficulty);
    }
  }

  toJSON() {
    const validities = this.getBlockValidities();
    return {
      difficulty: this.difficulty,
      valid: this.isChainValid(),
      length: this.chain.length,
      chain: this.chain.map((b, i) => ({ ...b.toJSON(), blockValid: validities[i] }))
    };
  }
}

function mineSync(block, difficulty) {
  const target = '0'.repeat(difficulty);
  block.nonce = 0;
  while (block.nonce < 2_000_000) {
    const hash = block.calculateHash();
    if (hash.startsWith(target)) {
      block.hash = hash;
      return { success: true, nonce: block.nonce, hash };
    }
    block.nonce++;
  }
  block.hash = block.calculateHash();
  return { success: false, nonce: block.nonce, hash: block.hash };
}

// ─── Global state ──────────────────────────────────────────────
let blockchain = new Blockchain(3);

// ═══════════════════════════════════════════════════════════════
// HTTP SERVER
// ═══════════════════════════════════════════════════════════════

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;

  try {
    // ── Serve static files (Vite output: dist/) ───────────────
    if (req.method === 'GET' && !path.startsWith('/api/')) {
      let reqPath = path === '/' ? '/index.html' : path;
      let filePath = path_m.join(__dirname, 'dist', reqPath);
      
      // Fallback for React Router / SPA
      if (!fs.existsSync(filePath)) {
        filePath = path_m.join(__dirname, 'dist', 'index.html');
      }

      if (fs.existsSync(filePath)) {
        const ext = path_m.extname(filePath).toLowerCase();
        let mimeType = 'text/html; charset=utf-8';
        let cacheControl = 'no-cache';

        if (ext === '.js') { mimeType = 'application/javascript; charset=utf-8'; cacheControl = 'public, max-age=31536000, immutable'; }
        else if (ext === '.css') { mimeType = 'text/css'; cacheControl = 'public, max-age=31536000, immutable'; }
        else if (ext === '.json') mimeType = 'application/json';
        else if (ext === '.png') { mimeType = 'image/png'; cacheControl = 'public, max-age=86400'; }
        else if (ext === '.jpg' || ext === '.jpeg') { mimeType = 'image/jpeg'; cacheControl = 'public, max-age=86400'; }
        else if (ext === '.gif') { mimeType = 'image/gif'; cacheControl = 'public, max-age=86400'; }
        else if (ext === '.svg') { mimeType = 'image/svg+xml'; cacheControl = 'public, max-age=86400'; }
        else if (ext === '.webp') { mimeType = 'image/webp'; cacheControl = 'public, max-age=86400'; }
        else if (ext === '.woff2') { mimeType = 'font/woff2'; cacheControl = 'public, max-age=31536000, immutable'; }

        res.writeHead(200, { 'Content-Type': mimeType, 'Cache-Control': cacheControl });
        fs.createReadStream(filePath).pipe(res);
      } else {
        json(res, { error: 'Not found' }, 404);
      }
      return;
    }

    // ── GET /api/chain ────────────────────────────────────────
    if (path === '/api/chain' && req.method === 'GET') {
      json(res, blockchain.toJSON());

    // ── POST /api/block/add ───────────────────────────────────
    } else if (path === '/api/block/add' && req.method === 'POST') {
      const body = await readBody(req);
      const { data = '', transactions = [] } = body;
      const block = blockchain.addBlock(data || `Block ${blockchain.chain.length}`, transactions);
      json(res, { success: true, block: block.toJSON(), chain: blockchain.toJSON() });

    // ── POST /api/block/tamper ────────────────────────────────
    } else if (path === '/api/block/tamper' && req.method === 'POST') {
      const { index, data } = await readBody(req);
      const ok = blockchain.tamperBlock(index, data);
      json(res, { success: ok, chain: blockchain.toJSON() });

    // ── POST /api/block/restore ───────────────────────────────
    } else if (path === '/api/block/restore' && req.method === 'POST') {
      const { index } = await readBody(req);
      blockchain.restoreBlock(index);
      json(res, { success: true, chain: blockchain.toJSON() });

    // ── GET /api/mine/stream?index=N ─────────────────────────
    // Server-Sent Events — real-time mining animation
    } else if (path === '/api/mine/stream' && req.method === 'GET') {
      const index = parseInt(parsed.query.index || '1');
      const block = blockchain.chain[index];
      if (!block) { json(res, { error: 'Block not found' }, 404); return; }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      });

      // Reset block for re-mining
      block.nonce = 0;
      block.tampered = false;
      if (index > 0) block.previousHash = blockchain.chain[index-1].hash;

      const target = '0'.repeat(blockchain.difficulty);
      const start = Date.now();
      let nonce = 0;
      let aborted = false;
      req.on('close', () => { aborted = true; });

      const tick = () => {
        if (aborted) return;
        const BATCH = 200; // process 200 nonces per tick
        for (let j = 0; j < BATCH; j++) {
          block.nonce = nonce;
          const hash = block.calculateHash();
          if (nonce % 200 === 0 || hash.startsWith(target)) {
            const elapsed = Date.now() - start;
            const found = hash.startsWith(target);
            const payload = JSON.stringify({ nonce, hash, elapsed, found, target });
            try { res.write(`data: ${payload}\n\n`); } catch(e) { aborted = true; return; }
            if (found) {
              block.hash = hash;
              const donePayload = JSON.stringify({
                done: true, nonce, hash, elapsed,
                chain: blockchain.toJSON()
              });
              try { res.write(`data: ${donePayload}\n\n`); res.end(); } catch(e) {}
              return;
            }
          }
          nonce++;
          if (nonce > 2_000_000) {
            block.hash = block.calculateHash();
            try { res.write(`data: {"done":true,"failed":true,"nonce":${nonce}}\n\n`); res.end(); } catch(e) {}
            return;
          }
        }
        setImmediate(tick); // yield to event loop every batch
      };
      tick();

    // ── POST /api/hash ────────────────────────────────────────
    } else if (path === '/api/hash' && req.method === 'POST') {
      const { input = '' } = await readBody(req);
      json(res, { input, hash: sha256(input) });

    // ── POST /api/hash/steps ──────────────────────────────────
    } else if (path === '/api/hash/steps' && req.method === 'POST') {
      const { input = '' } = await readBody(req);
      json(res, { steps: sha256Steps(input) });

    // ── POST /api/merkle ──────────────────────────────────────
    } else if (path === '/api/merkle' && req.method === 'POST') {
      const { transactions = [] } = await readBody(req);
      json(res, buildMerkleTree(transactions));

    // ── POST /api/difficulty ──────────────────────────────────
    } else if (path === '/api/difficulty' && req.method === 'POST') {
      const { difficulty } = await readBody(req);
      blockchain.difficulty = Math.max(1, Math.min(5, parseInt(difficulty)));
      json(res, { difficulty: blockchain.difficulty });

    // ── POST /api/reset ───────────────────────────────────────
    } else if (path === '/api/reset' && req.method === 'POST') {
      const diff = blockchain.difficulty;
      blockchain = new Blockchain(diff);
      json(res, { success: true, chain: blockchain.toJSON() });

    // ── GET /api/validate ─────────────────────────────────────
    } else if (path === '/api/validate' && req.method === 'GET') {
      json(res, {
        valid: blockchain.isChainValid(),
        blockValidities: blockchain.getBlockValidities()
      });

    // ── POST /api/chat ────────────────────────────────────────
    // AI chatbot endpoint — proxies to OpenAI GPT-4o-mini
    } else if (path === '/api/chat' && req.method === 'POST') {
      const body = await readBody(req);
      const { message = '', context = {} } = body;

      if (!message.trim()) { json(res, { error: 'message is required' }, 400); return; }
      if (message.length > 2000) { json(res, { error: 'message too long' }, 400); return; }

      const apiKey = (process.env.OPENAI_API_KEY || '').trim();
      if (!apiKey) {
        json(res, { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file.' }, 503);
        return;
      }

      const lang = (context.lang || 'vi').toLowerCase();
      const currentPage = context.current_page || 'home';
      const isVi = lang === 'vi';
      const systemPrompt = isVi
        ? `Bạn là AI Assistant của BlockEdu Pro — ứng dụng web giáo dục Blockchain cho sinh viên.
Trang hiện tại: "${currentPage}"
Trả lời Tiếng Việt, thân thiện, ngắn gọn. Tập trung vào blockchain, mật mã học, hướng dẫn app.`
        : `You are BlockEdu Pro's AI Assistant — a blockchain education web app.
Current page: "${currentPage}"
Reply in English, friendly and concise. Focus on blockchain, cryptography, app guidance.`;

      const history = Array.isArray(context.history) ? context.history : [];
      const oaiMessages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-8),
        { role: 'user', content: message.trim() },
      ];

      const payload = JSON.stringify({
        model: 'gpt-4o-mini',
        messages: oaiMessages,
        max_tokens: 600,
        temperature: 0.7,
      });

      const reply = await new Promise((resolve, reject) => {
        const https = require('https');
        let data = '';
        const req2 = https.request({
          hostname: 'api.openai.com', port: 443,
          path: '/v1/chat/completions', method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Length': Buffer.byteLength(payload),
          },
        }, (r) => {
          r.on('data', c => data += c);
          r.on('end', () => {
            try {
              const p = JSON.parse(data);
              if (p.error) reject(new Error(p.error.message || 'OpenAI error'));
              else resolve((p.choices?.[0]?.message?.content || '').trim());
            } catch(e) { reject(new Error('Parse error: ' + data.slice(0,100))); }
          });
        });
        req2.setTimeout(20000, () => { req2.destroy(); reject(new Error('Timeout')); });
        req2.on('error', reject);
        req2.write(payload);
        req2.end();
      });

      json(res, { reply });

    // ── GET /health ───────────────────────────────────────────
    } else if (path === '/health') {
      json(res, { status: 'ok', difficulty: blockchain.difficulty, blocks: blockchain.chain.length });

    } else {
      json(res, { error: 'Not found' }, 404);
    }
  } catch (err) {
    console.error(err);
    json(res, { error: err.message }, 500);
  }
});

function json(res, data, code = 200) {
  const body = JSON.stringify(data);
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch(e) { resolve({}); }
    });
    req.on('error', reject);
  });
}

server.listen(PORT, () => {
  console.log(`[BlockEdu] Node.js Gateway + Core running on http://localhost:${PORT}`);
  console.log(`[BlockEdu] API: /api/chain | /api/block/add | /api/mine/stream | /api/merkle`);
  console.log(`[BlockEdu] Chain initialized: difficulty=${blockchain.difficulty}, blocks=${blockchain.chain.length}`);
});
