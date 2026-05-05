import { useState, useEffect } from 'react'
import AdminLayout from '../components/AdminLayout'
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion
} from '../api/questionApi'

function ManageQuestions() {
  const [questions, setQuestions] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editQuestion, setEditQuestion] = useState(null)
  const [form, setForm] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    difficulty: 'medium'
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedSkill) fetchQuestions()
  }, [selectedSkill])

  const fetchQuestions = async () => {
    try {
      const data = await getQuestions({ skill: selectedSkill })
      setQuestions(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      alert('Failed to load questions.')
    }
  }

  const openAdd = () => {
    if (!selectedSkill) { alert('Please enter and load a skill first (e.g. React)'); return }
    setEditQuestion(null)
    setForm({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, difficulty: 'medium' })
    setErrors({})
    setShowModal(true)
  }

  const openEdit = (q) => {
    setEditQuestion(q)
    setForm({ questionText: q.questionText, options: q.options, correctAnswer: q.correctAnswer, difficulty: q.difficulty })
    setErrors({})
    setShowModal(true)
  }

  const handleSave = async () => {
    const newErrors = {}
    if (!form.questionText || !form.questionText.trim()) {
      newErrors.questionText = 'Question text is required.'
    }

    const optionErrors = []
    let hasOptionError = false
    form.options.forEach((opt, idx) => {
      if (!opt || !opt.trim()) {
        optionErrors[idx] = 'Option is required.'
        hasOptionError = true
      } else if (form.options.map(o => o.trim()).indexOf(opt.trim()) !== idx) {
        optionErrors[idx] = 'Options must be unique.'
        hasOptionError = true
      } else {
        optionErrors[idx] = null
      }
    })

    if (hasOptionError) newErrors.options = optionErrors

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      const payload = { ...form, skill: selectedSkill.toLowerCase() }
      if (editQuestion) {
        await updateQuestion(editQuestion._id, payload)
      } else {
        await createQuestion(payload)
      }
      setShowModal(false)
      await fetchQuestions()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Failed to save the question.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return
    try {
      await deleteQuestion(id)
      await fetchQuestions()
    } catch (err) {
      console.error(err)
      alert('Failed to delete the question.')
    }
  }

  const updateOption = (index, value) => {
    const newOptions = [...form.options]
    newOptions[index] = value
    setForm({ ...form, options: newOptions })
  }

  const difficultyColor = {
    easy: { bg: '#d4edda', color: '#28a745' },
    medium: { bg: '#fff3cd', color: '#856404' },
    hard: { bg: '#f8d7da', color: '#dc3545' }
  }

  return (
    <AdminLayout title="MCQ Management" subtitle="Add, edit and manage MCQ questions per skill">

      {/* Skill Selector */}
      <div style={{
        background: 'white', borderRadius: '12px',
        padding: '20px 24px', marginBottom: '24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap'
      }}>
        <label style={{ fontWeight: '600', fontSize: '14px', color: '#555', whiteSpace: 'nowrap' }}>
          Skill Tag:
        </label>
        <input
          value={skillInput}
          onChange={e => setSkillInput(e.target.value)}
          placeholder="e.g. react"
          style={{
            padding: '10px 16px', border: '1px solid #e0e0e0',
            borderRadius: '8px', fontSize: '14px',
            minWidth: '200px', background: 'white'
          }}
        />
        <button
          onClick={() => setSelectedSkill(skillInput.trim().toLowerCase())}
          style={{
            background: '#f0f2f5', color: '#1a2035',
            border: 'none', padding: '10px 20px',
            borderRadius: '8px', cursor: 'pointer',
            fontWeight: '600', fontSize: '14px'
          }}>
          Load Questions
        </button>

        {selectedSkill && (
          <button
            onClick={openAdd}
            style={{
              marginLeft: 'auto', background: '#3b6ef6', color: 'white',
              border: 'none', padding: '10px 20px',
              borderRadius: '8px', cursor: 'pointer',
              fontWeight: '600', fontSize: '14px'
            }}>
            + Add Question
          </button>
        )}
      </div>

      {/* Questions List */}
      {selectedSkill && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {questions.length === 0 && (
            <div style={{
              background: 'white', borderRadius: '12px',
              padding: '40px', textAlign: 'center',
              color: '#999', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}>
              No questions yet for "{selectedSkill}". Click "+ Add Question" to create one.
            </div>
          )}

          {questions.map((q, i) => (
            <div key={q._id} style={{
              background: 'white', borderRadius: '12px',
              padding: '20px 24px', display: 'flex',
              alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}>
              <div style={{ flex: 1, marginRight: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{
                    background: '#1a2035', color: 'white',
                    width: '24px', height: '24px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: '600', flexShrink: 0
                  }}>{i + 1}</span>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{q.questionText}</h3>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingLeft: '34px' }}>
                  {q.options.map((opt, idx) => (
                    <span key={idx} style={{
                      background: idx === q.correctAnswer ? '#d4edda' : '#f0f2f5',
                      color: idx === q.correctAnswer ? '#28a745' : '#666',
                      padding: '3px 10px', borderRadius: '20px',
                      fontSize: '12px', fontWeight: idx === q.correctAnswer ? '600' : '400',
                      border: idx === q.correctAnswer ? '1px solid #28a745' : '1px solid transparent'
                    }}>
                      {String.fromCharCode(65 + idx)}. {opt}
                    </span>
                  ))}
                  <span style={{
                    background: difficultyColor[q.difficulty]?.bg,
                    color: difficultyColor[q.difficulty]?.color,
                    padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                  }}>
                    {q.difficulty}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                <button
                  onClick={() => openEdit(q)}
                  style={{
                    background: 'transparent', color: '#f0a500',
                    border: '1px solid #f0a500', padding: '7px 16px',
                    borderRadius: '8px', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '600'
                  }}>
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(q._id)}
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
      )}

      {/* Modal - Improved Layout */}
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
            <h2 style={{ marginTop: 0, fontSize: '22px', color: '#1a2035' }}>
              {editQuestion ? '✏️ Edit Question' : '+ Add New Question'}
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px', color: '#555' }}>
                Question Text *
              </label>
              <textarea
                value={form.questionText}
                onChange={e => {
                  setForm({ ...form, questionText: e.target.value })
                  if (errors.questionText) setErrors({ ...errors, questionText: null })
                }}
                placeholder="Enter your question here..."
                rows={3}
                style={{
                  width: '100%', padding: '12px 14px',
                  border: errors.questionText ? '1px solid #dc3545' : '1px solid #e0e0e0',
                  background: errors.questionText ? '#fff8f8' : 'white',
                  borderRadius: '8px',
                  fontSize: '14px', boxSizing: 'border-box', resize: 'vertical'
                }}
              />
              {errors.questionText && (
                <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  {errors.questionText}
                </span>
              )}
            </div>

            <label style={{ display: 'block', marginBottom: '12px', fontWeight: '600', fontSize: '13px', color: '#555' }}>
              Options * <span style={{ color: '#888', fontWeight: '400' }}>(select correct answer)</span>
            </label>
            
            {form.options.map((opt, i) => (
              <div key={i} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="radio" name="correct"
                    checked={form.correctAnswer === i}
                    onChange={() => setForm({ ...form, correctAnswer: i })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: '700', minWidth: '20px', color: '#1a2035', fontSize: '15px' }}>
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <input
                    value={opt}
                    onChange={e => {
                      updateOption(i, e.target.value)
                      if (errors.options && errors.options[i]) {
                        const newOptErrors = [...errors.options]
                        newOptErrors[i] = null
                        setErrors({ ...errors, options: newOptErrors })
                      }
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    style={{
                      flex: 1, padding: '11px 14px',
                      border: (errors.options && errors.options[i]) ? '1px solid #dc3545' : `1px solid ${form.correctAnswer === i ? '#28a745' : '#e0e0e0'}`,
                      borderRadius: '8px', fontSize: '14px',
                      background: (errors.options && errors.options[i]) ? '#fff8f8' : (form.correctAnswer === i ? '#f0fff4' : 'white'),
                      boxShadow: form.correctAnswer === i ? '0 0 0 2px rgba(40, 167, 69, 0.1)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  />
                </div>
                {(errors.options && errors.options[i]) && (
                  <span style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px', display: 'block', paddingLeft: '45px' }}>
                    {errors.options[i]}
                  </span>
                )}
              </div>
            ))}

            <div style={{ marginBottom: '24px', marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '13px', color: '#555' }}>
                Difficulty
              </label>
              <select
                value={form.difficulty}
                onChange={e => setForm({ ...form, difficulty: e.target.value })}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px',
                  background: 'white', cursor: 'pointer'
                }}>
                <option value="easy">Easy 🟢</option>
                <option value="medium">Medium 🟡</option>
                <option value="hard">Hard 🔴</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  flex: 1, background: '#3b6ef6', color: 'white',
                  border: 'none', padding: '14px',
                  borderRadius: '8px', cursor: 'pointer',
                  fontWeight: '600', fontSize: '15px'
                }}>
                {loading ? 'Saving...' : editQuestion ? 'Update Question' : 'Add Question'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1, background: '#f0f2f5', color: '#333',
                  border: 'none', padding: '14px',
                  borderRadius: '8px', cursor: 'pointer', fontSize: '15px',
                  fontWeight: '500'
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

export default ManageQuestions