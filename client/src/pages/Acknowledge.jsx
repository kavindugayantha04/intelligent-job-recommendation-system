import { useNavigate } from 'react-router-dom'

function Acknowledge() {
  const navigate = useNavigate()

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '40px 20px',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      background: `linear-gradient(to bottom, rgba(240, 242, 245, 0.85), rgba(240, 242, 245, 0.95)), url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2000&auto=format&fit=crop')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '700px', 
        background: 'white', 
        borderRadius: '20px', 
        padding: '60px 40px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.15)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '70px', marginBottom: '20px' }}>🎊</div>
        
        <h1 style={{ 
          fontSize: '48px', 
          color: '#1a2035', 
          marginBottom: '30px',
          fontWeight: '800',
          letterSpacing: '-1px'
        }}>
          Congratulations!
        </h1>
        
        <div style={{ 
          background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)', 
          border: '1px solid #e2e8f0', 
          borderRadius: '16px', 
          padding: '40px 30px',
          marginBottom: '40px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <p style={{ 
            fontSize: '22px', 
            color: '#334155', 
            lineHeight: '1.8', 
            margin: 0, 
            fontWeight: '500' 
          }}>
            We have identified that the skill gap doesn't matter.<br/>
            <span style={{ color: '#0f172a', fontWeight: '700', display: 'block', marginTop: '10px' }}>
              We acknowledge that you have the idea and knowledge about the career!
            </span>
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          style={{
            background: '#0ea5e9', 
            color: 'white',
            border: 'none', 
            padding: '16px 40px', 
            borderRadius: '12px',
            cursor: 'pointer', 
            fontSize: '18px', 
            fontWeight: 'bold',
            boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.6)' }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(14, 165, 233, 0.4)' }}
        >
          🏠 Return to Dashboard
        </button>
      </div>
    </div>
  )
}

export default Acknowledge
