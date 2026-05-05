const Course = require('../models/Course')

/* =========================================================
   GET /api/courses
   GET /api/courses?skill=React
   - When `skill` query is present we filter by relatedSkill
     (case-insensitive). Falls back to category match for
     legacy courses that were created before relatedSkill existed.
========================================================= */
const getCourses = async (req, res) => {
  try {
    const { skill } = req.query

    let filter = {}
    if (skill && skill.trim()) {
      const rx = new RegExp(`^${escapeRegex(skill.trim())}$`, 'i')
      filter = {
        $or: [
          { relatedSkill: rx },
          { category: rx } // legacy fallback
        ]
      }
    }

    const courses = await Course.find(filter).sort({ createdAt: -1 })
    res.json(courses)
  } catch (error) {
    console.error('getCourses error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Escape user-supplied input for use inside a RegExp.
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) return res.status(404).json({ message: 'Course not found' })
    res.json(course)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body)
    res.status(201).json(course)
  } catch (error) {
    console.error('createCourse error:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    if (!course) return res.status(404).json({ message: 'Course not found' })
    res.json(course)
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id)
    if (!course) return res.status(404).json({ message: 'Course not found' })
    res.json({ message: 'Course deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

module.exports = { getCourses, getCourse, createCourse, updateCourse, deleteCourse }
