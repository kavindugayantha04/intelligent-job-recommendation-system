const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  keywords: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  category: {
    type: String,
    enum: ['general', 'cv_upload', 'job_matching', 'skill_gap', 'technical', 'account'],
    default: 'general'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  hitCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('FAQ', faqSchema);
