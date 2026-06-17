const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function seedAdmin() {
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      console.log('[HubBlock] Admin account already exists:', existing.email);
      return;
    }
    const hashed = await bcrypt.hash('Admin123@', 10);
    await User.create({
      email: 'admin@hubblock.local',
      password: hashed,
      displayName: 'Admin',
      role: 'admin',
      authProvider: 'local',
    });
    console.log('[HubBlock] Admin account created: admin@hubblock.local / Admin123@');
  } catch (err) {
    console.error('[HubBlock] Seed admin error:', err.message);
  }
}

module.exports = { seedAdmin };
