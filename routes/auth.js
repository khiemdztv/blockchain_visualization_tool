const bcrypt = require('bcryptjs');
const https = require('https');
const User = require('../models/User');
const { signToken, getUserFromReq } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLogger');

// Helper: read request body as JSON
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

// Verify Google ID token and return user info
function verifyGoogleToken(idToken) {
  return new Promise((resolve, reject) => {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
    https.get(url, (r) => {
      let data = '';
      r.on('data', c => data += c);
      r.on('end', () => {
        try {
          const info = JSON.parse(data);
          if (info.error_description) return reject(new Error(info.error_description));
          resolve({
            googleId: info.sub,
            email: info.email,
            displayName: info.name || info.email.split('@')[0],
            avatar: info.picture || '',
          });
        } catch (e) { reject(new Error('Failed to parse Google token info')); }
      });
    }).on('error', reject);
  });
}

// Returns true if the route was handled, false otherwise
async function handleAuthRoute(req, res, path) {
  // ── POST /api/auth/register ──────────────────────────────
  if (path === '/api/auth/register' && req.method === 'POST') {
    const { email, password, displayName } = await readBody(req);
    if (!email || !password || !displayName) {
      return json(res, { error: 'email, password, displayName are required' }, 400), true;
    }
    if (password.length < 6) {
      return json(res, { error: 'Password must be at least 6 characters' }, 400), true;
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return json(res, { error: 'Email already registered' }, 409), true;
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashed,
      displayName: displayName.trim(),
      authProvider: 'local',
    });
    const token = signToken(user._id, user.role || 'student');
    logActivity(user._id, 'register', { authProvider: 'local' }, req);
    json(res, {
      token,
      user: { id: user._id, email: user.email, displayName: user.displayName, avatar: user.avatar, authProvider: user.authProvider, role: user.role || 'student' },
    });
    return true;
  }

  // ── POST /api/auth/login ─────────────────────────────────
  if (path === '/api/auth/login' && req.method === 'POST') {
    const { email, password } = await readBody(req);
    if (!email || !password) {
      return json(res, { error: 'email and password are required' }, 400), true;
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.password) {
      return json(res, { error: 'Invalid email or password' }, 401), true;
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return json(res, { error: 'Invalid email or password' }, 401), true;
    }
    const token = signToken(user._id, user.role || 'student');
    logActivity(user._id, 'login', { authProvider: 'local' }, req);
    json(res, {
      token,
      user: { id: user._id, email: user.email, displayName: user.displayName, avatar: user.avatar, authProvider: user.authProvider, role: user.role || 'student' },
    });
    return true;
  }

  // ── POST /api/auth/google ────────────────────────────────
  if (path === '/api/auth/google' && req.method === 'POST') {
    const { idToken } = await readBody(req);
    if (!idToken) {
      return json(res, { error: 'idToken is required' }, 400), true;
    }
    let info;
    try {
      info = await verifyGoogleToken(idToken);
    } catch (err) {
      return json(res, { error: 'Invalid Google token: ' + err.message }, 401), true;
    }
    // Find or create user
    let user = await User.findOne({ $or: [{ googleId: info.googleId }, { email: info.email }] });
    if (user) {
      // Update google info if needed
      if (!user.googleId) {
        user.googleId = info.googleId;
        user.authProvider = 'google';
        if (info.avatar) user.avatar = info.avatar;
        await user.save();
      }
    } else {
      user = await User.create({
        email: info.email,
        displayName: info.displayName,
        avatar: info.avatar,
        authProvider: 'google',
        googleId: info.googleId,
      });
    }
    const token = signToken(user._id, user.role || 'student');
    logActivity(user._id, 'login', { authProvider: 'google' }, req);
    json(res, {
      token,
      user: { id: user._id, email: user.email, displayName: user.displayName, avatar: user.avatar, authProvider: user.authProvider, role: user.role || 'student' },
    });
    return true;
  }

  // ── GET /api/auth/me ─────────────────────────────────────
  if (path === '/api/auth/me' && req.method === 'GET') {
    const userInfo = getUserFromReq(req);
    if (!userInfo) {
      return json(res, { error: 'Not authenticated' }, 401), true;
    }
    const user = await User.findById(userInfo.id).select('-password');
    if (!user) {
      return json(res, { error: 'User not found' }, 404), true;
    }
    json(res, {
      user: { id: user._id, email: user.email, displayName: user.displayName, avatar: user.avatar, authProvider: user.authProvider, role: user.role || 'student', createdAt: user.createdAt },
    });
    return true;
  }

  return false; // not handled
}

module.exports = { handleAuthRoute };
