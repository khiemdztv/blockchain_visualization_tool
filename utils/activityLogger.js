const ActivityLog = require('../models/ActivityLog');

async function logActivity(userId, action, details = {}, req = null) {
  try {
    const entry = {
      userId,
      action,
      details,
      ip: req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') : '',
      userAgent: req ? (req.headers['user-agent'] || '') : '',
    };
    await ActivityLog.create(entry);
  } catch (err) {
    console.warn('[ActivityLog] Failed to log:', err.message);
  }
}

module.exports = { logActivity };
