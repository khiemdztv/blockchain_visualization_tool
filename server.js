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

// ═══════════════════════════════════════════════════════════════
// READ .env FILE FIRST (before any module that uses env vars)
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
  } else {
    console.warn('[BlockEdu] No .env file found — create one with MONGODB_URI, JWT_SECRET, etc.');
  }
} catch (envErr) {
  console.warn('[BlockEdu] Could not read .env:', envErr.message);
}

const PORT = process.env.PORT || 3001;

// ═══════════════════════════════════════════════════════════════
// DATABASE & ROUTE MODULES
// ═══════════════════════════════════════════════════════════════
const { connectDB } = require('./db');
const { handleAuthRoute } = require('./routes/auth');
const { handleQuizRoute } = require('./routes/quiz');
const { handleAdminRoute } = require('./routes/admin');
const { handleInstructorRoute } = require('./routes/instructor');
const { seedAdmin } = require('./seed_admin');
const { getUserFromReq } = require('./middleware/auth');

// ═══════════════════════════════════════════════════════════════
// RAG ENGINE — load on startup
// ═══════════════════════════════════════════════════════════════
const ragEngine = require('./rag_engine');
ragEngine.init().then(() => {
  console.log('[BlockEdu] RAG engine initialized.');
}).catch(e => {
  console.warn('[BlockEdu] RAG engine init failed (chatbot will use base mode):', e.message);
});

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;

  try {
    // ── Serve static files (Vite output: dist/) ───────────────
    if (req.method === 'GET' && !path.startsWith('/api/')) {
      let reqPath = path === '/' ? '/index.html' : path;
      // Prefer Vite build output (dist/). If an asset isn't present there
      // (e.g. fresh asset added under public/ but dist not rebuilt in some environments),
      // fall back to public/ before SPA index.html.
      let filePath = path_m.join(__dirname, 'dist', reqPath);
      
      if (!fs.existsSync(filePath)) {
        const publicPath = path_m.join(__dirname, 'public', reqPath);
        if (fs.existsSync(publicPath)) {
          filePath = publicPath;
        } else {
          // Fallback for React Router / SPA
          filePath = path_m.join(__dirname, 'dist', 'index.html');
        }
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

    // ── AUTH & QUIZ ROUTES (delegated to modules) ──────────
    if (path.startsWith('/api/auth/')) {
      const handled = await handleAuthRoute(req, res, path);
      if (handled) return;
    }
    if (path.startsWith('/api/admin/')) {
      const handled = await handleAdminRoute(req, res, path, parsed);
      if (handled) return;
    }
    if (path.startsWith('/api/instructor/')) {
      const handled = await handleInstructorRoute(req, res, path, parsed);
      if (handled) return;
    }
    if (path.startsWith('/api/quiz/') || path.startsWith('/api/exam/') || path.startsWith('/api/cert/')) {
      const handled = await handleQuizRoute(req, res, path, parsed);
      if (handled) return;
    }

    // ── GET /api/config ───────────────────────────────────────
    if (path === '/api/config' && req.method === 'GET') {
      json(res, {
        googleClientId: process.env.GOOGLE_CLIENT_ID || '',
      });
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
    // AI chatbot endpoint — RAG-powered, proxies to Google Gemini (OpenAI-compatible)
    } else if (path === '/api/chat' && req.method === 'POST') {
      const body = await readBody(req);
      const { message = '', context = {} } = body;

      if (!message.trim()) { json(res, { error: 'message is required' }, 400); return; }
      if (message.length > 2000) { json(res, { error: 'message too long' }, 400); return; }

      // Priority: Groq > Gemini > OpenAI
      const groqKey = (process.env.GROQ_API_KEY || '').trim();
      const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
      const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
      const provider = groqKey ? 'groq' : geminiKey ? 'gemini' : openaiKey ? 'openai' : null;
      const apiKey = groqKey || geminiKey || openaiKey;
      if (!provider) {
        json(res, { error: 'AI API key not configured. Add GROQ_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY to .env' }, 503);
        return;
      }

      const lang = (context.lang || 'vi').toLowerCase();
      const currentPage = context.current_page || 'home';
      const isVi = lang === 'vi';

      // ── Detect user role from token ────────────────────────────
      const chatUserInfo = getUserFromReq(req);
      const userRole = chatUserInfo ? chatUserInfo.role : 'student';

      // ── Admin data context ─────────────────────────────────────
      let adminDataContext = '';
      if (userRole === 'admin') {
        const adminKeywords = /nguoi dung|người dùng|user|dang ky|đăng ký|register|thong ke|thống kê|statistic|tien do|tiến độ|progress|bao nhieu|bao nhiêu|how many|tong|tổng|total|hoc sinh|học sinh|student|giang vien|giảng viên|instructor|tai khoan|tài khoản|account|log|hoat dong|hoạt động|activity|quiz|exam|chung chi|chứng chỉ|certificate/i;
        if (adminKeywords.test(message)) {
          try {
            const User_m = require('./models/User');
            const QP = require('./models/QuizProgress');
            const TA = require('./models/TestAttempt');
            const Cert = require('./models/Certificate');
            const AL = require('./models/ActivityLog');

            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);

            const [totalUsers, students, instructors, admins, regToday, regWeek,
                   totalExams, passedExams, totalCerts, totalQuiz, correctQuiz,
                   recentLogs] = await Promise.all([
              User_m.countDocuments(),
              User_m.countDocuments({ role: 'student' }),
              User_m.countDocuments({ role: 'instructor' }),
              User_m.countDocuments({ role: 'admin' }),
              User_m.countDocuments({ createdAt: { $gte: todayStart } }),
              User_m.countDocuments({ createdAt: { $gte: weekStart } }),
              TA.countDocuments({ completedAt: { $ne: null } }),
              TA.countDocuments({ passed: true }),
              Cert.countDocuments(),
              QP.countDocuments(),
              QP.countDocuments({ correct: true }),
              AL.find().sort({ createdAt: -1 }).limit(10).lean(),
            ]);

            const recentLogsStr = recentLogs.map(l => `- ${l.action} (${new Date(l.createdAt).toISOString().slice(0,16)})`).join('\n');

            adminDataContext = isVi
              ? `\n\nDỮ LIỆU HỆ THỐNG (chỉ admin mới thấy):
- Tổng người dùng: ${totalUsers} (Học sinh: ${students}, Giảng viên: ${instructors}, Admin: ${admins})
- Đăng ký hôm nay: ${regToday}, tuần này: ${regWeek}
- Bài thi đã nộp: ${totalExams}, đậu: ${passedExams}
- Chứng chỉ đã cấp: ${totalCerts}
- Câu quiz đã trả lời: ${totalQuiz}, đúng: ${correctQuiz} (${totalQuiz > 0 ? Math.round(correctQuiz/totalQuiz*100) : 0}%)
- 10 hoạt động gần nhất:\n${recentLogsStr}`
              : `\n\nSYSTEM DATA (admin-only):
- Total users: ${totalUsers} (Students: ${students}, Instructors: ${instructors}, Admins: ${admins})
- Registered today: ${regToday}, this week: ${regWeek}
- Exams submitted: ${totalExams}, passed: ${passedExams}
- Certificates issued: ${totalCerts}
- Quiz answers: ${totalQuiz}, correct: ${correctQuiz} (${totalQuiz > 0 ? Math.round(correctQuiz/totalQuiz*100) : 0}%)
- 10 recent activities:\n${recentLogsStr}`;
          } catch (adminErr) {
            console.warn('[Chat] Admin data query failed:', adminErr.message);
          }
        }
      }

      // ── Web knowledge context ──────────────────────────────────
      const webKnowledge = isVi
        ? `\nVỀ WEBSITE BlockEdu Pro (HubBlock):
Website giáo dục Blockchain tương tác gồm các tính năng:
- Trang chủ (Home): Giới thiệu tổng quan, điểm nổi bật
- Demo Hash (SHA-256): Nhập text → thấy hash realtime, minh họa thuật toán băm
- Mining: Mô phỏng đào block realtime (nonce, difficulty, Proof of Work)
- RSA Demo: Mã hóa/giải mã RSA, chữ ký số, tạo key pair
- Quiz & Exam: Ôn tập trắc nghiệm theo chủ đề, thi thử 40 câu có thời gian, cấp chứng chỉ
- Hồ sơ (Profile): Xem tiến độ học, lịch sử thi, chứng chỉ
- AI Chatbot: Trợ lý AI học blockchain, được huấn luyện trên 14 tài liệu nghiên cứu
Hệ thống có 3 vai trò: Admin (quản trị toàn bộ), Giảng viên (quản lý quiz + xem tiến độ học sinh), Học sinh (học + làm bài).`
        : `\nABOUT BlockEdu Pro (HubBlock) WEBSITE:
An interactive Blockchain education web app with features:
- Home: Overview and highlights
- Hash Demo (SHA-256): Type text → see hash in realtime, hash algorithm visualization
- Mining: Realtime block mining simulation (nonce, difficulty, Proof of Work)
- RSA Demo: RSA encrypt/decrypt, digital signatures, key pair generation
- Quiz & Exam: Topic-based practice quizzes, 40-question timed exams, certificate issuance
- Profile: View progress, exam history, certificates
- AI Chatbot: AI learning assistant trained on 14 research documents
System has 3 roles: Admin (full management), Instructor (quiz management + view student progress), Student (learn + take quizzes).`;

      // ── RAG: Retrieve relevant chunks ──────────────────────────
      let ragContext = '';
      let sources = [];
      try {
        const ragK = adminDataContext ? 4 : 20; // fewer RAG chunks when admin data is present
        const relevantChunks = await ragEngine.searchSimilar(message.trim(), ragK);
        if (relevantChunks.length > 0) {
          ragContext = ragEngine.buildRAGContext(relevantChunks, lang);
          sources = ragEngine.buildSourcesList(relevantChunks);
        }
      } catch (ragErr) {
        console.warn('[RAG] Search failed, using base mode:', ragErr.message);
      }

      // Generate the list of all available books
      const allBooks = Object.values(require('./rag_titles').DOC_TITLES).join('\n- ');

      // ── Build system prompt with RAG context ───────────────────
      let systemPrompt;
      if (ragContext) {
        systemPrompt = isVi
          ? `Bạn là AI Assistant của BlockEdu Pro — ứng dụng giáo dục Blockchain.
Trang hiện tại: "${currentPage}"
Bạn đã được huấn luyện sẵn trên 14 bộ tài liệu sau: 
- ${allBooks}

Dựa trên truy vấn hiện tại, hệ thống đã trích xuất các đoạn văn bản (TÀI LIỆU) liên quan nhất như sau:

${ragContext}

QUY TẮC QUAN TRỌNG:
1. Trả lời Tiếng Việt, thân thiện, rõ ràng và có chiều sâu học thuật.
2. LUÔN trích dẫn nguồn ngay dước đoạn văn dựa theo đúng format ở phần TÀI LIỆU (KHÔNG DÙNG "Nguồn 1", "Nguồn 2", mà phải dùng trực tiếp Tên sách). Ví dụ: [Tên Sách, tr. X]
3. TUYỆT ĐỐI KHÔNG dùng định dạng toán học LaTeX (như \\(, \\), \\[, \\]). Dùng text bình thường và các ký hiệu thông dụng (ví dụ: c = m^e mod n).
4. Nếu thông tin không có trong tài liệu trên, hãy nói rõ: "Theo kiến thức chung..."
5. Ưu tiên thông tin từ tài liệu hơn kiến thức nền.${webKnowledge}${adminDataContext}`
          : `You are BlockEdu Pro's AI Assistant — a blockchain education web app.
Current page: "${currentPage}"
You have been trained on the following 14 documents:
- ${allBooks}

Based on the current query, the system has extracted the following most relevant DOCUMENTS:

${ragContext}

IMPORTANT RULES:
1. Reply in English, friendly and academically precise.
2. ALWAYS cite sources in your answer using the exact format provided in DOCUMENTS (DO NOT use "Source 1", "Source 2", but use the Book Title directly). Example: [Book Title, p. X]
3. DO NOT use LaTeX math formatting like \\( \\) or \\[ \\]. Use plain text and standard symbols (e.g. c = m^e mod n).
4. If information is not in the documents above, clearly state: "Based on general knowledge..."
5. Prioritize document information over general knowledge.${webKnowledge}${adminDataContext}`;
      } else {
        systemPrompt = isVi
          ? `Bạn là AI Assistant của BlockEdu Pro — ứng dụng web giáo dục Blockchain cho sinh viên.
Trang hiện tại: "${currentPage}"
Trả lời Tiếng Việt, thân thiện, ngắn gọn. Tập trung vào blockchain, mật mã học, hướng dẫn app.${webKnowledge}${adminDataContext}`
          : `You are BlockEdu Pro's AI Assistant — a blockchain education web app.
Current page: "${currentPage}"
Reply in English, friendly and concise. Focus on blockchain, cryptography, app guidance.${webKnowledge}${adminDataContext}`;
      }

      const history = Array.isArray(context.history) ? context.history : [];
      const oaiMessages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6),
        { role: 'user', content: message.trim() },
      ];

      const AI_CFG = {
        groq:   { model: 'llama-3.3-70b-versatile', hostname: 'api.groq.com', path: '/openai/v1/chat/completions' },
        gemini: { model: 'gemini-2.0-flash',        hostname: 'generativelanguage.googleapis.com', path: '/v1beta/openai/chat/completions' },
        openai: { model: 'gpt-4o-mini',             hostname: 'api.openai.com', path: '/v1/chat/completions' },
      };
      const cfg = AI_CFG[provider];
      const payload = JSON.stringify({
        model: cfg.model,
        messages: oaiMessages,
        max_tokens: 800,
        temperature: 0.5,
      });

      const reply = await new Promise((resolve, reject) => {
        const https = require('https');
        let data = '';
        const req2 = https.request({
          hostname: cfg.hostname, port: 443,
          path: cfg.path, method: 'POST',
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
              if (p.error) reject(new Error(p.error.message || 'AI API error'));
              else resolve((p.choices?.[0]?.message?.content || '').trim());
            } catch(e) { reject(new Error('Parse error: ' + data.slice(0,100))); }
          });
        });
        req2.setTimeout(30000, () => { req2.destroy(); reject(new Error('Timeout')); });
        req2.on('error', reject);
        req2.write(payload);
        req2.end();
      });

      json(res, { reply, sources });

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

