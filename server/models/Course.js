const mongoose = require('mongoose')

const CourseSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  description:  { type: String },
  category:     { type: String },
  thumbnail:    { type: String },
  link:         { type: String },

  // NEW: link a course to a specific skill so it can be recommended
  // when a candidate fails the MCQ test for that skill.
  // Example values: "React", "SQL", "Python", "Node.js"
  relatedSkill: { type: String, default: '' },

  // NEW: optional difficulty level for nicer display.
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', ''],
    default: ''
  },

  createdAt:    { type: Date, default: Date.now }
})

module.exports = mongoose.model('Course', CourseSchema)
