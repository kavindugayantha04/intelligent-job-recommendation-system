const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  action: { type: String, required: true },
  description: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('logs', logSchema);