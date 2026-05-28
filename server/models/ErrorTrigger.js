const mongoose = require('mongoose');

const errorTriggerSchema = new mongoose.Schema({
  triggerPhrase: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  errorCode: {
    type: String,
    trim: true
  },
  response: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['cv_error', 'auth_error', 'upload_error', 'server_error', 'parsing_error'],
    default: 'server_error'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ErrorTrigger', errorTriggerSchema);
