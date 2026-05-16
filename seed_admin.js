const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function seedAdmin() {
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      console.log('[BlockEdu] Admin account already exists:', existing.email);
      return;
    }
    const hashed = await bcrypt.hash('Admin123@', 10);
    await User.create({
      email: 'admin@blockedu.local',
      password: hashed,
      displayName: 'Admin',
      role: 'admin',
      authProvider: 'local',
    });
    console.log('[BlockEdu] Admin account created: admin@blockedu.local / Admin123@');
  } catch (err) {
    console.error('[BlockEdu] Seed admin error:', err.message);
  }
}

module.exports = { seedAdmin };
