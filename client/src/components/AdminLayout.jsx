import { useNavigate, useLocation } from 'react-router-dom'

function AdminLayout({ children, title, subtitle }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  // The course/MCQ portal lives under /admin/* routes.
  // "Admin Panel" sends the admin back to the existing main /admin-dashboard
  // so this module stays plug-in to the rest of the app.
  const navItems = [
    { label: 'Admin Panel', path: '/admin-dashboard' },
    { label: 'Course Dashboard', path: '/admin/dashboard' },
    { label: 'Manage Courses', path: '/admin/courses' },
    { label: 'Manage MCQs', path: '/admin/questions' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Segoe UI, Arial, sans-serif' }}>

      {/* Sidebar */}
      <div style={{
        width: '240px', background: '#1a2035', color: 'white',
        padding: '30px 0', display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100vh'
      }}>
        <div style={{ padding: '0 24px 30px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', letterSpacing: '1px', color: 'white' }}>
            COURSE & MCQ<br />MANAGEMENT
          </h2>
        </div>

        <nav style={{ padding: '20px 12px', flex: 1 }}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', borderRadius: '8px',
                  cursor: 'pointer', marginBottom: '4px',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                  fontSize: '14px', fontWeight: isActive ? '600' : '400',
                }}
                onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
              >
                {item.label}
              </div>
            )
          })}
        </nav>

        <div style={{ padding: '0 12px 24px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', background: 'transparent',
              color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)',
              padding: '10px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '13px'
            }}>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: '240px', flex: 1, background: '#f0f2f5', minHeight: '100vh' }}>
        <div style={{
          background: 'white', padding: '16px 32px',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', borderBottom: '1px solid #eee'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>{title}</h1>
            {subtitle && <p style={{ margin: '2px 0 0', color: '#888', fontSize: '13px' }}>{subtitle}</p>}
          </div>
        </div>

        <div style={{ padding: '32px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
