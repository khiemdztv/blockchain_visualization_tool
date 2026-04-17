const mongoose = require('mongoose');
const crypto = require('crypto');

const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  certCode: { type: String, unique: true, required: true },
  displayName: { type: String, required: true },
  email: { type: String, required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, default: 40 },
  testAttemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'TestAttempt' },
  issuedAt: { type: Date, default: Date.now },
});

certificateSchema.statics.generateCertCode = function () {
  return 'HB-' + crypto.randomBytes(6).toString('hex').toUpperCase();
};

module.exports = mongoose.model('Certificate', certificateSchema);
