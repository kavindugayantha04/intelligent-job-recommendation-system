const express = require('express')
const router = express.Router()

const authMiddleware = require('../middleware/authMiddleware')
const {
  getMySkillGap,
  evaluateScore
} = require('../controllers/skillGapController')

/* =====================================
   GET /api/skill-gap/me
   Returns the missing skills for the logged-in candidate
===================================== */
router.get('/me', authMiddleware, getMySkillGap)

/* =====================================
   POST /api/skill-gap/evaluate
   Returns rule-based decision (CV / PRACTICE / COURSE)
===================================== */
router.post('/evaluate', authMiddleware, evaluateScore)

module.exports = router
