import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

function Quiz() {
  const [searchParams] = useSearchParams()
  const skill = searchParams.get('skill')
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutes

  useEffect(() => {
    const url = skill
      ? `http://localhost:5000/api/questions?skill=${encodeURIComponent(skill)}`
      : 'http://localhost:5000/api/questions'

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, 10)
        setQuestions(shuffled)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [skill])

  useEffect(() => {
    if (questions.length === 0 || loading) return;

    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [questions.length, loading]);

  useEffect(() => {
    if (timeLeft === 0) {
      const paddedAnswers = [...answers];
      if (selected !== null && current === paddedAnswers.length) {
         paddedAnswers.push(selected);
      }
      while (paddedAnswers.length < questions.length) {
        paddedAnswers.push(null);
      }
      navigate('/results', { state: { questions, answers: paddedAnswers, skill } });
    }
  }, [timeLeft, answers, current, navigate, questions, selected, skill]);

  const handleSelect = (index) => {
    setSelected(index)
  }

  const handleNext = () => {
    const newAnswers = [...answers, selected]

    if (current + 1 >= questions.length) {
      navigate('/results', { state: { questions, answers: newAnswers, skill } })
    } else {
      setAnswers(newAnswers)
      setCurrent(current + 1)
      setSelected(null)
    }
  }

  if (loading) return <p style={{ padding: '20px' }}>Loading questions...</p>
  if (questions.length === 0) return <p style={{ padding: '20px' }}>No questions found for this course.</p>

  const question = questions[current]

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
        
        {/* Quiz Card */}
        <div 
          onContextMenu={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
          style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          marginBottom: '30px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          msUserSelect: 'none'
        }}>
          {/* Progress Bar */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
               <span style={{ color: '#1a2035', fontSize: '16px', fontWeight: 'bold', width: '130px' }}>Skill Assessment</span>
               <span style={{ 
                 color: timeLeft < 300 ? '#dc3545' : '#0066cc', 
                 fontSize: '16px', 
                 fontWeight: 'bold', 
                 background: timeLeft < 300 ? '#fff5f5' : '#f0f4ff', 
                 padding: '6px 12px', 
                 borderRadius: '8px',
                 border: `1px solid ${timeLeft < 300 ? '#f5c6cb' : '#cce5ff'}`
               }}>
                  ⏳ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
               </span>
               <span style={{ color: '#666', fontSize: '15px', width: '130px', textAlign: 'right' }}>Question {current + 1} of {questions.length}</span>
            </div>
            <div style={{ background: '#eee', height: '14px', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{
                background: '#0066cc',
                width: `${((current + 1) / questions.length) * 100}%`,
                height: '100%',
                borderRadius: '10px',
                transition: 'width 0.4s ease-in-out'
              }} />
            </div>
          </div>

          {/* Question */}
          <h2 style={{ fontSize: '20px', color: '#1a2035', margin: '0 0 25px 0', fontWeight: 'bold', lineHeight: '1.5' }}>
            {question.questionText}
          </h2>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {question.options.map((option, index) => {
              const isSelected = selected === index
              return (
                <button
                  key={index}
                  onClick={() => handleSelect(index)}
                  style={{
                    background: isSelected ? '#0066cc' : 'white',
                    border: isSelected ? '2px solid #0066cc' : '2px solid #e0e0e0',
                    borderRadius: '10px',
                    padding: '16px 20px', 
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '16px',
                    color: isSelected ? 'white' : '#1a2035',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                  <span style={{ 
                    background: isSelected ? 'rgba(255,255,255,0.2)' : '#f8f9fa', 
                    color: isSelected ? 'white' : '#666',
                    minWidth: '32px', 
                    height: '32px', 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '50%',
                    fontWeight: 'bold', 
                    marginRight: '16px'
                  }}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </button>
              )
            })}
          </div>

          {/* Next Button */}
          {selected !== null && (
            <button
              onClick={handleNext}
              style={{
                marginTop: '30px', 
                background: '#1a2035',
                color: 'white', 
                border: 'none',
                padding: '16px 30px', 
                borderRadius: '10px',
                cursor: 'pointer', 
                width: '100%', 
                fontSize: '18px',
                fontWeight: 'bold', 
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
              {current + 1 >= questions.length ? 'See Results →' : 'Next Question →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Quiz