import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import { getCourses } from '../api/courseApi'
import { getSkills } from '../api/questionApi'

function AdminCourseDashboard() {
  const [stats, setStats] = useState({ courses: 0, skills: 0, categories: 0 })
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      getCourses().catch(() => []),
      getSkills().catch(() => [])
    ]).then(([courses, skills]) => {
      const categories = new Set(
        (Array.isArray(courses) ? courses : [])
          .map(c => c.category)
          .filter(Boolean)
      )
      setStats({
        courses: Array.isArray(courses) ? courses.length : 0,
        skills: Array.isArray(skills) ? skills.length : 0,
        categories: categories.size
      })
    })
  }, [])

  const statCards = [
    { label: 'TOTAL COURSES', value: stats.courses },
    { label: 'SKILL TAGS WITH MCQs', value: stats.skills },
    { label: 'ACTIVE QUIZZES', value: stats.skills },
    { label: 'CATEGORIES', value: stats.categories },
  ]

  return (
    <AdminLayout title="Course & MCQ Portal" subtitle="Overview of your courses and MCQs">

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        {statCards.map((card, i) => (
          <div key={i} style={{
            background: 'white', borderRadius: '12px',
            padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#999', letterSpacing: '1px', fontWeight: '600' }}>
              {card.label}
            </p>
            <h2 style={{ margin: 0, fontSize: '36px', fontWeight: '700', color: '#1a2035' }}>
              {card.value}
            </h2>
          </div>
        ))}
      </div>

      <h3 style={{ margin: '0 0 16px', color: '#555', fontSize: '13px', letterSpacing: '1px', fontWeight: '600' }}>
        QUICK ACTIONS
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <div
          onClick={() => navigate('/admin/courses')}
          style={{
            background: 'white', borderRadius: '12px',
            padding: '28px', cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            borderLeft: '4px solid #3b6ef6',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>📚</div>
          <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>Manage Courses</h3>
          <p style={{ margin: 0, color: '#888', fontSize: '13px' }}>Add, edit and delete courses (with related skill)</p>
          <p style={{ margin: '12px 0 0', color: '#3b6ef6', fontSize: '13px', fontWeight: '600' }}>
            Go to Courses →
          </p>
        </div>

        <div
          onClick={() => navigate('/admin/questions')}
          style={{
            background: 'white', borderRadius: '12px',
            padding: '28px', cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            borderLeft: '4px solid #28a745',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>❓</div>
          <h3 style={{ margin: '0 0 6px', fontSize: '16px' }}>Manage MCQs</h3>
          <p style={{ margin: 0, color: '#888', fontSize: '13px' }}>Add, edit and delete MCQ questions per skill</p>
          <p style={{ margin: '12px 0 0', color: '#28a745', fontSize: '13px', fontWeight: '600' }}>
            Go to Questions →
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminCourseDashboard
