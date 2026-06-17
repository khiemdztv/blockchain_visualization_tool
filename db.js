const mongoose = require('mongoose');
const dns = require('dns');

// Use Google DNS to bypass networks that block SRV lookups
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

let connected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[HubBlock] MONGODB_URI not set — quiz/auth features disabled.');
    return false;
  }
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    connected = true;
    console.log('[HubBlock] MongoDB connected successfully.');
    return true;
  } catch (err) {
    console.error('[HubBlock] MongoDB connection failed:', err.message);
    return false;
  }
}

function isConnected() {
  return connected && mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isConnected };
