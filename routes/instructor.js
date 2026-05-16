const User = require('../models/User');
const Question = require('../models/Question');
const QuizProgress = require('../models/QuizProgress');
const TestAttempt = require('../models/TestAttempt');
const { getUserFromReq, hasRole } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');

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

async function handleInstructorRoute(req, res, path, parsed) {
  const userInfo = getUserFromReq(req);
  if (!userInfo || !hasRole(userInfo, 'admin', 'instructor')) {
    json(res, { error: 'Instructor access required' }, 403);
    return true;
  }

  // ── GET /api/instructor/questions ────────────────────────
  if (path === '/api/instructor/questions' && req.method === 'GET') {
    const { topic, difficulty, page = '1', limit = '50' } = parsed.query || {};
    const filter = {};
    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [questions, total] = await Promise.all([
      Question.find(filter).sort({ topic: 1, difficulty: 1, qid: 1 }).skip(skip).limit(limitNum).lean(),
      Question.countDocuments(filter),
    ]);

    json(res, { questions, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    return true;
  }

  // ── POST /api/instructor/questions ───────────────────────
  if (path === '/api/instructor/questions' && req.method === 'POST') {
    const body = await readBody(req);
    const { topic, difficulty, question_vi, question_en, options_vi, options_en, correct, explanation_vi, explanation_en } = body;

    if (!topic || !difficulty || !question_vi || !question_en || !options_vi || !options_en || correct === undefined) {
      return json(res, { error: 'Missing required fields' }, 400), true;
    }

    const qid = 'Q_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const question = await Question.create({
      qid, topic, difficulty, question_vi, question_en,
      options_vi, options_en, correct,
      explanation_vi: explanation_vi || '', explanation_en: explanation_en || '',
      createdBy: userInfo.id,
    });

    logActivity(userInfo.id, 'question_create', { qid }, req);
    json(res, { success: true, question });
    return true;
  }

  // ── PUT /api/instructor/questions/:qid ───────────────────
  const editMatch = path.match(/^\/api\/instructor\/questions\/(.+)$/);
  if (editMatch && req.method === 'PUT') {
    const qid = decodeURIComponent(editMatch[1]);
    const body = await readBody(req);
    const { topic, difficulty, question_vi, question_en, options_vi, options_en, correct, explanation_vi, explanation_en } = body;

    const question = await Question.findOne({ qid });
    if (!question) return json(res, { error: 'Question not found' }, 404), true;

    if (topic) question.topic = topic;
    if (difficulty) question.difficulty = difficulty;
    if (question_vi) question.question_vi = question_vi;
    if (question_en) question.question_en = question_en;
    if (options_vi) question.options_vi = options_vi;
    if (options_en) question.options_en = options_en;
    if (correct !== undefined) question.correct = correct;
    if (explanation_vi !== undefined) question.explanation_vi = explanation_vi;
    if (explanation_en !== undefined) question.explanation_en = explanation_en;
    question.updatedAt = new Date();
    await question.save();

    logActivity(userInfo.id, 'question_edit', { qid }, req);
    json(res, { success: true, question });
    return true;
  }

  // ── DELETE /api/instructor/questions/:qid ────────────────
  if (editMatch && req.method === 'DELETE') {
    const qid = decodeURIComponent(editMatch[1]);
    const result = await Question.deleteOne({ qid });
    if (result.deletedCount === 0) return json(res, { error: 'Question not found' }, 404), true;

    logActivity(userInfo.id, 'question_delete', { qid }, req);
    json(res, { success: true });
    return true;
  }

  // ── GET /api/instructor/students ─────────────────────────
  if (path === '/api/instructor/students' && req.method === 'GET') {
    const { search, page = '1', limit = '20' } = parsed.query || {};
    const filter = { role: 'student' };
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [students, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      User.countDocuments(filter),
    ]);

    // Get quiz stats per student
    const studentIds = students.map(s => s._id);
    const [quizCounts, examCounts] = await Promise.all([
      QuizProgress.aggregate([
        { $match: { userId: { $in: studentIds } } },
        { $group: { _id: '$userId', total: { $sum: 1 }, correct: { $sum: { $cond: ['$correct', 1, 0] } } } },
      ]),
      TestAttempt.aggregate([
        { $match: { userId: { $in: studentIds }, completedAt: { $ne: null } } },
        { $group: { _id: '$userId', total: { $sum: 1 }, passed: { $sum: { $cond: ['$passed', 1, 0] } } } },
      ]),
    ]);

    const quizMap = {};
    for (const q of quizCounts) quizMap[q._id.toString()] = q;
    const examMap = {};
    for (const e of examCounts) examMap[e._id.toString()] = e;

    json(res, {
      students: students.map(s => ({
        id: s._id,
        email: s.email,
        displayName: s.displayName,
        createdAt: s.createdAt,
        quizStats: quizMap[s._id.toString()] || { total: 0, correct: 0 },
        examStats: examMap[s._id.toString()] || { total: 0, passed: 0 },
      })),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
    return true;
  }

  // ── GET /api/instructor/students/:id/progress ────────────
  const progressMatch = path.match(/^\/api\/instructor\/students\/([a-f0-9]{24})\/progress$/);
  if (progressMatch && req.method === 'GET') {
    const studentId = progressMatch[1];
    const student = await User.findOne({ _id: studentId, role: 'student' }).select('-password').lean();
    if (!student) return json(res, { error: 'Student not found' }, 404), true;

    const [progress, attempts, certs] = await Promise.all([
      QuizProgress.find({ userId: studentId }).lean(),
      TestAttempt.find({ userId: studentId }).sort({ startedAt: -1 }).lean(),
      require('../models/Certificate').find({ userId: studentId }).lean(),
    ]);

    const quizStats = {
      total: progress.length,
      correct: progress.filter(p => p.correct).length,
      byTopic: {},
      byDifficulty: { easy: { total: 0, correct: 0 }, medium: { total: 0, correct: 0 }, hard: { total: 0, correct: 0 } },
    };
    for (const p of progress) {
      if (!quizStats.byTopic[p.topic]) quizStats.byTopic[p.topic] = { total: 0, correct: 0 };
      quizStats.byTopic[p.topic].total++;
      if (p.correct) quizStats.byTopic[p.topic].correct++;
      if (quizStats.byDifficulty[p.difficulty]) {
        quizStats.byDifficulty[p.difficulty].total++;
        if (p.correct) quizStats.byDifficulty[p.difficulty].correct++;
      }
    }

    json(res, {
      student: { id: student._id, email: student.email, displayName: student.displayName, createdAt: student.createdAt },
      quizStats,
      examAttempts: attempts.map(a => ({
        id: a._id, score: a.score, totalQuestions: a.totalQuestions,
        passed: a.passed, startedAt: a.startedAt, completedAt: a.completedAt,
      })),
      certificates: certs.map(c => ({ certCode: c.certCode, score: c.score, issuedAt: c.issuedAt })),
    });
    return true;
  }

  return false;
}

module.exports = { handleInstructorRoute };
