import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse
} from '../api/courseApi'

const LEVELS = ['', 'Beginner', 'Intermediate', 'Advanced']

function ManageCourses() {
  const [courses, setCourses] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editCourse, setEditCourse] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    thumbnail: '',
    link: '',
    relatedSkill: '',
    level: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const data = await getCourses()
      setCourses(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      alert('Failed to load courses.')
    }
  }

  const openAdd = () => {
    setEditCourse(null)
    setForm({
      title: '',
      description: '',
      category: '',
      thumbnail: '',
      link: '',
      relatedSkill: '',
      level: ''
    })
    setErrors({})
    setShowModal(true)
  }

  const openEdit = (course) => {
    setEditCourse(course)
    setForm({
      title: course.title || '',
      description: course.description || '',
      category: course.category || '',
      thumbnail: course.thumbnail || '',
      link: course.link || '',
      relatedSkill: course.relatedSkill || '',
      level: course.level || ''
    })
    setErrors({})
    setShowModal(true)
  }

  const handleSave = async () => {
    const newErrors = {}
    if (!form.title || !form.title.trim()) newErrors.title = 'Title is required'
    else if (form.title.trim().length < 3) newErrors.title = 'Title must be at least 3 characters'

    if (form.thumbnail && !/^https?:\/\/.+/.test(form.thumbnail)) {
      newErrors.thumbnail = 'Must be a valid URL starting with http/https'
    }
    if (form.link && !/^https?:\/\/.+/.test(form.link)) {
      newErrors.link = 'Must be a valid URL starting with http/https'
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      if (editCourse) {
        await updateCourse(editCourse._id, form)
      } else {
        await createCourse(form)
      }
      setShowModal(false)
      await fetchCourses()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to save the course.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return
    try {
      await deleteCourse(id)
      await fetchCourses()
    } catch (err) {
      console.error(err)
      alert('Failed to delete the course.')
    }
  }

  return (
    <AdminLayout title="Course Management" subtitle="Add, edit and manage your courses">

      {/* Add Button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={openAdd}
          style={{
            background: '#3b6ef6', color: 'white',
            border: 'none', padding: '12px 24px',
            borderRadius: '8px', cursor: 'pointer',
            fontWeight: '600', fontSize: '14px'
          }}>
          + Add New Course
        </button>
      </div>

      {/* Courses List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {courses.length === 0 && (
          <div style={{
            background: 'white', borderRadius: '12px',
            padding: '40px', textAlign: 'center',
            color: '#999', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            No courses yet. Click "+ Add New Course" to create one.
          </div>
        )}

        {courses.map(course => (
          <div key={course._id} style={{
            background: 'white', borderRadius: '12px',
            padding: '20px 24px', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '44px', height: '44px', background: '#f0f2f5',
                borderRadius: '10px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>
                {course.thumbnail
                  ? <img src={course.thumbnail} alt="" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '10px' }} />
                  : '📚'}
              </div>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '600' }}>{course.title}</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {course.relatedSkill && (
                    <span style={{
                      background: '#dbeafe', color: '#1d4ed8',
                      padding: '3px 10px', borderRadius: '20px',
                      fontSize: '12px', fontWeight: '600'
                    }}>{course.relatedSkill}</span>
                  )}
                  {course.level && (
                    <span style={{
                      background: '#fef3c7', color: '#92400e',
                      padding: '3px 10px', borderRadius: '20px',
                      fontSize: '12px', fontWeight: '600'
                    }}>{course.level}</span>
                  )}
                  {course.category && (
                    <span style={{
                      background: '#eef2ff', color: '#3b6ef6',
                      padding: '3px 10px', borderRadius: '20px',
                      fontSize: '12px', fontWeight: '500'
                    }}>{course.category}</span>
                  )}
                  {course.description && (
                    <span style={{
                      background: '#f0f2f5', color: '#666',
                      padding: '3px 10px', borderRadius: '20px',
                      fontSize: '12px'
                    }}>{course.description.slice(0, 40)}{course.description.length > 40 ? '...' : ''}</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => openEdit(course)}
                style={{
                  background: 'transparent', color: '#f0a500',
                  border: '1px solid #f0a500', padding: '7px 16px',
                  borderRadius: '8px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600'
                }}>
                ✏️ Edit
              </button>
              <button
                onClick={() => handleDelete(course._id)}
                style={{
                  background: 'transparent', color: '#dc3545',
                  border: '1px solid #dc3545', padding: '7px 16px',
                  borderRadius: '8px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '600'
                }}>
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: '16px',
            padding: '32px', width: '100%', maxWidth: '520px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px' }}>
              {editCourse ? '✏️ Edit Course' : '+ Add New Course'}
            </h2>

            {[
              { label: 'Title *', key: 'title', placeholder: 'e.g. React Basics' },
              { label: 'Related Skill', key: 'relatedSkill', placeholder: 'e.g. React, SQL, Python' },
              { label: 'Description', key: 'description', placeholder: 'Short description...' },
              { label: 'Category', key: 'category', placeholder: 'e.g. Programming' },
              { label: 'Thumbnail URL', key: 'thumbnail', placeholder: 'https://...' },
              { label: 'Course Platform Link', key: 'link', placeholder: 'https://coursera.org/...' }
            ].map(field => (
              <div key={field.key} style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#555' }}>
                  {field.label}
                </label>
                <input
                  value={form[field.key]}
                  onChange={e => {
                    setForm({ ...form, [field.key]: e.target.value })
                    if (errors[field.key]) setErrors({ ...errors, [field.key]: null })
                  }}
                  placeholder={field.placeholder}
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: errors[field.key] ? '1px solid #dc3545' : '1px solid #e0e0e0',
                    background: errors[field.key] ? '#fff8f8' : 'white',
                    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
                {errors[field.key] && (
                  <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    {errors[field.key]}
                  </span>
                )}
              </div>
            ))}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#555' }}>
                Level
              </label>
              <select
                value={form.level}
                onChange={e => setForm({ ...form, level: e.target.value })}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px', fontSize: '14px',
                  background: 'white', boxSizing: 'border-box'
                }}>
                {LEVELS.map(lvl => (
                  <option key={lvl} value={lvl}>{lvl || '— No level —'}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  flex: 1, background: '#3b6ef6', color: 'white',
                  border: 'none', padding: '12px',
                  borderRadius: '8px', cursor: 'pointer',
                  fontWeight: '600', fontSize: '15px'
                }}>
                {loading ? 'Saving...' : editCourse ? 'Update Course' : 'Add Course'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, background: '#f0f2f5', color: '#333',
                  border: 'none', padding: '12px',
                  borderRadius: '8px', cursor: 'pointer', fontSize: '15px'
                }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default ManageCourses
