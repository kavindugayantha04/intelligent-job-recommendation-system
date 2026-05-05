const mongoose = require('mongoose')

const QuestionSchema = new mongoose.Schema({
  skill: { 
    type: String, 
    required: true 
  },
  questionText: { 
    type: String, 
    required: true 
  },
  options:      [String],
  correctAnswer: Number,
  difficulty:   { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'medium' 
  }
})

module.exports = mongoose.model('Question', QuestionSchema)