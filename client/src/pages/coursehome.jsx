import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'

function Home() {
  const [courses, setCourses] = useState([])
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('http://localhost:5000/api/courses')
      .then(res => res.json())
      .then(data => { setCourses(data); setLoading(false) })
      .catch(() => setLoading(false))

    fetch('http://localhost:5000/api/questions/skills')
      .then(res => res.json())
      .then(data => setSkills(data))
      .catch(console.error)
  }, [])

  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const navLinks = [
    { label: 'Home', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { label: 'Browse Courses', action: () => scrollToSection('courses') },
    { label: 'My Quizzes', action: () => scrollToSection('courses') },
    { label: 'Profile', action: () => scrollToSection('footer') },
  ]

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      fontFamily: 'Segoe UI, Arial, sans-serif', 
      background: `linear-gradient(to bottom, rgba(240, 242, 245, 0.85), rgba(240, 242, 245, 0.95)), url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2000&auto=format&fit=crop')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>

      {/* Navbar */}
      <header style={{
        background: '#1a2035',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '0 48px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        fontFamily: 'Segoe UI, Arial, sans-serif'
      }}>

        {/* Brand */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            fontWeight: '800',
            fontSize: '18px',
            color: '#a5b4fc',
            cursor: 'pointer',
            letterSpacing: '0.3px'
          }}>
          MCQ Platform
        </div>

        {/* Nav Links */}
        <nav style={{ 
          display: 'flex', gap: '32px', alignItems: 'center',
          position: 'absolute', left: '50%', transform: 'translateX(-50%)'
        }}>
          {navLinks.map((link) => {
            const isActive = link.label === 'Home'
            return (
              <span
                key={link.label}
                onClick={link.action}
                style={{
                  fontSize: '14px',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  borderBottom: isActive ? '2px solid white' : '2px solid transparent',
                  paddingBottom: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'white'
                    e.currentTarget.style.borderBottom = '2px solid rgba(255,255,255,0.4)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
                    e.currentTarget.style.borderBottom = '2px solid transparent'
                  }
                }}
              >
                {link.label}
              </span>
            )
          })}
        </nav>


      </header>

      {/* Main Content */}
      <div id="courses" style={{ flex: 1, padding: '60px 48px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Page Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: '700', color: '#1a2035' }}>
            Available Courses
          </h1>
          <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>
            Pick a course and start your quiz — instant results, no sign-up needed.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#aaa' }}>
            <p>Loading courses...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && courses.length === 0 && (
          <div style={{
            background: 'white', borderRadius: '16px',
            padding: '60px', textAlign: 'center', color: '#aaa'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📚</div>
            <p>No courses available yet.</p>
          </div>
        )}

        {/* Courses Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {courses.map(course => (
            <div
              key={course._id}
              style={{
                background: 'white', borderRadius: '16px',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: course.link ? 'pointer' : 'default'
              }}
              onClick={() => {
                if (course.link) window.open(course.link, '_blank')
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.06)'
              }}
            >
              {/* Thumbnail */}
              <div style={{ height: '180px', background: '#1a2035', overflow: 'hidden', position: 'relative' }}>
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '48px' }}>
                    📚
                  </div>
                )}
                {course.category && (
                  <span style={{
                    position: 'absolute', top: '12px', left: '12px',
                    background: 'rgba(0,0,0,0.5)', color: 'white',
                    padding: '4px 12px', borderRadius: '20px',
                    fontSize: '11px', fontWeight: '700', letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    {course.category}
                  </span>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: '22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '700', color: '#1a2035' }}>
                  {course.title}
                </h3>
                <p style={{ margin: '0 0 20px', color: '#999', fontSize: '13px', lineHeight: '1.6', flex: 1 }}>
                  {course.description?.slice(0, 250)}{course.description?.length > 250 ? '...' : ''}
                </p>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '18px' }}>
                  <span style={{ fontSize: '12px', color: '#aaa', fontWeight: '500' }}>🧩 Skill Assessment</span>
                  <span style={{ fontSize: '12px', color: '#aaa', fontWeight: '500' }}>📊 Gap Analytics</span>
                </div>


              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skill Assessment Launcher */}
      <div style={{ background: 'white', borderTop: '1px solid #e0e0e0', padding: '60px 48px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#eef2ff', color: '#3b6ef6', padding: '6px 16px', borderRadius: '30px', fontSize: '13px', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '16px' }}>
            <span>🎯</span> DEMO
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#1a2035', margin: '0 0 16px 0' }}>
            Test Your Skills
          </h2>
          <p style={{ color: '#666', fontSize: '16px', maxWidth: '600px', margin: '0 auto 40px', lineHeight: '1.6' }}>
            Simulate the AI-driven handoff process. Click any of the extracted skill tags below to instantly launch a dynamic gap-assessment quiz.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
            {skills.length === 0 && <span style={{ color: '#aaa', fontStyle: 'italic', padding: '20px' }}>Loading available skills or none present...</span>}
            {skills.map(skill => (
              <button
                key={skill}
                onClick={() => navigate(`/quiz?skill=${encodeURIComponent(skill)}`)}
                style={{
                  background: 'white', color: '#1a2035', border: '2px solid #e0e0e0',
                  padding: '12px 28px', borderRadius: '12px', cursor: 'pointer',
                  fontWeight: '700', fontSize: '15px', textTransform: 'capitalize',
                  transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#3b6ef6'
                  e.currentTarget.style.color = '#3b6ef6'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 110, 246, 0.15)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#e0e0e0'
                  e.currentTarget.style.color = '#1a2035'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div id="footer">
        <Footer containerStyle={{ marginTop: 0 }} />
      </div>

    </div>
  )
}

export default Home