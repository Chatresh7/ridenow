// src/pages/DriverDashboard.jsx
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  driverService, rideService, locationService,
  earningsService, realtimeService, ratingService
} from '../services/supabase'
import { Navbar, Toast, EmptyState } from '../components/shared/index.jsx'

export function DriverDashboard() {
  const { user, profile } = useAuth()
  const [driver, setDriver]           = useState(null)
  const [loading, setLoading]         = useState(true)
  const [pendingRides, setPendingRides] = useState([])
  const [activeRide, setActiveRide]   = useState(null)
  const [available, setAvailable]     = useState(false)
  const [toast, setToast]             = useState(null)
  const [todayEarnings, setTodayEarnings] = useState(0)
  const [recentRating, setRecentRating]   = useState(null) // latest rating received
  const [ratingsList, setRatingsList]     = useState([])   // all ratings
  const locationTimerRef = useRef(null)

  useEffect(() => {
    if (!user) return
    driverService.getByUserId(user.id).then(({ data }) => {
      if (data) {
        setDriver(data)
        setAvailable(data.is_available)
        loadActiveRide(data.id)
        loadTodayEarnings(data.id)
        loadRatings(user.id)  // load ratings using user.id (ratee_id)
      }
      setLoading(false)
    })
  }, [user])

  const loadActiveRide    = async id => { const { data } = await rideService.getDriverActiveRide(id); setActiveRide(data) }

  const loadTodayEarnings = async (driverId) => {
    const { data, error } = await earningsService.getByDriver(driverId)
    if (error) { console.error('loadTodayEarnings error:', error); return }
    if (data) {
      const today = new Date().toDateString()
      const todayTotal = data
        .filter(e => new Date(e.created_at).toDateString() === today)
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
      setTodayEarnings(Math.round(todayTotal * 100) / 100)
    }
  }

  const loadRatings = async (driverUserId) => {
    const { data } = await ratingService.getDriverRatings(driverUserId)
    setRatingsList(data || [])
  }

  // Subscribe to new ratings in real time
  useEffect(() => {
    if (!user) return
    const unsub = realtimeService.subscribeToDriverRatings(user.id, (payload) => {
      if (payload.new) {
        const newRating = payload.new
        setRecentRating(newRating)
        setRatingsList(prev => [newRating, ...prev])
        // Reload driver to get updated rating_avg
        driverService.getByUserId(user.id).then(({ data }) => {
          if (data) setDriver(data)
        })
        showToast(`⭐ New rating received: ${newRating.score}/5`, 'success')
      }
    })
    return unsub
  }, [user])

  useEffect(() => {
    if (!available || !driver?.is_approved) return
    rideService.getPendingRides().then(({ data }) => setPendingRides(data||[]))
    const unsub = realtimeService.subscribeToPendingRides(payload => {
      if (payload.eventType==='INSERT' && payload.new.status==='requested') {
        setPendingRides(prev => [payload.new, ...prev.filter(r=>r.id!==payload.new.id)])
        showToast('🚕 New ride request!','info')
      }
      if (payload.eventType==='UPDATE') setPendingRides(prev=>prev.filter(r=>r.id!==payload.new.id))
    })
    return () => { unsub(); setPendingRides([]) }
  }, [available, driver?.is_approved])

  useEffect(() => {
    if (!activeRide?.id) return
    const unsub = realtimeService.subscribeToRide(activeRide.id, payload => {
      setActiveRide(prev => ({ ...prev, ...payload.new }))
    })
    return unsub
  }, [activeRide?.id])

  useEffect(() => {
    if (activeRide?.status==='in_progress' && driver) startBroadcast(driver.id, activeRide.id)
    else stopBroadcast()
    return stopBroadcast
  }, [activeRide?.status, driver?.id])

  const startBroadcast = (dId, rId) => {
    stopBroadcast()
    const send = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          p => locationService.upsert(dId, rId, p.coords.latitude, p.coords.longitude),
          () => locationService.upsert(dId, rId, 17.44+Math.random()*0.02, 78.37+Math.random()*0.02)
        )
      } else {
        locationService.upsert(dId, rId, 17.44+Math.random()*0.02, 78.37+Math.random()*0.02)
      }
    }
    send()
    locationTimerRef.current = setInterval(send, 10000)
  }
  const stopBroadcast = () => { clearInterval(locationTimerRef.current); locationTimerRef.current=null }

  const showToast = (msg, type) => { setToast({message:msg,type}); setTimeout(()=>setToast(null),5000) }

  const toggleAvailability = async () => {
    if (!driver) return
    const next = !available
    await driverService.setAvailability(driver.id, next)
    setAvailable(next)
    showToast(next ? '✅ You are now online' : '⏸️ You are now offline', next?'success':'info')
  }

  const handleAccept = async rideId => {
    try {
      const { data, error } = await rideService.acceptRide(rideId, driver.id)
      if (error) throw error
      setActiveRide(data)
      setPendingRides(prev => prev.filter(r=>r.id!==rideId))
      showToast('🎉 Ride accepted! Head to pickup.','success')
    } catch { showToast('Ride already taken.','error') }
  }

  const handleStart = async () => {
    const { data, error } = await rideService.startRide(activeRide.id)
    if (error) { showToast(error.message,'error'); return }
    setActiveRide(data); showToast('🏁 Ride started!','success')
  }

  const handleComplete = async () => {
    try {
      const driverId = driver.id  // capture before any state changes
      const driverUserId = user.id

      await rideService.completeRide(activeRide.id)
      showToast('✅ Trip completed! Earnings updated.', 'success')
      setActiveRide(null)
      stopBroadcast()

      // Give DB a moment to finish writing earnings + incrementing total_trips
      await new Promise(r => setTimeout(r, 1000))

      // Reload driver record — gets updated total_trips and rating_avg
      const { data: updatedDriver } = await driverService.getByUserId(driverUserId)
      if (updatedDriver) setDriver(updatedDriver)

      // Reload today's earnings using captured driverId (not stale closure)
      await loadTodayEarnings(driverId)

    } catch (err) {
      showToast(err.message || 'Failed to complete ride.', 'error')
    }
  }

  if (loading) return (
    <div className="page-wrapper"><Navbar />
      <main style={{display:'flex',justifyContent:'center',alignItems:'center',flex:1}}>
        <div className="spinner spinner-lg" />
      </main>
    </div>
  )

  if (!driver) return (
    <div className="page-wrapper"><Navbar />
      <main className="page-main"><div className="container">
        <div className="alert alert-warning">Driver profile not found. Please complete registration.</div>
      </div></main>
    </div>
  )

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-main">
        <div className="container">

          {/* Header */}
          <div className="page-header anim-fade" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <h1 className="heading-1" style={{ marginBottom:'var(--sp-1)' }}>
                <span className="gradient-text">Driver</span> Dashboard
              </h1>
              <p style={{ color:'var(--neutral-500)' }}>
                {driver.vehicle_color} {driver.vehicle_make} {driver.vehicle_model} · {driver.vehicle_plate}
              </p>
            </div>
            {!driver.is_approved ? (
              <div style={{
                background:'var(--amber-light)', color:'var(--amber)',
                border:'1.5px solid var(--amber)',
                borderRadius:'var(--r-full)', padding:'6px 16px',
                fontFamily:'var(--font-head)', fontWeight:700, fontSize:'0.8125rem',
              }}>⏳ Pending approval</div>
            ) : (
              <AvailabilityToggle available={available} onToggle={toggleAvailability} />
            )}
          </div>

          {/* Pending approval banner */}
          {!driver.is_approved && (
            <div className="alert alert-warning anim-fade" style={{ marginBottom:'var(--sp-6)' }}>
              <strong>Account under review.</strong> An admin will approve your account shortly.
            </div>
          )}

          {/* Stats */}
          <div className="grid-3 stagger" style={{ marginBottom:'var(--sp-6)' }}>
            <StatCard
              value={`₹${todayEarnings}`}
              label="Today's earnings"
              icon="💰"
              color="var(--gold)"
            />
            <StatCard
              value={driver.total_trips || 0}
              label="Total trips"
              icon="🚗"
              color="var(--purple)"
            />
            <StatCard
              value={`${parseFloat(driver.rating_avg || 5).toFixed(1)} ⭐`}
              label="Avg rating"
              icon="⭐"
              color="var(--green)"
            />
          </div>

          {/* New rating notification banner */}
          {recentRating && (
            <div className="anim-fade" style={{
              background:'linear-gradient(135deg, var(--purple-deep), var(--purple-mid))',
              border:'1px solid rgba(124,58,237,0.4)',
              borderRadius:'var(--r-lg)', padding:'var(--sp-5)',
              marginBottom:'var(--sp-6)',
              display:'flex', alignItems:'center', gap:'var(--sp-4)',
            }}>
              <div style={{ fontSize:'2.5rem' }}>⭐</div>
              <div style={{ flex:1 }}>
                <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600, marginBottom:4 }}>
                  New Rating Received!
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ fontSize:'1.25rem', filter: s <= recentRating.score ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</span>
                  ))}
                  <span style={{ fontFamily:'var(--font-head)', fontWeight:800, color:'white', marginLeft:8, fontSize:'1.125rem' }}>
                    {recentRating.score}/5
                  </span>
                </div>
                {recentRating.comment && (
                  <div style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.875rem', marginTop:6, fontStyle:'italic' }}>
                    "{recentRating.comment}"
                  </div>
                )}
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.7rem', marginBottom:2 }}>Updated avg</div>
                <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:'1.5rem' }} className="gold-text">
                  {driver.rating_avg || recentRating.score} ⭐
                </div>
              </div>
              <button onClick={() => setRecentRating(null)} style={{
                color:'rgba(255,255,255,0.4)', background:'none', fontSize:'1.25rem', flexShrink:0, cursor:'pointer',
              }}>✕</button>
            </div>
          )}

          {/* Ratings history */}
          {ratingsList.length > 0 && !activeRide && (
            <div style={{ marginBottom:'var(--sp-6)' }}>
              <h2 className="heading-2" style={{ marginBottom:'var(--sp-4)' }}>
                Recent <span className="gradient-text">Ratings</span>
              </h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>
                {ratingsList.slice(0, 5).map((r, i) => (
                  <div key={i} className="card anim-fade" style={{
                    display:'flex', alignItems:'center', gap:'var(--sp-4)',
                    animationDelay:`${i * 60}ms`,
                    border:'1px solid var(--gray-100)',
                  }}>
                    <div style={{
                      width:48, height:48, borderRadius:'var(--r-md)',
                      background: r.score >= 4 ? 'var(--green-light)' : r.score === 3 ? 'var(--amber-light)' : 'var(--red-light)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontFamily:'var(--font-head)', fontWeight:800, fontSize:'1rem',
                      color: r.score >= 4 ? 'var(--green)' : r.score === 3 ? 'var(--amber)' : 'var(--red)',
                      flexShrink:0,
                    }}>
                      {r.score}★
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', gap:2, marginBottom:4 }}>
                        {[1,2,3,4,5].map(s => (
                          <span key={s} style={{ fontSize:'0.875rem', filter: s <= r.score ? 'none' : 'grayscale(1) opacity(0.3)' }}>⭐</span>
                        ))}
                      </div>
                      <div style={{ fontSize:'0.875rem', color: r.comment ? 'var(--neutral-600)' : 'var(--neutral-400)', fontStyle: r.comment ? 'italic' : 'normal' }}>
                        {r.comment || 'No comment left'}
                      </div>
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'var(--neutral-400)', flexShrink:0 }}>
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active ride */}
          {activeRide ? (
            <div className="anim-fade" style={{ marginBottom:'var(--sp-6)' }}>
              <h2 className="heading-2" style={{ marginBottom:'var(--sp-4)' }}>
                <span className="gradient-text">Active</span> Ride
              </h2>
              <ActiveRideCard ride={activeRide} onStart={handleStart} onComplete={handleComplete} />
            </div>
          ) : driver.is_approved && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'var(--sp-4)' }}>
                <h2 className="heading-2">
                  {available
                    ? <><span className="gradient-text">{pendingRides.length}</span> pending ride{pendingRides.length!==1?'s':''}</>
                    : 'Go online to see rides'}
                </h2>
                {available && pendingRides.length > 0 && (
                  <div style={{
                    background:'linear-gradient(135deg, var(--purple), var(--gold))',
                    color:'white', borderRadius:'var(--r-full)',
                    fontSize:'0.75rem', fontWeight:700, padding:'4px 12px',
                    animation:'glowPulse 2s infinite',
                  }}>{pendingRides.length} new</div>
                )}
              </div>

              {!available && (
                <EmptyState icon="😴" title="You're offline"
                  description="Toggle availability to start receiving ride requests" />
              )}
              {available && pendingRides.length===0 && (
                <EmptyState icon="🔍" title="Waiting for rides"
                  description="New ride requests will appear here in real time" />
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)' }} className="stagger">
                {available && pendingRides.map(ride => (
                  <PendingRideCard key={ride.id} ride={ride} onAccept={() => handleAccept(ride.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

/* ── STAT CARD ────────────────────────────────────────────────────── */
function StatCard({ value, label, icon, color }) {
  return (
    <div className="stat-card anim-fade" style={{ border:`1px solid ${color}22` }}>
      <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)' }}>
        <div style={{
          width:44, height:44,
          background:`${color}18`,
          borderRadius:'var(--r-md)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'1.25rem',
        }}>{icon}</div>
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value" style={{ color, fontSize:'1.5rem' }}>{value}</div>
        </div>
      </div>
    </div>
  )
}

/* ── AVAILABILITY TOGGLE ──────────────────────────────────────────── */
function AvailabilityToggle({ available, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      display:'flex', alignItems:'center', gap:'var(--sp-3)',
      background: available
        ? 'linear-gradient(135deg, var(--green), #047857)'
        : 'var(--neutral-100)',
      border: `2px solid ${available ? 'var(--green)' : 'var(--neutral-300)'}`,
      borderRadius:'var(--r-full)',
      padding:'var(--sp-3) var(--sp-5)',
      cursor:'pointer', fontFamily:'var(--font-head)', fontWeight:700,
      color: available ? 'white' : 'var(--neutral-600)',
      transition:'all var(--t-normal)',
      boxShadow: available ? '0 4px 14px rgba(5,150,105,0.4)' : 'none',
    }}>
      <div style={{
        width:10, height:10, borderRadius:'50%',
        background: available ? 'rgba(255,255,255,0.9)' : 'var(--neutral-400)',
        animation: available ? 'pulse 1.5s infinite' : 'none',
      }} />
      {available ? 'Online' : 'Offline'}
    </button>
  )
}

/* ── PENDING RIDE CARD ────────────────────────────────────────────── */
function PendingRideCard({ ride, onAccept }) {
  const [accepting, setAccepting] = useState(false)
  const since = Math.floor((Date.now() - new Date(ride.created_at)) / 1000)

  const handle = async () => { setAccepting(true); await onAccept(); setAccepting(false) }

  return (
    <div className="card anim-slide" style={{
      borderLeft:'4px solid var(--purple)',
      display:'flex', gap:'var(--sp-4)', alignItems:'center',
      transition:'transform var(--t-normal), box-shadow var(--t-normal)',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform='translateX(4px)'; e.currentTarget.style.boxShadow='var(--shadow-md)' }}
    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
    >
      <div style={{
        width:48, height:48,
        background:'linear-gradient(135deg, var(--purple-light), var(--gold-light))',
        borderRadius:'var(--r-md)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:'1.5rem', flexShrink:0,
      }}>🚕</div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', gap:'var(--sp-2)', alignItems:'center', marginBottom:'var(--sp-1)' }}>
          <span style={{ fontSize:'0.8125rem', color:'var(--neutral-500)' }}>
            {ride['users!rides_rider_id_fkey']?.email?.split('@')[0] || 'Rider'}
          </span>
          <span style={{ fontSize:'0.75rem', color:'var(--neutral-400)' }}>· {since}s ago</span>
        </div>
        <div style={{ fontFamily:'var(--font-head)', fontWeight:600, marginBottom:'var(--sp-1)' }}>
          {ride.pickup_address}
        </div>
        <div style={{ fontSize:'0.875rem', color:'var(--neutral-500)' }}>→ {ride.destination_address}</div>
        <div style={{ display:'flex', gap:'var(--sp-4)', marginTop:'var(--sp-2)' }}>
          <span style={{ fontSize:'0.8125rem', color:'var(--neutral-600)' }}>{ride.distance_km} km</span>
          <span style={{ fontSize:'0.8125rem', fontWeight:700 }} className="gradient-text">₹{ride.fare_estimate}</span>
        </div>
      </div>

      <button onClick={handle} className="btn btn-primary btn-sm" disabled={accepting} style={{ flexShrink:0 }}>
        {accepting ? <div className="spinner spinner-sm" style={{borderTopColor:'white'}} /> : 'Accept'}
      </button>
    </div>
  )
}

/* ── ACTIVE RIDE CARD ─────────────────────────────────────────────── */
function ActiveRideCard({ ride, onStart, onComplete }) {
  const [loading, setLoading] = useState(false)
  const handle = async fn => { setLoading(true); await fn(); setLoading(false) }

  return (
    <div className="card" style={{
      borderLeft:'4px solid var(--green)',
      background:'linear-gradient(to right, var(--green-light), white)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'var(--sp-4)' }}>
        <div>
          <div className={`badge badge-${ride.status}`} style={{ marginBottom:'var(--sp-2)' }}>
            {ride.status.replace('_',' ')}
          </div>
          <p style={{ color:'var(--neutral-500)', fontSize:'0.875rem' }}>
            Rider: {ride['users!rides_rider_id_fkey']?.email?.split('@')[0] || 'Unknown'}
          </p>
        </div>
        <div style={{ textAlign:'right' }}>
          <div className="label">Fare</div>
          <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:'1.75rem' }} className="gradient-text">
            ₹{ride.fare_estimate}
          </div>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)', marginBottom:'var(--sp-5)' }}>
        <div style={{ display:'flex', gap:'var(--sp-3)' }}>
          <span>🟢</span>
          <div>
            <div className="label">Pickup</div>
            <div style={{ fontWeight:600 }}>{ride.pickup_address}</div>
          </div>
        </div>
        <div style={{ height:1, background:'var(--neutral-200)', marginLeft:24 }} />
        <div style={{ display:'flex', gap:'var(--sp-3)' }}>
          <span>🔴</span>
          <div>
            <div className="label">Destination</div>
            <div style={{ fontWeight:600 }}>{ride.destination_address}</div>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:'var(--sp-3)' }}>
        {ride.status === 'matched' && (
          <button onClick={() => handle(onStart)} className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <div className="spinner spinner-sm" style={{borderTopColor:'white'}} /> : '🏁 Start Ride'}
          </button>
        )}
        {ride.status === 'in_progress' && (
          <>
            <div style={{
              flex:1, background:'var(--purple-light)',
              borderRadius:'var(--r-md)', padding:'var(--sp-3)',
              display:'flex', alignItems:'center', gap:'var(--sp-2)',
              fontSize:'0.875rem', color:'var(--purple)', fontWeight:600,
              border:'1px solid var(--gray-200)',
            }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--purple)', animation:'pulse 1.5s infinite' }} />
              Broadcasting location
            </div>
            <button onClick={() => handle(onComplete)} className="btn btn-success" disabled={loading}>
              {loading ? <div className="spinner spinner-sm" style={{borderTopColor:'white'}} /> : '✅ Complete'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ── EARNINGS PAGE ────────────────────────────────────────────────── */
export function EarningsPage() {
  const { user } = useAuth()
  const [driver, setDriver]     = useState(null)
  const [earnings, setEarnings] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return
    driverService.getByUserId(user.id).then(({ data:drv }) => {
      setDriver(drv)
      if (drv) earningsService.getByDriver(drv.id).then(({ data }) => { setEarnings(data||[]); setLoading(false) })
      else setLoading(false)
    })
  }, [user])

  const total    = earnings.reduce((s,e)=>s+parseFloat(e.amount),0)
  const todayAmt = earnings.filter(e=>new Date(e.created_at).toDateString()===new Date().toDateString()).reduce((s,e)=>s+parseFloat(e.amount),0)

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-main">
        <div className="container">
          <div className="page-header anim-fade">
            <h1 className="heading-1"><span className="gradient-text">Earnings</span></h1>
          </div>
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'var(--sp-16)' }}>
              <div className="spinner spinner-lg" />
            </div>
          ) : (
            <>
              <div className="grid-3 stagger" style={{ marginBottom:'var(--sp-8)' }}>
                <StatCard value={`₹${Math.round(total)}`}    label="All time"    icon="💰" color="var(--gold)" />
                <StatCard value={`₹${Math.round(todayAmt)}`} label="Today"       icon="📅" color="var(--purple)" />
                <StatCard value={earnings.length}             label="Total trips" icon="🚗" color="var(--green)" />
              </div>
              {earnings.length===0 ? (
                <EmptyState icon="💰" title="No earnings yet" description="Complete trips to see your earnings here" />
              ) : (
                <div className="card" style={{ padding:0, overflow:'hidden' }}>
                  <table className="data-table">
                    <thead><tr><th>Date</th><th>Route</th><th>Total fare</th><th>Your cut (80%)</th></tr></thead>
                    <tbody>
                      {earnings.map(e => (
                        <tr key={e.id}>
                          <td style={{ color:'var(--neutral-500)', fontSize:'0.875rem' }}>
                            {new Date(e.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                          </td>
                          <td style={{ fontSize:'0.875rem' }}>
                            {e.rides?.pickup_address||'—'} → {e.rides?.destination_address||'—'}
                          </td>
                          <td style={{ fontWeight:600 }}>₹{(e.amount/0.80).toFixed(2)}</td>
                          <td>
                            <span style={{ fontFamily:'var(--font-head)', fontWeight:700 }} className="gold-text">
                              ₹{e.amount}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}