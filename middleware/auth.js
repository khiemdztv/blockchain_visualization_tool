const jwt = require('jsonwebtoken');

const JWT_SECRET = () => process.env.JWT_SECRET || 'hubblock_default_secret_change_me';

function signToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET(), { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET());
  } catch {
    return null;
  }
}

// Extract user ID from Authorization header. Returns userId or null.
function getUserFromReq(req) {
  const auth = req.headers['authorization'] || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const decoded = verifyToken(token);
  return decoded ? decoded.id : null;
}

module.exports = { signToken, verifyToken, getUserFromReq };
