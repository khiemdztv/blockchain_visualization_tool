const mongoose = require('mongoose');

const quizProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questionId: { type: String, required: true },
  selectedAnswer: { type: Number, required: true },
  correct: { type: Boolean, required: true },
  topic: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  answeredAt: { type: Date, default: Date.now },
});

quizProgressSchema.index({ userId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('QuizProgress', quizProgressSchema);
