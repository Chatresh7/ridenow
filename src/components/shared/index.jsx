// src/components/shared/index.jsx
import { useState } from 'react'
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// ── NAVBAR ────────────────────────────────────────────────────────
export function Navbar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const getRoleColor = (role) => {
    if (role === 'driver') return 'var(--gold)'
    if (role === 'admin')  return 'var(--red)'
    return 'var(--green)'
  }

  const dashPath = profile?.role === 'driver' ? '/driver'
                 : profile?.role === 'admin'  ? '/admin'
                 : '/rider'

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <nav style={{
      background: 'linear-gradient(135deg, var(--purple-deep) 0%, var(--black) 100%)',
      borderBottom: '1px solid rgba(124,58,237,0.25)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>

        {/* Logo */}
        <Link to={dashPath} style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)' }}>
          <div style={{
            width:36, height:36,
            background:'linear-gradient(135deg, var(--purple), var(--gold))',
            borderRadius:'var(--r-sm)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--font-head)', fontWeight:800, fontSize:'1rem', color:'white',
          }}>R</div>
          <span style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:'1.25rem', color:'white' }}>
            Ride<span className="gold-text">Now</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-4)' }} className="hide-mobile">
          {profile && (
            <>
              <Link to={dashPath} style={{
                color: isActive(dashPath) ? 'white' : 'rgba(255,255,255,0.5)',
                fontFamily:'var(--font-head)', fontSize:'0.9rem', fontWeight:500,
                transition:'color var(--t-fast)',
              }}>
                Dashboard
              </Link>

              {profile.role === 'rider' && (
                <Link to="/rider/history" style={{
                  color: isActive('/rider/history') ? 'white' : 'rgba(255,255,255,0.5)',
                  fontFamily:'var(--font-head)', fontSize:'0.9rem', fontWeight:500,
                  transition:'color var(--t-fast)',
                }}>
                  My Trips
                </Link>
              )}

              {profile.role === 'driver' && (
                <Link to="/driver/earnings" style={{
                  color: isActive('/driver/earnings') ? 'white' : 'rgba(255,255,255,0.5)',
                  fontFamily:'var(--font-head)', fontSize:'0.9rem', fontWeight:500,
                  transition:'color var(--t-fast)',
                }}>
                  Earnings
                </Link>
              )}

              <div style={{ height:20, width:1, background:'rgba(255,255,255,0.1)' }} />

              {/* User pill */}
              <div style={{
                display:'flex', alignItems:'center', gap:'var(--sp-2)',
                background:'rgba(255,255,255,0.06)',
                border:'1px solid rgba(255,255,255,0.1)',
                borderRadius:'var(--r-full)',
                padding:'6px 14px',
              }}>
                <div style={{
                  width:8, height:8, borderRadius:'50%',
                  background: getRoleColor(profile.role),
                  animation:'pulse 2s infinite',
                }} />
                <span style={{ color:'white', fontSize:'0.875rem', fontFamily:'var(--font-head)', fontWeight:600 }}>
                  {profile.full_name?.split(' ')[0] || profile.email?.split('@')[0]}
                </span>
                <span style={{
                  fontSize:'0.7rem', color:'rgba(255,255,255,0.4)',
                  textTransform:'uppercase', letterSpacing:'0.05em',
                }}>
                  {profile.role}
                </span>
              </div>

              <button onClick={handleSignOut} className="btn btn-ghost btn-sm"
                style={{ color:'rgba(255,255,255,0.5)', background:'rgba(255,255,255,0.05)', fontSize:'0.8rem' }}>
                Sign out
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="hide-desktop"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ color:'white', fontSize:'1.5rem', padding:'var(--sp-2)' }}
          aria-label="Toggle menu"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          background:'rgba(30,10,60,0.98)',
          backdropFilter:'blur(16px)',
          borderTop:'1px solid rgba(124,58,237,0.2)',
          padding:'var(--sp-4)',
          display:'flex', flexDirection:'column', gap:'var(--sp-3)',
        }}>
          <Link to={dashPath} onClick={() => setMenuOpen(false)}
            style={{ color:'white', fontFamily:'var(--font-head)', padding:'var(--sp-2) 0' }}>
            Dashboard
          </Link>
          {profile?.role === 'rider' && (
            <Link to="/rider/history" onClick={() => setMenuOpen(false)}
              style={{ color:'rgba(255,255,255,0.6)', fontFamily:'var(--font-head)', padding:'var(--sp-2) 0' }}>
              My Trips
            </Link>
          )}
          {profile?.role === 'driver' && (
            <Link to="/driver/earnings" onClick={() => setMenuOpen(false)}
              style={{ color:'rgba(255,255,255,0.6)', fontFamily:'var(--font-head)', padding:'var(--sp-2) 0' }}>
              Earnings
            </Link>
          )}
          <button onClick={handleSignOut}
            style={{ color:'var(--red)', fontFamily:'var(--font-head)', textAlign:'left', padding:'var(--sp-2) 0' }}>
            Sign out
          </button>
        </div>
      )}
    </nav>
  )
}

// ── PROTECTED ROUTE ───────────────────────────────────────────────
export function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/login" replace />
  if (requiredRole && profile?.role !== requiredRole) {
    const redirect = profile?.role === 'driver' ? '/driver'
                   : profile?.role === 'admin'  ? '/admin'
                   : '/rider'
    return <Navigate to={redirect} replace />
  }
  return children
}

// ── LOADING SCREEN ────────────────────────────────────────────────
export function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div style={{
      minHeight:'100dvh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:'var(--sp-4)',
      background:'linear-gradient(135deg, var(--purple-deep), var(--black))',
    }}>
      <div style={{
        width:60, height:60,
        background:'linear-gradient(135deg, var(--purple), var(--gold))',
        borderRadius:'var(--r-md)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:'var(--font-head)', fontWeight:800, fontSize:'1.5rem', color:'white',
        animation:'glowPulse 2s ease-in-out infinite',
      }}>R</div>
      <div className="spinner spinner-lg" />
      <p style={{ color:'rgba(255,255,255,0.5)', fontFamily:'var(--font-head)', fontWeight:500 }}>
        {message}
      </p>
    </div>
  )
}

// ── TOAST ─────────────────────────────────────────────────────────
export function Toast({ message, type = 'info', onClose }) {
  return (
    <div style={{
      position:'fixed', bottom:'var(--sp-6)', right:'var(--sp-6)',
      zIndex:999, maxWidth:360, width:'calc(100vw - 48px)',
      animation:'fadeUp 0.3s ease both',
    }}>
      <div className={`alert alert-${type}`} style={{
        display:'flex', justifyContent:'space-between', alignItems:'flex-start',
        boxShadow:'var(--shadow-xl)',
      }}>
        <span>{message}</span>
        <button onClick={onClose}
          style={{ marginLeft:'var(--sp-3)', color:'inherit', opacity:0.6, fontSize:'1.1rem' }}>
          ✕
        </button>
      </div>
    </div>
  )
}

// ── EMPTY STATE ───────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', padding:'var(--sp-16)',
      textAlign:'center', gap:'var(--sp-4)',
    }}>
      <div style={{ fontSize:'3rem', animation:'float 3s ease-in-out infinite' }}>{icon}</div>
      <div>
        <h3 className="heading-2" style={{ marginBottom:'var(--sp-2)', color:'var(--purple-dark)' }}>{title}</h3>
        <p style={{ color:'var(--neutral-500)', maxWidth:300 }}>{description}</p>
      </div>
      {action}
    </div>
  )
}