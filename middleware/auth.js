const jwt = require('jsonwebtoken');

const JWT_SECRET = () => process.env.JWT_SECRET || 'hubblock_default_secret_change_me';

function signToken(userId, role = 'student') {
  return jwt.sign({ id: userId, role }, JWT_SECRET(), { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET());
  } catch {
    return null;
  }
}

// Extract user info from Authorization header. Returns { id, role } or null.
function getUserFromReq(req) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const decoded = verifyToken(token);
  return decoded ? { id: decoded.id, role: decoded.role || 'student' } : null;
}

// Middleware-style check: returns true if user has one of the allowed roles
function hasRole(userInfo, ...roles) {
  if (!userInfo) return false;
  return roles.includes(userInfo.role);
}

module.exports = { signToken, verifyToken, getUserFromReq, hasRole };
