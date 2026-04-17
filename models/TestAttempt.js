const mongoose = require('mongoose');

const testAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [{
    questionId: String,
    selectedAnswer: Number,
    correct: Boolean,
  }],
  score: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 40 },
  timeLimit: { type: Number, default: 3600 }, // seconds
  startedAt: { type: Date, required: true },
  completedAt: { type: Date },
  passed: { type: Boolean, default: false },
});

testAttemptSchema.index({ userId: 1 });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
