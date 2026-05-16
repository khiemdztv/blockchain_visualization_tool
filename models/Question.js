const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  qid: { type: String, required: true, unique: true },
  topic: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  question_vi: { type: String, required: true },
  question_en: { type: String, required: true },
  options_vi: [{ type: String }],
  options_en: [{ type: String }],
  correct: { type: Number, required: true },
  explanation_vi: { type: String, default: '' },
  explanation_en: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  updatedAt: { type: Date, default: Date.now },
});

questionSchema.index({ topic: 1, difficulty: 1 });

module.exports = mongoose.model('Question', questionSchema);
