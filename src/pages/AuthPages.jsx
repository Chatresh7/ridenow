// src/pages/AuthPages.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* ── LOGIN PAGE ───────────────────────────────────────────────────── */
export function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your journey"
    >
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'var(--sp-4)' }}>
        {error && (
          <div className="alert alert-error anim-fade">{error}</div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="email">Email address</label>
          <input id="email" type="email" className="form-input"
            placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)} required />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Password</label>
          <input id="password" type="password" className="form-input"
            placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)} required />
        </div>

        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}
          style={{ marginTop:'var(--sp-2)' }}>
          {loading
            ? <><div className="spinner spinner-sm" style={{borderTopColor:'white'}} /> Signing in…</>
            : 'Sign in →'}
        </button>

        <p style={{ textAlign:'center', fontSize:'0.875rem', color:'var(--neutral-500)', marginTop:'var(--sp-2)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:'var(--purple)', fontWeight:600 }}>Create one</Link>
        </p>
      </form>
    </AuthLayout>
  )
}

/* ── REGISTER PAGE ────────────────────────────────────────────────── */
export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep]   = useState(1)
  const [role, setRole]   = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ fullName:'', email:'', password:'', confirm:'' })
  const [driverForm, setDriverForm] = useState({ make:'', model:'', plate:'', color:'' })

  const set  = f => e => setForm(p => ({ ...p, [f]: e.target.value }))
  const setD = f => e => setDriverForm(p => ({ ...p, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm)  { setError('Passwords do not match.'); return }
    if (form.password.length < 6)        { setError('Password must be at least 6 characters.'); return }
    if (role === 'driver' && (!driverForm.make || !driverForm.model || !driverForm.plate || !driverForm.color)) {
      setError('Please fill in all vehicle details.'); return
    }
    setLoading(true)
    try {
      await signUp(form.email, form.password, role, form.fullName, role === 'driver' ? driverForm : null)
      navigate(role === 'driver' ? '/driver' : '/rider')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title={step === 1 ? 'Create account' : `Register as ${role}`}
      subtitle={step === 1 ? 'Who are you today?' : 'Fill in your details below'}
    >
      {step === 1 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-4)' }}>
          <RoleCard icon="🧑‍💼" title="I'm a Rider"
            description="Book rides and travel across the city"
            color="var(--purple)"
            onClick={() => { setRole('rider'); setStep(2) }} />
          <RoleCard icon="🚗" title="I'm a Driver"
            description="Accept rides and earn income on your schedule"
            color="var(--gold)"
            onClick={() => { setRole('driver'); setStep(2) }} />
          <p style={{ textAlign:'center', fontSize:'0.875rem', color:'var(--neutral-500)', marginTop:'var(--sp-2)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--purple)', fontWeight:600 }}>Sign in</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'var(--sp-4)' }}>
          {error && <div className="alert alert-error anim-fade">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full name</label>
            <input id="fullName" type="text" className="form-input" placeholder="Your full name"
              value={form.fullName} onChange={set('fullName')} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email address</label>
            <input id="reg-email" type="email" className="form-input" placeholder="you@example.com"
              value={form.email} onChange={set('email')} required />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-3)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-pass">Password</label>
              <input id="reg-pass" type="password" className="form-input" placeholder="Min 6 chars"
                value={form.password} onChange={set('password')} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm">Confirm</label>
              <input id="reg-confirm" type="password" className="form-input" placeholder="Repeat"
                value={form.confirm} onChange={set('confirm')} required />
            </div>
          </div>

          {role === 'driver' && (
            <>
              <div style={{ height:1, background:'var(--neutral-200)', margin:'var(--sp-2) 0' }} />
              <p className="label" style={{ color:'var(--gold-dark)' }}>🚗 Vehicle Details</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'var(--sp-3)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="v-make">Make</label>
                  <input id="v-make" type="text" className="form-input" placeholder="Toyota"
                    value={driverForm.make} onChange={setD('make')} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="v-model">Model</label>
                  <input id="v-model" type="text" className="form-input" placeholder="Camry"
                    value={driverForm.model} onChange={setD('model')} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="v-plate">Plate number</label>
                  <input id="v-plate" type="text" className="form-input" placeholder="MH01AB1234"
                    value={driverForm.plate} onChange={setD('plate')} required />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="v-color">Color</label>
                  <input id="v-color" type="text" className="form-input" placeholder="White"
                    value={driverForm.color} onChange={setD('color')} required />
                </div>
              </div>
              <div className="alert alert-info" style={{ fontSize:'0.8125rem' }}>
                ℹ️ Account reviewed by admin before you can accept rides.
              </div>
            </>
          )}

          <button type="submit" className="btn btn-full btn-lg" disabled={loading}
            style={{
              background: role === 'driver'
                ? 'linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%)'
                : 'linear-gradient(135deg, var(--purple) 0%, var(--purple-dark) 100%)',
              color:'white',
              boxShadow: role === 'driver' ? 'var(--shadow-gold)' : 'var(--shadow-purple)',
              marginTop:'var(--sp-2)',
            }}>
            {loading
              ? <><div className="spinner spinner-sm" style={{borderTopColor:'white'}} /> Creating account…</>
              : 'Create account →'}
          </button>

          <button type="button" onClick={() => setStep(1)}
            style={{ textAlign:'center', fontSize:'0.875rem', color:'var(--neutral-500)', background:'none', cursor:'pointer' }}>
            ← Back
          </button>
        </form>
      )}
    </AuthLayout>
  )
}