// Connect to MongoDB before starting server, then seed admin
connectDB().then(async (ok) => {
  console.log('[BlockEdu] Database module initialized.');
  if (ok) {
    await seedAdmin();
    // Migrate JSON questions to DB if empty
    const Question = require('./models/Question');
    const count = await Question.countDocuments();
    if (count === 0) {
      try {
        const qPath = require('path').join(__dirname, 'src', 'data', 'quiz_questions.json');
        const qs = JSON.parse(require('fs').readFileSync(qPath, 'utf8'));
        const docs = qs.map(q => ({ qid: q.id, topic: q.topic, difficulty: q.difficulty, question_vi: q.question_vi, question_en: q.question_en, options_vi: q.options_vi, options_en: q.options_en, correct: q.correct, explanation_vi: q.explanation_vi || '', explanation_en: q.explanation_en || '' }));
        await Question.insertMany(docs);
        console.log(`[BlockEdu] Migrated ${docs.length} questions to MongoDB.`);
      } catch (e) { console.warn('[BlockEdu] Question migration skipped:', e.message); }
    }
  }
}).catch(e => {
  console.warn('[BlockEdu] DB init warning:', e.message);
});

server.listen(PORT, () => {
  console.log(`[BlockEdu] Node.js Gateway + Core running on http://localhost:${PORT}`);
  console.log(`[BlockEdu] API: /api/chain | /api/block/add | /api/mine/stream | /api/merkle`);
  console.log(`[BlockEdu] Chain initialized: difficulty=${blockchain.difficulty}, blocks=${blockchain.chain.length}`);
});
