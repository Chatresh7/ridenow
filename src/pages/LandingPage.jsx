// src/pages/LandingPage.jsx
import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'

export function LandingPage() {
  return (
    <div style={{ minHeight:'100dvh', background:'var(--black)', color:'var(--white)', overflowX:'hidden' }}>
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TechStackSection />
      <CTASection />
      <LandingFooter />
    </div>
  )
}

/* ── NAV ─────────────────────────────────────────────────────────── */
function LandingNav() {
  return (
    <nav style={{
      position:'sticky', top:0, zIndex:100,
      background:'rgba(13,11,20,0.85)',
      backdropFilter:'blur(20px)',
      borderBottom:'1px solid rgba(124,58,237,0.2)',
    }}>
      <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)' }}>
          <div style={{
            width:36, height:36,
            background:'linear-gradient(135deg, var(--purple) 0%, var(--gold) 100%)',
            borderRadius:'var(--r-sm)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--font-head)', fontWeight:800, fontSize:'1rem', color:'var(--white)',
            animation:'glowPulse 3s ease-in-out infinite',
          }}>R</div>
          <span style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:'1.25rem' }}>
            Ride<span className="gold-text">Now</span>
          </span>
        </div>
        <div style={{ display:'flex', gap:'var(--sp-3)', alignItems:'center' }}>
          <Link to="/login" className="btn btn-ghost btn-sm"
            style={{ color:'rgba(255,255,255,0.7)', background:'rgba(255,255,255,0.06)' }}>
            Sign in
          </Link>
          <Link to="/register" className="btn btn-gold btn-sm">
            Get started →
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ── HERO ─────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section style={{
      minHeight:'92dvh', display:'flex', alignItems:'center',
      position:'relative', overflow:'hidden',
      background:'linear-gradient(180deg, #0D0B14 0%, #1E0A3C 60%, #0D0B14 100%)',
    }}>
      {/* Animated background orbs */}
      <div style={{
        position:'absolute', top:'10%', right:'5%',
        width:500, height:500, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
        animation:'float 6s ease-in-out infinite',
        pointerEvents:'none',
      }} />
      <div style={{
        position:'absolute', bottom:'10%', left:'5%',
        width:400, height:400, borderRadius:'50%',
        background:'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
        animation:'float 8s ease-in-out infinite reverse',
        pointerEvents:'none',
      }} />

      {/* Grid overlay */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:`
          linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)
        `,
        backgroundSize:'60px 60px',
      }} />

      <div className="container" style={{ position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:750 }}>
          {/* Badge */}
          <div className="anim-fade" style={{ animationDelay:'0ms' }}>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:'var(--sp-2)',
              background:'rgba(124,58,237,0.15)',
              border:'1px solid rgba(124,58,237,0.4)',
              borderRadius:'var(--r-full)',
              padding:'6px 18px',
              marginBottom:'var(--sp-6)',
              fontSize:'0.8125rem', fontWeight:600,
            }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--gold)', display:'inline-block', animation:'pulse 1.5s infinite' }} />
              <span className="gold-text">Real-time ride matching</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="display-xl anim-fade" style={{ color:'var(--white)', marginBottom:'var(--sp-6)', animationDelay:'80ms' }}>
            Your city,<br />
            <span className="gradient-text">on demand.</span>
          </h1>

          {/* Sub */}
          <p className="body-lg anim-fade" style={{
            color:'rgba(255,255,255,0.55)', maxWidth:500,
            marginBottom:'var(--sp-10)', animationDelay:'160ms',
          }}>
            RideNow connects riders and drivers in real time. Request in seconds,
            track live, and arrive in comfort — powered by modern web technology.
          </p>

          {/* CTAs */}
          <div className="anim-fade" style={{ display:'flex', gap:'var(--sp-4)', flexWrap:'wrap', animationDelay:'240ms' }}>
            <Link to="/register" className="btn btn-gold btn-xl">
              🚕 Book a Ride
            </Link>
            <Link to="/register" className="btn btn-xl" style={{
              background:'rgba(255,255,255,0.08)',
              border:'1px solid rgba(255,255,255,0.15)',
              color:'var(--white)',
              backdropFilter:'blur(8px)',
            }}>
              🚗 Drive with us
            </Link>
          </div>

          {/* Stats row */}
          <div className="anim-fade" style={{
            display:'flex', gap:'var(--sp-10)', marginTop:'var(--sp-12)',
            animationDelay:'320ms',
          }}>
            {[
              { value:'< 1s', label:'Match time' },
              { value:'100%', label:'Secure' },
              { value:'Live', label:'GPS tracking' },
            ].map((s,i) => (
              <div key={i}>
                <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:'1.5rem' }} className="gold-text">{s.value}</div>
                <div style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8125rem', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── FEATURES ────────────────────────────────────────────────────── */
function FeaturesSection() {
  const features = [
    { icon:'⚡', title:'Instant Matching', desc:'WebSocket connections mean your driver is notified in under a second. No polling, no delays.' },
    { icon:'📍', title:'Live Tracking', desc:'Watch your driver approach in real time. Location updates every 5 seconds, visualised on an interactive map.' },
    { icon:'🔒', title:'Secure by Design', desc:'Row Level Security at the database layer. Your data is only ever visible to you — guaranteed.' },
    { icon:'💛', title:'Transparent Fares', desc:'See your exact fare estimate before you book. Distance-based pricing, no hidden charges.' },
    { icon:'📱', title:'Mobile First', desc:'Fully responsive from 320px to 1440px. Works perfectly on any device, any screen size.' },
    { icon:'♿', title:'Accessible', desc:'WCAG 2.1 AA compliant. Designed for every user, with semantic HTML and full keyboard support.' },
  ]
  return (
    <section style={{ background:'var(--off-white)', padding:'var(--sp-16) 0' }}>
      <div className="container">
        <div style={{ textAlign:'center', marginBottom:'var(--sp-12)' }} className="anim-fade">
          <div style={{
            display:'inline-block',
            background:'var(--purple-light)', color:'var(--purple)',
            borderRadius:'var(--r-full)', padding:'4px 16px',
            fontSize:'0.75rem', fontWeight:700, letterSpacing:'0.06em',
            textTransform:'uppercase', marginBottom:'var(--sp-4)',
          }}>Features</div>
          <h2 className="display-lg" style={{ color:'var(--black)' }}>Everything you need</h2>
          <p style={{ color:'var(--neutral-500)', marginTop:'var(--sp-3)', fontSize:'1.0625rem', maxWidth:500, margin:'var(--sp-3) auto 0' }}>
            Built on modern web technologies for a seamless experience
          </p>
        </div>

        <div className="grid-3 stagger" style={{ gap:'var(--sp-5)' }}>
          {features.map((f,i) => (
            <div key={i} className="card anim-fade" style={{ animationDelay:`${i*60}ms` }}>
              <div style={{
                width:52, height:52,
                background:'linear-gradient(135deg, var(--purple-light), var(--gold-light))',
                borderRadius:'var(--r-md)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'1.5rem', marginBottom:'var(--sp-4)',
                transition:'transform var(--t-normal)',
              }}
              onMouseEnter={e => e.currentTarget.style.transform='scale(1.1) rotate(-5deg)'}
              onMouseLeave={e => e.currentTarget.style.transform=''}
              >{f.icon}</div>
              <h3 className="heading-3" style={{ marginBottom:'var(--sp-2)', color:'var(--purple-dark)' }}>{f.title}</h3>
              <p style={{ color:'var(--neutral-500)', fontSize:'0.9rem', lineHeight:1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── HOW IT WORKS ────────────────────────────────────────────────── */
function HowItWorksSection() {
  const steps = [
    { n:'01', title:'Create account', desc:'Register as a rider or driver in under 60 seconds.' },
    { n:'02', title:'Book a ride',    desc:'Select your pickup and destination, see the fare instantly.' },
    { n:'03', title:'Get matched',    desc:'A nearby driver is notified and accepts your ride in real time.' },
    { n:'04', title:'Ride & rate',    desc:'Track your driver live, complete the trip, leave a rating.' },
  ]
  return (
    <section style={{
      background:'linear-gradient(135deg, var(--purple-deep) 0%, var(--purple-mid) 100%)',
      padding:'var(--sp-16) 0',
    }}>
      <div className="container">
        <div style={{ textAlign:'center', marginBottom:'var(--sp-12)' }} className="anim-fade">
          <div style={{
            display:'inline-block',
            background:'rgba(245,158,11,0.15)', color:'var(--gold)',
            borderRadius:'var(--r-full)', padding:'4px 16px',
            fontSize:'0.75rem', fontWeight:700, letterSpacing:'0.06em',
            textTransform:'uppercase', marginBottom:'var(--sp-4)',
          }}>How it works</div>
          <h2 className="display-lg" style={{ color:'var(--white)' }}>
            Ride in <span className="gold-text">4 steps</span>
          </h2>
        </div>

        <div className="grid-4 stagger">
          {steps.map((s,i) => (
            <div key={i} className="glass anim-fade" style={{
              padding:'var(--sp-6)', animationDelay:`${i*80}ms`,
              transition:'transform var(--t-normal), box-shadow var(--t-normal)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(124,58,237,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
            >
              <div style={{
                fontFamily:'var(--font-head)', fontWeight:800, fontSize:'2.5rem',
                marginBottom:'var(--sp-4)', lineHeight:1,
              }} className="gold-text">{s.n}</div>
              <h3 style={{ fontFamily:'var(--font-head)', fontWeight:700, color:'var(--white)', marginBottom:'var(--sp-2)' }}>{s.title}</h3>
              <p style={{ color:'rgba(255,255,255,0.55)', fontSize:'0.9rem', lineHeight:1.7 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── TECH STACK ──────────────────────────────────────────────────── */
function TechStackSection() {
  return (
    <section style={{ background:'var(--black)', padding:'var(--sp-12) 0', borderTop:'1px solid rgba(124,58,237,0.15)' }}>
      <div className="container" style={{ textAlign:'center' }}>
        <p className="label" style={{ color:'rgba(255,255,255,0.3)', marginBottom:'var(--sp-6)' }}>
          Built with
        </p>
        <div style={{ display:'flex', justifyContent:'center', gap:'var(--sp-10)', flexWrap:'wrap' }}>
          {['HTML5','CSS3','JavaScript','React','Supabase'].map((tech,i) => (
            <div key={i} style={{
              fontFamily:'var(--font-head)', fontWeight:700, fontSize:'1.125rem',
              color:'rgba(255,255,255,0.15)',
              transition:'color var(--t-normal)',
              cursor:'default',
            }}
            onMouseEnter={e => e.currentTarget.style.color='var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.15)'}
            >{tech}</div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── CTA ─────────────────────────────────────────────────────────── */
function CTASection() {
  return (
    <section style={{ padding:'var(--sp-16) 0', background:'var(--off-white)' }}>
      <div className="container">
        <div style={{
          background:'linear-gradient(135deg, var(--purple-deep) 0%, var(--purple-mid) 100%)',
          borderRadius:'var(--r-xl)',
          padding:'var(--sp-16) var(--sp-8)',
          textAlign:'center',
          position:'relative', overflow:'hidden',
          border:'1px solid rgba(124,58,237,0.3)',
        }}>
          <div style={{
            position:'absolute', top:-100, right:-100,
            width:300, height:300, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
          }} />
          <div style={{
            position:'absolute', bottom:-80, left:-80,
            width:250, height:250, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)',
          }} />

          <div style={{ position:'relative', zIndex:1 }} className="anim-fade">
            <h2 className="display-lg" style={{ color:'var(--white)', marginBottom:'var(--sp-4)' }}>
              Ready to <span className="gold-text">ride?</span>
            </h2>
            <p style={{ color:'rgba(255,255,255,0.6)', marginBottom:'var(--sp-8)', fontSize:'1.0625rem' }}>
              Create your account in 30 seconds. No credit card required.
            </p>
            <Link to="/register" className="btn btn-gold btn-xl">
              Get started for free →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── FOOTER ──────────────────────────────────────────────────────── */
function LandingFooter() {
  return (
    <footer style={{
      background:'var(--black)',
      borderTop:'1px solid rgba(124,58,237,0.15)',
      padding:'var(--sp-8) 0', textAlign:'center',
    }}>
      <div className="container">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'var(--sp-2)', marginBottom:'var(--sp-3)' }}>
          <div style={{
            width:28, height:28,
            background:'linear-gradient(135deg, var(--purple), var(--gold))',
            borderRadius:'var(--r-sm)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--font-head)', fontWeight:800, fontSize:'0.875rem', color:'white',
          }}>R</div>
          <span style={{ fontFamily:'var(--font-head)', fontWeight:700, color:'rgba(255,255,255,0.5)' }}>RideNow</span>
        </div>
        <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'0.8125rem' }}>
          Web Technologies Course Project · Built with React + Supabase
        </p>
      </div>
    </footer>
  )
}