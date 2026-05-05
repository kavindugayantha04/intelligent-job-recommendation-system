const Question = require('../models/Question')

// Get all questions optionally filtered by skill
const getQuestions = async (req, res) => {
  try {
    const { skill } = req.query
    const filter = skill ? { skill: skill.toLowerCase() } : {}
    const questions = await Question.find(filter)
    res.json(questions)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// Create question
const createQuestion = async (req, res) => {
  try {
    const question = await Question.create(req.body)
    res.status(201).json(question)
  } catch (error) {
    console.error('Create Question Error:', error)
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Update question
const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    if (!question) return res.status(404).json({ message: 'Question not found' })
    res.json(question)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// Delete question
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id)
    if (!question) return res.status(404).json({ message: 'Question not found' })
    res.json({ message: 'Question deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

// Get distinct skills for demo launcher
const getSkills = async (req, res) => {
  try {
    // Find all distinct non-empty string skill fields
    const skills = await Question.distinct('skill', { skill: { $exists: true, $ne: '' } })
    res.json(skills)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getQuestions, createQuestion, updateQuestion, deleteQuestion, getSkills }