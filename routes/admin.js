const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const QuizProgress = require('../models/QuizProgress');
const TestAttempt = require('../models/TestAttempt');
const Certificate = require('../models/Certificate');
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

async function handleAdminRoute(req, res, path, parsed) {
  // All admin routes require admin role
  const userInfo = getUserFromReq(req);
  if (!userInfo || !hasRole(userInfo, 'admin')) {
    json(res, { error: 'Admin access required' }, 403);
    return true;
  }

  // ── GET /api/admin/stats ─────────────────────────────────
  if (path === '/api/admin/stats' && req.method === 'GET') {
    const totalUsers = await User.countDocuments();
    const studentCount = await User.countDocuments({ role: 'student' });
    const instructorCount = await User.countDocuments({ role: 'instructor' });
    const adminCount = await User.countDocuments({ role: 'admin' });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const registeredToday = await User.countDocuments({ createdAt: { $gte: todayStart } });
    const registeredWeek = await User.countDocuments({ createdAt: { $gte: weekStart } });
    const registeredMonth = await User.countDocuments({ createdAt: { $gte: monthStart } });

    const totalExams = await TestAttempt.countDocuments({ completedAt: { $ne: null } });
    const passedExams = await TestAttempt.countDocuments({ passed: true });
    const totalCerts = await Certificate.countDocuments();
    const totalQuizAnswers = await QuizProgress.countDocuments();
    const correctQuizAnswers = await QuizProgress.countDocuments({ correct: true });

    json(res, {
      users: { total: totalUsers, students: studentCount, instructors: instructorCount, admins: adminCount },
      registrations: { today: registeredToday, week: registeredWeek, month: registeredMonth },
      exams: { total: totalExams, passed: passedExams },
      certificates: totalCerts,
      quiz: { totalAnswers: totalQuizAnswers, correctAnswers: correctQuizAnswers },
    });
    return true;
  }

  // ── GET /api/admin/users ─────────────────────────────────
  if (path === '/api/admin/users' && req.method === 'GET') {
    const { role, search, page = '1', limit = '20' } = parsed.query || {};
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      User.countDocuments(filter),
    ]);

    json(res, {
      users: users.map(u => ({ ...u, id: u._id })),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
    return true;
  }

  // ── GET /api/admin/users/:id ─────────────────────────────
  const userDetailMatch = path.match(/^\/api\/admin\/users\/([a-f0-9]{24})$/);
  if (userDetailMatch && req.method === 'GET') {
    const targetId = userDetailMatch[1];
    const targetUser = await User.findById(targetId).select('-password').lean();
    if (!targetUser) return json(res, { error: 'User not found' }, 404), true;

    const [quizProgress, examAttempts, certificates] = await Promise.all([
      QuizProgress.find({ userId: targetId }).lean(),
      TestAttempt.find({ userId: targetId }).sort({ startedAt: -1 }).lean(),
      Certificate.find({ userId: targetId }).lean(),
    ]);

    const quizStats = {
      total: quizProgress.length,
      correct: quizProgress.filter(p => p.correct).length,
    };

    json(res, {
      user: { ...targetUser, id: targetUser._id },
      quizStats,
      examAttempts: examAttempts.map(a => ({
        id: a._id, score: a.score, totalQuestions: a.totalQuestions,
        passed: a.passed, startedAt: a.startedAt, completedAt: a.completedAt,
      })),
      certificates: certificates.map(c => ({
        certCode: c.certCode, score: c.score, issuedAt: c.issuedAt,
      })),
    });
    return true;
  }

  // ── PATCH /api/admin/users/:id/role ──────────────────────
  const roleMatch = path.match(/^\/api\/admin\/users\/([a-f0-9]{24})\/role$/);
  if (roleMatch && req.method === 'PATCH') {
    const targetId = roleMatch[1];
    const { role: newRole } = await readBody(req);
    if (!['admin', 'instructor', 'student'].includes(newRole)) {
      return json(res, { error: 'Invalid role. Must be admin, instructor, or student' }, 400), true;
    }
    const targetUser = await User.findById(targetId);
    if (!targetUser) return json(res, { error: 'User not found' }, 404), true;

    const oldRole = targetUser.role;
    targetUser.role = newRole;
    await targetUser.save();

    logActivity(userInfo.id, 'role_change', { targetUserId: targetId, oldRole, newRole }, req);

    json(res, {
      success: true,
      user: { id: targetUser._id, email: targetUser.email, displayName: targetUser.displayName, role: targetUser.role },
    });
    return true;
  }

  // ── GET /api/admin/logs ──────────────────────────────────
  if (path === '/api/admin/logs' && req.method === 'GET') {
    const { userId, action, startDate, endDate, page = '1', limit = '50' } = parsed.query || {};
    const filter = {};
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      ActivityLog.countDocuments(filter),
    ]);

    // Populate user display names
    const userIds = [...new Set(logs.map(l => l.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } }).select('displayName email').lean();
    const userMap = {};
    for (const u of users) userMap[u._id.toString()] = { displayName: u.displayName, email: u.email };

    json(res, {
      logs: logs.map(l => ({
        id: l._id,
        userId: l.userId,
        userName: userMap[l.userId.toString()]?.displayName || 'Unknown',
        userEmail: userMap[l.userId.toString()]?.email || '',
        action: l.action,
        details: l.details,
        ip: l.ip,
        createdAt: l.createdAt,
      })),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
    return true;
  }

  return false;
}

module.exports = { handleAdminRoute };
