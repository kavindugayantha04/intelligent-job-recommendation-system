const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ['user', 'bot'], required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatLogSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  userId: { type: String, default: 'anonymous' },
  messages: [messageSchema],
  resolved: { type: Boolean, default: false },
  rating: { type: Number, min: 1, max: 5 },
  totalMessages: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('ChatLog', chatLogSchema);
