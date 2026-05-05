const express = require('express')
const router = express.Router()

const auth = require('../middleware/authMiddleware')
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController')

const {
  getCourseSkillGaps,
} = require('../controllers/skillGapController')

/* IMPORTANT: this MUST be declared before "/:id" so that the
   literal path "/skill-gaps/me" is not matched as an :id. */
router.get('/skill-gaps/me', auth, getCourseSkillGaps)

router.get('/', getCourses)
router.get('/:id', getCourse)
router.post('/', createCourse)
router.put('/:id', updateCourse)
router.delete('/:id', deleteCourse)

module.exports = router
