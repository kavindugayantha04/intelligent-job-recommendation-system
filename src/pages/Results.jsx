import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function Results() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [cvFile, setCvFile] = useState(null)
  const [cvSubmitted, setCvSubmitted] = useState(false)

  if (!state) {
    navigate('/')
    return null
  }

  const { questions, answers, skill } = state
  const score = answers.filter((a, i) => a === questions[i].correctAnswer).length

  const percentage = Math.round((score / questions.length) * 100)

  const getColor = () => {
    if (percentage > 75) return '#28a745'
    if (percentage >= 50) return '#ffc107'
    return '#dc3545'
  }

  const [recommendedCourses, setRecommendedCourses] = useState([])

  useEffect(() => {
    if (percentage < 50) {
      const target = skill ? skill.toLowerCase() : 'programming';
      fetch(`http://localhost:5000/api/courses?skill=${encodeURIComponent(target)}`)
        .then(res => res.json())
        .then(data => {
          const list = Array.isArray(data) ? data : [];
          // If the skill-filtered query returns nothing, fall back to legacy
          // category match so old courses without relatedSkill still appear.
          if (list.length > 0) {
            setRecommendedCourses(list.slice(0, 2))
          } else {
            fetch('http://localhost:5000/api/courses')
              .then(r => r.json())
              .then(all => {
                const filtered = (Array.isArray(all) ? all : []).filter(c =>
                  (c.relatedSkill || '').toLowerCase() === target ||
                  (c.category || '').toLowerCase().includes(target)
                );
                setRecommendedCourses(filtered.slice(0, 2))
              })
              .catch(console.error)
          }
        })
        .catch(console.error)
    }
  }, [percentage, skill])

  const handleCvSubmit = () => {
    if (cvFile) {
      setCvSubmitted(true)
      alert("CV Submitted Successfully!")
    } else {
      alert("Please choose a file to upload.")
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      background: `linear-gradient(to bottom, rgba(240, 242, 245, 0.85), rgba(240, 242, 245, 0.95)), url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2000&auto=format&fit=crop')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        {/* Score Card */}
        <div style={{
          textAlign: 'center', background: 'white',
          borderRadius: '16px', padding: '40px', marginBottom: '30px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <h1 style={{ fontSize: '56px', color: getColor(), margin: 0 }}>
            {percentage}%
          </h1>
          <p style={{ fontSize: '20px', color: '#666', marginTop: '4px' }}>Final Score</p>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: getColor(), margin: '15px 0' }}>
            {percentage > 75 
              ? '🎉 Congratulations! With this knowledge you can involve in many other paths as well.' 
              : percentage >= 50 
              ? '🎉 Congratulations! You have passed.' 
              : '📚 We suggest you do the specific course and master the skills.'}
          </p>

          {/* Score Bar */}
          <div style={{ background: '#eee', borderRadius: '10px', height: '14px', marginTop: '20px' }}>
            <div style={{
              background: getColor(),
              width: `${percentage}%`,
              height: '14px', borderRadius: '10px',
              transition: 'width 0.5s'
            }} />
          </div>
        </div>

        {/* Next Steps / Actions */}
        <div style={{ marginBottom: '30px', padding: '30px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h2 style={{ marginBottom: '20px', color: '#1a2035', textAlign: 'center' }}>Next Steps</h2>
          
          {percentage > 75 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <p style={{ color: '#666', textAlign: 'center' }}>Explore the exciting new opportunities available to you with such high proficiency!</p>
              <button
                onClick={() => navigate('/career-paths')}
                style={{
                  background: '#28a745', color: 'white', border: 'none', padding: '14px',
                  borderRadius: '10px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold',
                  boxShadow: '0 4px 6px rgba(40,167,69,0.2)'
                }}>
                ✨ Explore Career Paths
              </button>
            </div>
          ) : percentage >= 50 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <p style={{ color: '#666', textAlign: 'center' }}>Great job passing! Let's proceed to the next steps of your journey.</p>
              <button
                onClick={() => navigate('/acknowledge')}
                style={{
                  background: '#ffc107', color: '#1a2035', border: 'none', padding: '14px',
                  borderRadius: '10px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold',
                  boxShadow: '0 4px 6px rgba(255,193,7,0.2)'
                }}>
                ▶️ Proceed Forward
              </button>
            </div>

          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <p style={{ color: '#666', textAlign: 'center' }}>
                Explore our designated {skill ? <strong>{skill}</strong> : 'programming'} courses to improve your proficiency and master these skills.
              </p>
              
              {/* Dynamically Generate Course Cards regarding the skill/programming */}
              {recommendedCourses.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', margin: '10px 0' }}>
                  {recommendedCourses.map(course => (
                    <div key={course._id} style={{ border: '1px solid #e0e0e0', borderRadius: '12px', padding: '20px', textAlign: 'center', background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
                       <div style={{ height: '80px', marginBottom: '10px', background: '#eee', borderRadius: '8px', overflow: 'hidden' }}>
                          {course.thumbnail ? <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: '32px', paddingTop: '15px' }}>📚</div>}
                       </div>
                       <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#1a2035' }}>{course.title}</h4>
                       <p style={{ fontSize: '12px', color: '#666', flex: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{course.category}</p>
                       <button onClick={() => window.open(course.link || '/', '_blank')} style={{ background: '#0066cc', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', width: '100%', fontWeight: 'bold', marginTop: '10px' }}>Enroll Now</button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{fontStyle: 'italic', color: '#999', textAlign: 'center'}}>No explicit {skill ? skill.toLowerCase() : 'programming'} courses were found in the database.</p>
              )}

              <button
                onClick={() => navigate('/')}
                style={{
                  background: 'white', color: '#0066cc', border: '2px solid #0066cc', padding: '12px',
                  borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', marginTop: '5px'
                }}>
                Browse All Courses
              </button>
            </div>
          )}
        </div>

        {/* Answer Review */}
        <h2 style={{ marginBottom: '16px', color: '#1a2035' }}>Answer Review</h2>
        {questions.map((q, i) => {
          const isCorrect = answers[i] === q.correctAnswer
          return (
            <div key={i} style={{
              border: `1px solid ${isCorrect ? '#28a745' : '#dc3545'}`,
              borderRadius: '10px', padding: '16px',
              marginBottom: '12px',
              background: isCorrect ? '#f0fff4' : '#fff5f5',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1a2035' }}>
                {isCorrect ? '✅' : '❌'} {q.questionText}
              </p>
              <p style={{ color: '#dc3545', fontSize: '14px', margin: '4px 0' }}>
                Your answer: {answers[i] !== null ? q.options[answers[i]] : 'Not answered'}
              </p>
              <p style={{ color: '#28a745', fontSize: '14px', margin: '4px 0' }}>
                Correct answer: {q.options[q.correctAnswer]}
              </p>
            </div>
          )
        })}

        {/* Bottom Home Button */}
        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%', marginTop: '20px', background: 'white', color: '#6c757d',
            border: '2px solid #e0e0e0', padding: '12px', borderRadius: '8px',
            cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'
          }}>
          🏠 Back to Home
        </button>
      </div>
    </div>
  )
}

export default Results