/* ── SHARED LAYOUT ────────────────────────────────────────────────── */
function AuthLayout({ title, subtitle, children }) {
  return (
    <div style={{
      minHeight:'100dvh', display:'flex',
      background:'linear-gradient(135deg, var(--purple-deep) 0%, var(--black) 50%, var(--purple-deep) 100%)',
      position:'relative', overflow:'hidden',
    }}>
      {/* Background orbs */}
      <div style={{
        position:'fixed', top:'15%', right:'10%',
        width:400, height:400, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
        pointerEvents:'none', animation:'float 7s ease-in-out infinite',
      }} />
      <div style={{
        position:'fixed', bottom:'15%', left:'5%',
        width:300, height:300, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)',
        pointerEvents:'none', animation:'float 9s ease-in-out infinite reverse',
      }} />

      {/* Grid */}
      <div style={{
        position:'fixed', inset:0,
        backgroundImage:`linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)`,
        backgroundSize:'50px 50px', pointerEvents:'none',
      }} />

      {/* Card */}
      <div style={{
        flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        padding:'var(--sp-8) var(--sp-4)', position:'relative', zIndex:1,
      }}>
        <div style={{ width:'100%', maxWidth:440 }} className="anim-page">
          {/* Logo */}
          <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:'var(--sp-2)', marginBottom:'var(--sp-8)' }}>
            <div style={{
              width:44, height:44,
              background:'linear-gradient(135deg, var(--purple), var(--gold))',
              borderRadius:'var(--r-md)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--font-head)', fontWeight:800, fontSize:'1.25rem', color:'white',
              boxShadow:'var(--shadow-purple)',
            }}>R</div>
            <span style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:'1.5rem', color:'white' }}>
              Ride<span className="gold-text">Now</span>
            </span>
          </Link>

          <h1 className="heading-1" style={{ color:'white', marginBottom:'var(--sp-2)' }}>{title}</h1>
          <p style={{ color:'rgba(255,255,255,0.45)', marginBottom:'var(--sp-6)' }}>{subtitle}</p>

          {/* Form card */}
          <div style={{
            background:'rgba(255,255,255,0.06)',
            backdropFilter:'blur(20px)',
            border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:'var(--r-xl)',
            padding:'var(--sp-8)',
          }}>
            {/* Override input styles for dark bg */}
            <style>{`
              .auth-dark .form-input {
                background: rgba(255,255,255,0.08);
                border-color: rgba(255,255,255,0.12);
                color: white;
              }
              .auth-dark .form-input:focus {
                background: rgba(255,255,255,0.12);
                border-color: var(--purple);
              }
              .auth-dark .form-input::placeholder { color: rgba(255,255,255,0.3); }
              .auth-dark .form-label { color: rgba(255,255,255,0.7); }
              .auth-dark .form-select { color: white; }
              .auth-dark .form-select option { color: black; background: white; }
            `}</style>
            <div className="auth-dark">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── ROLE CARD ────────────────────────────────────────────────────── */
function RoleCard({ icon, title, description, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:'var(--sp-4)',
      padding:'var(--sp-5)', borderRadius:'var(--r-lg)',
      border:`1.5px solid rgba(255,255,255,0.1)`,
      background:'rgba(255,255,255,0.05)',
      cursor:'pointer', textAlign:'left',
      transition:'all var(--t-normal)',
      fontFamily:'inherit', width:'100%',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = color
      e.currentTarget.style.background  = `${color}18`
      e.currentTarget.style.transform   = 'translateX(4px)'
      e.currentTarget.style.boxShadow   = `0 4px 20px ${color}30`
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
      e.currentTarget.style.background  = 'rgba(255,255,255,0.05)'
      e.currentTarget.style.transform   = ''
      e.currentTarget.style.boxShadow   = ''
    }}
    >
      <div style={{
        width:52, height:52,
        background:`${color}22`,
        border:`1px solid ${color}44`,
        borderRadius:'var(--r-md)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'1.5rem', flexShrink:0,
        transition:'transform var(--t-normal)',
      }}>{icon}</div>
      <div>
        <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:'1rem', color:'white', marginBottom:4 }}>{title}</div>
        <div style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.875rem' }}>{description}</div>
      </div>
      <div style={{ marginLeft:'auto', color:'rgba(255,255,255,0.25)', fontSize:'1.25rem' }}>→</div>
    </button>
  )
}