const path_m = require('path');
const fs = require('fs');
const QuizProgress = require('../models/QuizProgress');
const TestAttempt = require('../models/TestAttempt');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const { getUserFromReq } = require('../middleware/auth');

// Load questions once
let ALL_QUESTIONS = [];
try {
  const qPath = path_m.join(__dirname, '..', 'src', 'data', 'quiz_questions.json');
  ALL_QUESTIONS = JSON.parse(fs.readFileSync(qPath, 'utf8'));
  console.log(`[BlockEdu] Loaded ${ALL_QUESTIONS.length} quiz questions.`);
} catch (e) {
  console.warn('[BlockEdu] Could not load quiz_questions.json:', e.message);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { resolve({}); }
    });
    req.on('error', reject);
  });
}

function json(res, data, code = 200) {
  const body = JSON.stringify(data);
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(body);
}

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function handleQuizRoute(req, res, path, parsed) {
  // ── GET /api/quiz/questions ──────────────────────────────
  // Public: returns questions (with answers for practice mode)
  if (path === '/api/quiz/questions' && req.method === 'GET') {
    const { topic, difficulty } = parsed.query || {};
    let filtered = ALL_QUESTIONS;
    if (topic) filtered = filtered.filter(q => q.topic === topic);
    if (difficulty) filtered = filtered.filter(q => q.difficulty === difficulty);
    json(res, { total: filtered.length, questions: filtered });
    return true;
  }

  // ── GET /api/quiz/topics ─────────────────────────────────
  if (path === '/api/quiz/topics' && req.method === 'GET') {
    const topicMap = {};
    for (const q of ALL_QUESTIONS) {
      if (!topicMap[q.topic]) topicMap[q.topic] = { easy: 0, medium: 0, hard: 0, total: 0 };
      topicMap[q.topic][q.difficulty]++;
      topicMap[q.topic].total++;
    }
    json(res, { topics: topicMap });
    return true;
  }

  // ── POST /api/quiz/progress ──────────────────────────────
  // Save practice progress (requires auth)
  if (path === '/api/quiz/progress' && req.method === 'POST') {
    const userId = getUserFromReq(req);
    if (!userId) return json(res, { error: 'Authentication required' }, 401), true;

    const { questionId, selectedAnswer, correct, topic, difficulty } = await readBody(req);
    if (!questionId || selectedAnswer === undefined || correct === undefined) {
      return json(res, { error: 'questionId, selectedAnswer, correct are required' }, 400), true;
    }

    await QuizProgress.findOneAndUpdate(
      { userId, questionId },
      { userId, questionId, selectedAnswer, correct, topic, difficulty, answeredAt: new Date() },
      { upsert: true, new: true }
    );
    json(res, { success: true });
    return true;
  }

  // ── GET /api/quiz/progress ───────────────────────────────
  if (path === '/api/quiz/progress' && req.method === 'GET') {
    const userId = getUserFromReq(req);
    if (!userId) return json(res, { error: 'Authentication required' }, 401), true;

    const progress = await QuizProgress.find({ userId }).lean();
    const stats = {
      total: progress.length,
      correct: progress.filter(p => p.correct).length,
      byTopic: {},
      byDifficulty: { easy: { total: 0, correct: 0 }, medium: { total: 0, correct: 0 }, hard: { total: 0, correct: 0 } },
    };
    for (const p of progress) {
      if (!stats.byTopic[p.topic]) stats.byTopic[p.topic] = { total: 0, correct: 0 };
      stats.byTopic[p.topic].total++;
      if (p.correct) stats.byTopic[p.topic].correct++;
      if (stats.byDifficulty[p.difficulty]) {
        stats.byDifficulty[p.difficulty].total++;
        if (p.correct) stats.byDifficulty[p.difficulty].correct++;
      }
    }
    json(res, { progress, stats });
    return true;
  }

  // ── POST /api/exam/start ─────────────────────────────────
  // Start a new exam: pick 40 random questions
  if (path === '/api/exam/start' && req.method === 'POST') {
    const userId = getUserFromReq(req);
    if (!userId) return json(res, { error: 'Authentication required' }, 401), true;

    // Distribution: 16 easy, 16 medium, 8 hard
    const easy = shuffle(ALL_QUESTIONS.filter(q => q.difficulty === 'easy')).slice(0, 16);
    const medium = shuffle(ALL_QUESTIONS.filter(q => q.difficulty === 'medium')).slice(0, 16);
    const hard = shuffle(ALL_QUESTIONS.filter(q => q.difficulty === 'hard')).slice(0, 8);
    const examQuestions = shuffle([...easy, ...medium, ...hard]);

    const attempt = await TestAttempt.create({
      userId,
      questions: examQuestions.map(q => ({ questionId: q.id, selectedAnswer: -1, correct: false })),
      startedAt: new Date(),
    });

    // Return questions WITHOUT correct answers
    const safeQuestions = examQuestions.map(q => ({
      id: q.id,
      topic: q.topic,
      difficulty: q.difficulty,
      question_vi: q.question_vi,
      question_en: q.question_en,
      options_vi: q.options_vi,
      options_en: q.options_en,
    }));

    json(res, { attemptId: attempt._id, questions: safeQuestions, startedAt: attempt.startedAt, timeLimit: 3600 });
    return true;
  }

  // ── POST /api/exam/submit ────────────────────────────────
  if (path === '/api/exam/submit' && req.method === 'POST') {
    const userId = getUserFromReq(req);
    if (!userId) return json(res, { error: 'Authentication required' }, 401), true;

    const { attemptId, answers } = await readBody(req);
    if (!attemptId || !answers) {
      return json(res, { error: 'attemptId and answers are required' }, 400), true;
    }

    const attempt = await TestAttempt.findOne({ _id: attemptId, userId });
    if (!attempt) return json(res, { error: 'Test attempt not found' }, 404), true;
    if (attempt.completedAt) return json(res, { error: 'Test already submitted' }, 400), true;

    // Check time limit (allow 30s grace)
    const elapsed = (Date.now() - new Date(attempt.startedAt).getTime()) / 1000;
    if (elapsed > attempt.timeLimit + 30) {
      return json(res, { error: 'Time limit exceeded' }, 400), true;
    }

    // Grade the exam
    const questionsMap = {};
    for (const q of ALL_QUESTIONS) questionsMap[q.id] = q;

    let score = 0;
    const gradedQuestions = attempt.questions.map(aq => {
      const userAnswer = answers[aq.questionId] !== undefined ? answers[aq.questionId] : -1;
      const questionData = questionsMap[aq.questionId];
      const correct = questionData ? userAnswer === questionData.correct : false;
      if (correct) score++;
      return { questionId: aq.questionId, selectedAnswer: userAnswer, correct };
    });

    attempt.questions = gradedQuestions;
    attempt.score = score;
    attempt.completedAt = new Date();
    attempt.passed = score >= 28; // 70% of 40
    await attempt.save();

    // If passed, create certificate
    let certificate = null;
    if (attempt.passed) {
      const user = await User.findById(userId);
      const certCode = Certificate.generateCertCode();
      certificate = await Certificate.create({
        userId,
        certCode,
        displayName: user.displayName,
        email: user.email,
        score,
        totalQuestions: 40,
        testAttemptId: attempt._id,
      });
    }

    // Build detailed results with correct answers & explanations
    const detailedResults = attempt.questions.map(aq => {
      const q = questionsMap[aq.questionId];
      return {
        questionId: aq.questionId,
        selectedAnswer: aq.selectedAnswer,
        correct: aq.correct,
        correctAnswer: q ? q.correct : null,
        question_vi: q ? q.question_vi : '',
        question_en: q ? q.question_en : '',
        options_vi: q ? q.options_vi : [],
        options_en: q ? q.options_en : [],
        explanation_vi: q ? q.explanation_vi : '',
        explanation_en: q ? q.explanation_en : '',
      };
    });

    json(res, {
      score,
      totalQuestions: 40,
      passed: attempt.passed,
      certificate: certificate ? { certCode: certificate.certCode, displayName: certificate.displayName, issuedAt: certificate.issuedAt } : null,
      results: detailedResults,
    });
    return true;
  }

  // ── GET /api/exam/history ────────────────────────────────
  if (path === '/api/exam/history' && req.method === 'GET') {
    const userId = getUserFromReq(req);
    if (!userId) return json(res, { error: 'Authentication required' }, 401), true;

    const attempts = await TestAttempt.find({ userId }).sort({ startedAt: -1 }).lean();
    json(res, {
      attempts: attempts.map(a => ({
        id: a._id,
        score: a.score,
        totalQuestions: a.totalQuestions,
        passed: a.passed,
        startedAt: a.startedAt,
        completedAt: a.completedAt,
      })),
    });
    return true;
  }

  // ── GET /api/cert/my ─────────────────────────────────────
  if (path === '/api/cert/my' && req.method === 'GET') {
    const userId = getUserFromReq(req);
    if (!userId) return json(res, { error: 'Authentication required' }, 401), true;

    const certs = await Certificate.find({ userId }).sort({ issuedAt: -1 }).lean();
    json(res, { certificates: certs });
    return true;
  }

  // ── GET /api/cert/verify/:code ───────────────────────────
  if (path.startsWith('/api/cert/verify/') && req.method === 'GET') {
    const code = path.split('/api/cert/verify/')[1];
    if (!code) return json(res, { error: 'Certificate code required' }, 400), true;

    const cert = await Certificate.findOne({ certCode: code }).lean();
    if (!cert) return json(res, { valid: false, error: 'Certificate not found' }, 404), true;

    json(res, {
      valid: true,
      certificate: {
        certCode: cert.certCode,
        displayName: cert.displayName,
        score: cert.score,
        totalQuestions: cert.totalQuestions,
        issuedAt: cert.issuedAt,
      },
    });
    return true;
  }

  return false; // not handled
}

module.exports = { handleQuizRoute };
