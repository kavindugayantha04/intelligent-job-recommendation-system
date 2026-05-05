const express = require('express')
const router = express.Router()
const { getQuestions, createQuestion, updateQuestion, deleteQuestion, getSkills } = require('../controllers/questionController')


// Public routes
router.get('/', getQuestions)
router.get('/skills', getSkills)
router.post('/', createQuestion)
router.put('/:id', updateQuestion)
router.delete('/:id', deleteQuestion)

module.exports = router