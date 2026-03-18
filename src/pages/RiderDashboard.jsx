// src/pages/RiderDashboard.jsx
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { rideService, locationService, ratingService, realtimeService, supabase } from '../services/supabase'
import { Navbar, Toast, EmptyState } from '../components/shared/index.jsx'

const LOCATIONS = [
  // ── Mumbai ──────────────────────────────────────────────────────
  { label:'Bandra Station, Mumbai',           lat:19.0596, lng:72.8295 },
  { label:'Andheri Metro Station, Mumbai',    lat:19.1197, lng:72.8468 },
  { label:'Dadar Station, Mumbai',            lat:19.0186, lng:72.8439 },
  { label:'Churchgate Station, Mumbai',       lat:18.9353, lng:72.8257 },
  { label:'CST Station, Mumbai',              lat:18.9400, lng:72.8356 },
  { label:'Kurla Station, Mumbai',            lat:19.0659, lng:72.8790 },
  { label:'Borivali Station, Mumbai',         lat:19.2307, lng:72.8567 },
  { label:'Thane Station, Mumbai',            lat:19.1970, lng:72.9710 },
  { label:'Powai, Mumbai',                    lat:19.1176, lng:72.9060 },
  { label:'Lower Parel, Mumbai',              lat:18.9994, lng:72.8312 },
  { label:'Worli Sea Face, Mumbai',           lat:19.0090, lng:72.8175 },
  { label:'Nariman Point, Mumbai',            lat:18.9256, lng:72.8242 },
  { label:'Juhu Beach, Mumbai',               lat:19.0989, lng:72.8267 },
  { label:'Colaba, Mumbai',                   lat:18.9067, lng:72.8147 },
  { label:'Malad West, Mumbai',               lat:19.1872, lng:72.8484 },
  { label:'Goregaon East, Mumbai',            lat:19.1647, lng:72.8489 },
  { label:'Mulund, Mumbai',                   lat:19.1726, lng:72.9567 },
  { label:'Navi Mumbai, CBD Belapur',         lat:19.0243, lng:73.0344 },
  { label:'Vashi Station, Navi Mumbai',       lat:19.0764, lng:72.9990 },

  // ── Delhi / NCR ─────────────────────────────────────────────────
  { label:'Connaught Place, Delhi',           lat:28.6315, lng:77.2167 },
  { label:'Cyber City, Gurugram',             lat:28.4949, lng:77.0894 },
  { label:'Chandni Chowk, Delhi',             lat:28.6506, lng:77.2303 },
  { label:'India Gate, Delhi',                lat:28.6129, lng:77.2295 },
  { label:'Lajpat Nagar, Delhi',              lat:28.5677, lng:77.2434 },
  { label:'Karol Bagh, Delhi',                lat:28.6520, lng:77.1909 },
  { label:'Dwarka Sector 21, Delhi',          lat:28.5528, lng:77.0588 },
  { label:'Saket, Delhi',                     lat:28.5245, lng:77.2066 },
  { label:'Rohini, Delhi',                    lat:28.7402, lng:77.1143 },
  { label:'Noida Sector 18',                  lat:28.5706, lng:77.3219 },
  { label:'Noida Sector 62',                  lat:28.6257, lng:77.3649 },
  { label:'Greater Noida',                    lat:28.4744, lng:77.5040 },
  { label:'Faridabad Old, Haryana',           lat:28.4089, lng:77.3178 },
  { label:'Gurgaon Sohna Road',               lat:28.4165, lng:77.0302 },
  { label:'IGI Airport, Delhi',               lat:28.5562, lng:77.1000 },
  { label:'New Delhi Railway Station',        lat:28.6424, lng:77.2195 },
  { label:'Hazrat Nizamuddin Station',        lat:28.5892, lng:77.2505 },
  { label:'Janakpuri, Delhi',                 lat:28.6280, lng:77.0820 },

  // ── Bengaluru ────────────────────────────────────────────────────
  { label:'Koramangala, Bengaluru',           lat:12.9349, lng:77.6193 },
  { label:'Indiranagar, Bengaluru',           lat:12.9716, lng:77.6412 },
  { label:'Whitefield, Bengaluru',            lat:12.9698, lng:77.7499 },
  { label:'Electronic City, Bengaluru',       lat:12.8452, lng:77.6602 },
  { label:'MG Road, Bengaluru',               lat:12.9757, lng:77.6094 },
  { label:'Jayanagar, Bengaluru',             lat:12.9306, lng:77.5832 },
  { label:'Marathahalli, Bengaluru',          lat:12.9591, lng:77.6974 },
  { label:'Hebbal, Bengaluru',                lat:13.0358, lng:77.5971 },
  { label:'KR Puram, Bengaluru',              lat:13.0050, lng:77.6947 },
  { label:'Banashankari, Bengaluru',          lat:12.9258, lng:77.5470 },
  { label:'Yelahanka, Bengaluru',             lat:13.1007, lng:77.5963 },
  { label:'Kengeri, Bengaluru',               lat:12.9107, lng:77.4822 },
  { label:'Kempegowda International Airport', lat:13.1989, lng:77.7068 },
  { label:'HSR Layout, Bengaluru',            lat:12.9116, lng:77.6473 },
  { label:'BTM Layout, Bengaluru',            lat:12.9166, lng:77.6101 },

  // ── Hyderabad ────────────────────────────────────────────────────
  { label:'Hitech City, Hyderabad',           lat:17.4474, lng:78.3762 },
  { label:'Jubilee Hills, Hyderabad',         lat:17.4317, lng:78.4071 },
  { label:'Banjara Hills, Hyderabad',         lat:17.4156, lng:78.4347 },
  { label:'Gachibowli, Hyderabad',            lat:17.4401, lng:78.3489 },
  { label:'Secunderabad Station',             lat:17.4344, lng:78.5013 },
  { label:'Nampally, Hyderabad',              lat:17.3921, lng:78.4651 },
  { label:'LB Nagar, Hyderabad',              lat:17.3487, lng:78.5520 },
  { label:'Kukatpally, Hyderabad',            lat:17.4849, lng:78.3993 },
  { label:'RGIA Airport, Hyderabad',          lat:17.2403, lng:78.4294 },
  { label:'Madhapur, Hyderabad',              lat:17.4486, lng:78.3908 },
  { label:'Ameerpet, Hyderabad',              lat:17.4353, lng:78.4490 },
  { label:'Dilsukhnagar, Hyderabad',          lat:17.3687, lng:78.5260 },

  // ── Chennai ──────────────────────────────────────────────────────
  { label:'T Nagar, Chennai',                 lat:13.0418, lng:80.2341 },
  { label:'Anna Nagar, Chennai',              lat:13.0856, lng:80.2099 },
  { label:'Adyar, Chennai',                   lat:13.0012, lng:80.2565 },
  { label:'Velachery, Chennai',               lat:12.9815, lng:80.2180 },
  { label:'Tambaram, Chennai',                lat:12.9249, lng:80.1000 },
  { label:'Guindy, Chennai',                  lat:13.0067, lng:80.2206 },
  { label:'Egmore, Chennai',                  lat:13.0732, lng:80.2609 },
  { label:'Porur, Chennai',                   lat:13.0357, lng:80.1561 },
  { label:'Chennai Airport',                  lat:12.9941, lng:80.1709 },
  { label:'Sholinganallur, Chennai',          lat:12.9010, lng:80.2279 },
  { label:'Perambur, Chennai',                lat:13.1184, lng:80.2341 },

  // ── Pune ────────────────────────────────────────────────────────
  { label:'Shivajinagar, Pune',               lat:18.5308, lng:73.8475 },
  { label:'Hinjawadi IT Park, Pune',          lat:18.5912, lng:73.7385 },
  { label:'Kothrud, Pune',                    lat:18.5074, lng:73.8077 },
  { label:'Baner, Pune',                      lat:18.5590, lng:73.7868 },
  { label:'Hadapsar, Pune',                   lat:18.5018, lng:73.9260 },
  { label:'Viman Nagar, Pune',                lat:18.5679, lng:73.9143 },
  { label:'Pune Airport',                     lat:18.5822, lng:73.9197 },
  { label:'Wakad, Pune',                      lat:18.5985, lng:73.7620 },
  { label:'Pimpri Chinchwad, Pune',           lat:18.6279, lng:73.8008 },

  // ── Kolkata ─────────────────────────────────────────────────────
  { label:'Park Street, Kolkata',             lat:22.5535, lng:88.3514 },
  { label:'Salt Lake City, Kolkata',          lat:22.5741, lng:88.4148 },
  { label:'Howrah Station, Kolkata',          lat:22.5839, lng:88.3422 },
  { label:'New Town Rajarhat, Kolkata',       lat:22.5856, lng:88.4833 },
  { label:'Dum Dum, Kolkata',                 lat:22.6459, lng:88.3945 },
  { label:'Jadavpur, Kolkata',                lat:22.4974, lng:88.3714 },
  { label:'Netaji Subhash Airport, Kolkata',  lat:22.6520, lng:88.4463 },

  // ── Ahmedabad ────────────────────────────────────────────────────
  { label:'CG Road, Ahmedabad',               lat:23.0297, lng:72.5668 },
  { label:'SG Highway, Ahmedabad',            lat:23.0439, lng:72.5073 },
  { label:'Maninagar, Ahmedabad',             lat:22.9957, lng:72.6027 },
  { label:'Bodakdev, Ahmedabad',              lat:23.0395, lng:72.5025 },
  { label:'Naroda, Ahmedabad',                lat:23.0852, lng:72.6423 },
  { label:'SVPI Airport, Ahmedabad',          lat:23.0772, lng:72.6347 },

  // ── Jaipur ──────────────────────────────────────────────────────
  { label:'MI Road, Jaipur',                  lat:26.9124, lng:75.7873 },
  { label:'Vaishali Nagar, Jaipur',           lat:26.9310, lng:75.7388 },
  { label:'Malviya Nagar, Jaipur',            lat:26.8563, lng:75.8071 },
  { label:'Mansarovar, Jaipur',               lat:26.8478, lng:75.7711 },
  { label:'Jaipur Railway Station',           lat:26.9191, lng:75.7882 },
  { label:'Jaipur International Airport',     lat:26.8242, lng:75.8122 },
]

const calcDist = (la1,ln1,la2,ln2) => {
  const R=6371, dLat=(la2-la1)*Math.PI/180, dLng=(ln2-ln1)*Math.PI/180
  const a=Math.sin(dLat/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLng/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}
const calcFare = d => Math.round((50+d*12)*100)/100

/* ── MAIN ─────────────────────────────────────────────────────────── */
export function RiderDashboard() {
  const { user, profile } = useAuth()
  const [activeRide, setActiveRide]     = useState(null)
  const [rideLoading, setRideLoading]   = useState(true)
  const [driverLocation, setDriverLocation] = useState(null)
  const [toast, setToast]               = useState(null)
  const [showRating, setShowRating]     = useState(false)

  useEffect(() => {
    if (!user) return
    rideService.getActiveRide(user.id).then(({ data }) => {
      setActiveRide(data); setRideLoading(false)
    })
  }, [user])

  useEffect(() => {
    if (!activeRide?.id) return

    // Primary: Realtime WebSocket
    const unsub = realtimeService.subscribeToRide(activeRide.id, payload => {
      const updated = payload.new
      setActiveRide(prev => ({ ...prev, ...updated }))
      if (updated.status === 'matched')      showToast('🚗 Driver matched! On the way.', 'success')
      if (updated.status === 'in_progress')  showToast('🏁 Ride started!', 'info')
      if (updated.status === 'completed')    { showToast('✅ Trip completed!', 'success'); setShowRating(true) }
      if (updated.status === 'cancelled')    showToast('❌ Ride cancelled.', 'error')
    })

    // Fallback: poll every 4 seconds in case Realtime misses the event
    const poll = setInterval(async () => {
      const { data } = await rideService.getActiveRide(user.id)
      // Check if ride just completed
      if (!data && activeRide.status === 'in_progress') {
        // Ride gone from active — fetch with drivers join to confirm completion
        const { data: completed } = await supabase
          .from('rides')
          .select('*, drivers(id, vehicle_make, vehicle_model, vehicle_plate, user_id, users(email))')
          .eq('id', activeRide.id)
          .single()
        if (completed?.status === 'completed') {
          setActiveRide(completed)
          showToast('✅ Trip completed!', 'success')
          setShowRating(true)
          clearInterval(poll)
        }
      } else if (data && data.status !== activeRide.status) {
        setActiveRide(data)
        if (data.status === 'matched')     showToast('🚗 Driver matched! On the way.', 'success')
        if (data.status === 'in_progress') showToast('🏁 Ride started!', 'info')
        if (data.status === 'completed')   { showToast('✅ Trip completed!', 'success'); setShowRating(true) }
      }
    }, 4000)

    return () => { unsub(); clearInterval(poll) }
  }, [activeRide?.id, activeRide?.status])

  useEffect(() => {
    if (!activeRide?.driver_id) return
    const unsub = realtimeService.subscribeToDriverLocation(activeRide.driver_id, payload => {
      if (payload.new) setDriverLocation({ lat:parseFloat(payload.new.lat), lng:parseFloat(payload.new.lng) })
    })
    return unsub
  }, [activeRide?.driver_id])

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  const handleCancel = async () => {
    if (!activeRide?.id) return
    await rideService.cancelRide(activeRide.id)
    setActiveRide(null)
    showToast('Ride cancelled.', 'info')
  }

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-main">
        <div className="container">
          {/* Header */}
          <div className="page-header anim-fade">
            <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)', marginBottom:'var(--sp-1)' }}>
              <h1 className="heading-1">
                Hello, <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'Rider'}</span> 👋
              </h1>
            </div>
            <p style={{ color:'var(--neutral-500)' }}>Where are you headed today?</p>
          </div>

          {/* Responsive grid — side by side on desktop, stacked on mobile */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'minmax(0,2fr) minmax(0,3fr)',
            gap:'var(--sp-6)',
            alignItems:'start',
          }}
          className="rider-grid"
          >
            {/* Left panel */}
            <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-4)' }}>
              {rideLoading ? (
                <div className="card" style={{ display:'flex', justifyContent:'center', padding:'var(--sp-10)' }}>
                  <div className="spinner" />
                </div>
              ) : activeRide && !['completed','cancelled'].includes(activeRide.status) ? (
                <ActiveRidePanel ride={activeRide} driverLocation={driverLocation} onCancel={handleCancel} />
              ) : (
                <RideRequestForm userId={user?.id} onRequested={r => { setActiveRide(r); showToast('🔍 Searching for a driver...','info') }} />
              )}
            </div>

            {/* Map */}
            <PurpleMap activeRide={activeRide} driverLocation={driverLocation} />
          </div>

          {showRating && activeRide && (
            <RatingModal ride={activeRide} userId={user?.id} onClose={() => { setShowRating(false); setActiveRide(null) }} />
          )}
        </div>
      </main>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

/* ── RIDE REQUEST FORM ────────────────────────────────────────────── */
function RideRequestForm({ userId, onRequested }) {
  const [pickupIdx, setPickupIdx] = useState(0)
  const [destIdx,   setDestIdx]   = useState(20)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  // Group locations by city for <optgroup>
  const grouped = LOCATIONS.reduce((acc, loc, i) => {
    const city = loc.label.split(', ').pop()
    if (!acc[city]) acc[city] = []
    acc[city].push({ ...loc, i })
    return acc
  }, {})

  const p    = LOCATIONS[pickupIdx]
  const d    = LOCATIONS[destIdx]
  const dist = calcDist(p.lat, p.lng, d.lat, d.lng)
  const fare = calcFare(dist)

  const handleSubmit = async e => {
    e.preventDefault()
    if (pickupIdx === destIdx) { setError('Pickup and destination cannot be the same.'); return }
    setError(''); setLoading(true)
    try {
      const { data, error: err } = await rideService.request({
        rider_id: userId,
        pickup_address: p.label, destination_address: d.label,
        pickup_lat: p.lat, pickup_lng: p.lng,
        dest_lat: d.lat, dest_lng: d.lng,
        distance_km: parseFloat(dist.toFixed(2)),
        fare_estimate: fare, status:'requested',
      })
      if (err) throw err
      onRequested(data)
    } catch (err) {
      setError(err.message || 'Failed to request ride.')
    } finally {
      setLoading(false)
    }
  }

  const LocationSelect = ({ id, label, dotColor, value, onChange }) => (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>
        <span style={{ color: dotColor, marginRight: 6 }}>●</span>{label}
      </label>
      <select
        id={id}
        className="form-input form-select"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ fontSize:'0.9rem' }}
      >
        {Object.entries(grouped).map(([city, locs]) => (
          <optgroup key={city} label={`── ${city} ──`}>
            {locs.map(l => (
              <option key={l.i} value={l.i}>{l.label}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="card anim-fade" style={{
      display:'flex', flexDirection:'column', gap:'var(--sp-5)',
      border:'1px solid var(--gray-100)',
    }}>
      {/* Header */}
      <div>
        <h2 className="heading-2" style={{ marginBottom:'var(--sp-1)', color:'var(--purple-dark)' }}>
          Book a Ride
        </h2>
        <p className="body-sm" style={{ color:'var(--neutral-500)' }}>
          {LOCATIONS.length} locations across India
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Pickup dropdown */}
      <LocationSelect
        id="pickup"
        label="Pickup location"
        dotColor="var(--green)"
        value={pickupIdx}
        onChange={setPickupIdx}
      />

      {/* Swap button */}
      <div style={{ display:'flex', justifyContent:'center', marginTop:'-var(--sp-2)' }}>
        <button
          type="button"
          onClick={() => { const tmp = pickupIdx; setPickupIdx(destIdx); setDestIdx(tmp) }}
          style={{
            width:36, height:36, borderRadius:'50%',
            background:'linear-gradient(135deg, var(--purple-light), var(--gold-light))',
            border:'2px solid var(--gray-200)',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', fontSize:'1rem',
            transition:'all var(--t-normal)',
          }}
          onMouseEnter={e => e.currentTarget.style.transform='rotate(180deg)'}
          onMouseLeave={e => e.currentTarget.style.transform=''}
          title="Swap pickup and destination"
        >⇅</button>
      </div>

      {/* Destination dropdown */}
      <LocationSelect
        id="destination"
        label="Destination"
        dotColor="var(--red)"
        value={destIdx}
        onChange={setDestIdx}
      />

      {/* Fare preview card */}
      <div style={{
        background:'linear-gradient(135deg, var(--purple-deep), var(--purple-mid))',
        borderRadius:'var(--r-md)', padding:'var(--sp-4)',
        border:'1px solid rgba(124,58,237,0.3)',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        gap:'var(--sp-3)', overflow:'hidden',
      }}>
        <div style={{ minWidth:0 }}>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 }}>
            Distance
          </div>
          <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:'1.125rem', color:'white' }}>
            {dist.toFixed(1)} km
          </div>
        </div>
        <div style={{ textAlign:'right', minWidth:0 }}>
          <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 }}>
            Fare estimate
          </div>
          <div style={{
            fontFamily:'var(--font-head)', fontWeight:800,
            fontSize:'clamp(1.1rem, 4vw, 1.75rem)',
            color:'#FFD700', wordBreak:'break-all',
          }}>
            ₹{fare}
          </div>
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
        {loading
          ? <><div className="spinner spinner-sm" style={{borderTopColor:'white'}} /> Requesting…</>
          : '🚕 Request Ride'}
      </button>
    </form>
  )
}

/* ── ACTIVE RIDE PANEL ────────────────────────────────────────────── */
function ActiveRidePanel({ ride, driverLocation, onCancel }) {
  const cfg = {
    requested:   { label:'Searching for driver…', icon:'🔍', color:'var(--amber)',  bg:'var(--amber-light)' },
    matched:     { label:'Driver matched!',        icon:'🚗', color:'var(--purple)', bg:'var(--purple-light)' },
    in_progress: { label:'Ride in progress',       icon:'🏁', color:'var(--green)',  bg:'var(--green-light)' },
  }[ride.status] || { label:'Loading…', icon:'⏳', color:'var(--purple)', bg:'var(--purple-light)' }

  return (
    <div className="card anim-fade" style={{ display:'flex', flexDirection:'column', gap:'var(--sp-4)', border:'1px solid var(--gray-100)' }}>
      {/* Status banner */}
      <div style={{
        background:'linear-gradient(135deg, var(--purple-deep), var(--purple-mid))',
        borderRadius:'var(--r-md)', padding:'var(--sp-4)',
        display:'flex', alignItems:'center', gap:'var(--sp-3)',
      }}>
        <div style={{ fontSize:'1.5rem', animation: ride.status==='requested' ? 'float 2s ease-in-out infinite' : 'none' }}>{cfg.icon}</div>
        <div>
          <div style={{ color:'white', fontFamily:'var(--font-head)', fontWeight:700 }}>{cfg.label}</div>
          {ride.status === 'requested' && (
            <div style={{ display:'flex', gap:4, marginTop:4 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width:5, height:5, borderRadius:'50%', background:'var(--gold)',
                  animation:`pulse 1.2s ${i*0.2}s infinite`,
                }} />
              ))}
            </div>
          )}
        </div>
        <div style={{ marginLeft:'auto' }}>
          <div style={{
            background:'rgba(245,158,11,0.25)',
            border:'1.5px solid rgba(245,158,11,0.6)',
            borderRadius:'var(--r-full)', padding:'5px 14px',
            fontFamily:'var(--font-head)', fontWeight:800, fontSize:'1.125rem',
            color:'#FFD700',
          }}>₹{ride.fare_estimate}</div>
        </div>
      </div>

      {/* Route */}
      <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>
        <RouteRow icon="🟢" label="Pickup" value={ride.pickup_address} />
        <div style={{ height:1, background:'var(--neutral-100)', marginLeft:24 }} />
        <RouteRow icon="🔴" label="Drop"   value={ride.destination_address} />
      </div>

      {/* Driver info */}
      {ride.drivers && (
        <div style={{
          background:'var(--purple-light)',
          border:'1px solid var(--gray-200)',
          borderRadius:'var(--r-md)', padding:'var(--sp-4)',
          animation:'scaleIn 0.3s ease both',
        }}>
          <div className="label" style={{ marginBottom:'var(--sp-2)', color:'var(--purple)' }}>Your Driver</div>
          <div style={{ fontFamily:'var(--font-head)', fontWeight:700, color:'var(--purple-dark)' }}>
            {ride.drivers?.users?.email?.split('@')[0] || 'Driver'}
          </div>
          <div style={{ fontSize:'0.875rem', color:'var(--neutral-600)', marginTop:4 }}>
            {ride.drivers?.vehicle_color} {ride.drivers?.vehicle_make} {ride.drivers?.vehicle_model} · {ride.drivers?.vehicle_plate}
          </div>
          {driverLocation && (
            <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', marginTop:6, fontSize:'0.8125rem', color:'var(--purple)', fontWeight:600 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--purple)', animation:'pulse 1.5s infinite' }} />
              Live location updating…
            </div>
          )}
        </div>
      )}

      {ride.status === 'requested' && (
        <button onClick={onCancel} className="btn btn-ghost btn-sm" style={{ alignSelf:'flex-start' }}>
          Cancel ride
        </button>
      )}
    </div>
  )
}

function RouteRow({ icon, label, value }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:'var(--sp-3)' }}>
      <div style={{ fontSize:'0.75rem', marginTop:2 }}>{icon}</div>
      <div>
        <div className="label">{label}</div>
        <div style={{ fontWeight:500, fontSize:'0.9375rem', marginTop:2 }}>{value}</div>
      </div>
    </div>
  )
}

/* ── RICH MAP ─────────────────────────────────────────────────────── */
function PurpleMap({ activeRide, driverLocation }) {
  const MAP_H  = 420
  const W      = 600
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef(null)

  // ── Haversine distance helper ─────────────────────────────────────
  const haversine = (la1, ln1, la2, ln2) => {
    const R = 6371
    const dLat = (la2 - la1) * Math.PI / 180
    const dLng = (ln2 - ln1) * Math.PI / 180
    const a = Math.sin(dLat/2)**2 +
              Math.cos(la1*Math.PI/180) * Math.cos(la2*Math.PI/180) * Math.sin(dLng/2)**2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  // ── Elapsed timer — only runs during in_progress ──────────────────
  useEffect(() => {
    if (activeRide?.status !== 'in_progress') {
      setElapsed(0)
      clearInterval(elapsedRef.current)
      return
    }
    // Seed elapsed from started_at if available
    if (activeRide.started_at) {
      setElapsed(Math.floor((Date.now() - new Date(activeRide.started_at).getTime()) / 1000))
    }
    elapsedRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(elapsedRef.current)
  }, [activeRide?.status, activeRide?.id])

  // ── Core values ───────────────────────────────────────────────────
  const totalDist = parseFloat(activeRide?.distance_km   || 0)
  const fare      = parseFloat(activeRide?.fare_estimate || 0)

  const pickupLat  = activeRide?.pickup_lat ? parseFloat(activeRide.pickup_lat) : null
  const pickupLng  = activeRide?.pickup_lng ? parseFloat(activeRide.pickup_lng) : null
  const destLat    = activeRide?.dest_lat   ? parseFloat(activeRide.dest_lat)   : null
  const destLng    = activeRide?.dest_lng   ? parseFloat(activeRide.dest_lng)   : null

  // ── REAL progress from actual driver GPS location ─────────────────
  // When driver sends location via Supabase Realtime → driverLocation updates
  // Progress = how far along the route the driver currently is
  const realProgress = (() => {
    if (!driverLocation || !pickupLat || !destLat) return 0
    if (activeRide?.status !== 'in_progress') return 0

    const dLat = parseFloat(driverLocation.lat)
    const dLng = parseFloat(driverLocation.lng)

    // Distance driver has already covered (pickup → current position)
    const covered = haversine(pickupLat, pickupLng, dLat, dLng)
    // Clamp between 0–100
    const pct = totalDist > 0 ? Math.min(100, Math.round((covered / totalDist) * 100)) : 0
    return pct
  })()

  // ── Fallback simulated position when no real GPS ──────────────────
  // Only used when driverLocation is null (driver hasn't sent location yet)
  const simProgress = (() => {
    if (!activeRide?.started_at || !pickupLat) return 0
    const secElapsed = elapsed
    // Assume ~60 sec per km for simulation
    const simCoveredKm = secElapsed / 60
    return totalDist > 0 ? Math.min(99, Math.round((simCoveredKm / totalDist) * 100)) : 0
  })()

  // Use real GPS progress if we have a driver location, otherwise simulation
  const progress = driverLocation ? realProgress : simProgress

  // Car position on map
  const carLat = driverLocation
    ? parseFloat(driverLocation.lat)
    : pickupLat && destLat
      ? pickupLat + (destLat - pickupLat) * (simProgress / 100)
      : null
  const carLng = driverLocation
    ? parseFloat(driverLocation.lng)
    : pickupLng && destLng
      ? pickupLng + (destLng - pickupLng) * (simProgress / 100)
      : null

  // ── Distance remaining (real) ─────────────────────────────────────
  const distRemaining = (() => {
    if (!carLat || !destLat) return totalDist.toFixed(1)
    return haversine(carLat, carLng, destLat, destLng).toFixed(1)
  })()

  // ── ETA — based on remaining distance + avg speed 30 km/h ─────────
  const remainingKm   = parseFloat(distRemaining)
  const remainingMins = activeRide?.status === 'in_progress'
    ? Math.max(0, Math.round((remainingKm / 30) * 60))
    : activeRide?.status === 'matched' ? 3
    : Math.round((totalDist / 30) * 60)

  const arrivalTime = (() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() + remainingMins)
    return d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
  })()

  const formatElapsed = s => {
    const m = Math.floor(s / 60), sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  // ── Dynamic map scaling ───────────────────────────────────────────
  const computeScale = (pLat, pLng, dLat, dLng) => {
    const latSpan = Math.abs(dLat - pLat) || 0.01
    const lngSpan = Math.abs(dLng - pLng) || 0.01
    const scaleY  = (MAP_H * 0.75) / latSpan
    const scaleX  = (W     * 0.75) / lngSpan
    return Math.min(scaleX, scaleY)
  }

  const midLat = pickupLat && destLat ? (pickupLat + destLat) / 2 : 19.0596
  const midLng = pickupLng && destLng ? (pickupLng + destLng) / 2 : 72.8295
  const scale  = pickupLat && destLat
    ? computeScale(pickupLat, pickupLng, destLat, destLng)
    : 5000

  const toP = (lat, lng) => ({
    x: Math.max(44, Math.min(W - 44,     (lng - midLng) * scale + W / 2)),
    y: Math.max(44, Math.min(MAP_H - 44, (midLat - lat) * scale + MAP_H / 2)),
  })

  const pPx  = pickupLat ? toP(pickupLat, pickupLng) : null
  const dPx  = destLat   ? toP(destLat,   destLng)   : null
  const vPx  = carLat    ? toP(carLat,    carLng)     : null

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)' }} className="anim-fade">

      {/* ── STAT CARDS ────────────────────────────────────────────── */}
      {activeRide && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'var(--sp-3)' }} className="stat-cards-grid">

          {/* Arrival time — replaces old "ETA" label */}
          <MapStatCard
            icon="🕐"
            label="Arrives at"
            value={arrivalTime}
            sub={remainingMins > 0 ? `${remainingMins} min away` : 'Arriving soon'}
            highlight={activeRide.status === 'in_progress'}
          />

          {/* Distance */}
          <MapStatCard
            icon="📍"
            label="Distance"
            value={`${totalDist} km`}
            sub={activeRide.status === 'in_progress' ? `${distRemaining} km left` : 'Total route'}
          />

          {/* Fare */}
          <MapStatCard
            icon="💰"
            label="Fare"
            value={`₹${fare}`}
            sub="Estimated"
            gold
          />

          {/* Elapsed / duration */}
          <MapStatCard
            icon="⏱️"
            label={activeRide.status === 'in_progress' ? 'Elapsed' : 'Est. time'}
            value={activeRide.status === 'in_progress'
              ? formatElapsed(elapsed)
              : `${Math.round((totalDist / 30) * 60)} min`}
            sub={activeRide.status === 'in_progress' ? 'In trip' : 'Travel time'}
          />
        </div>
      )}

      {/* ── PROGRESS BAR ─────────────────────────────────────────── */}
      {activeRide?.status === 'in_progress' && (
        <div style={{
          background:'var(--white)', borderRadius:'var(--r-lg)',
          border:'1px solid var(--gray-100)', padding:'var(--sp-4)',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'var(--sp-2)' }}>
            <div style={{ fontSize:'0.8125rem', fontWeight:600, color:'var(--purple)' }}>
              🚗 Trip Progress
            </div>
            <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:'1rem' }} className="gradient-text">
              {progress}%
            </div>
          </div>
          <div style={{ height:8, background:'var(--gray-100)', borderRadius:'var(--r-full)', overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:'var(--r-full)',
              background:'linear-gradient(90deg, var(--purple), var(--gold))',
              width:`${progress}%`,
              transition:'width 0.8s ease',
              boxShadow:'0 0 8px rgba(124,58,237,0.5)',
            }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:'var(--sp-2)', fontSize:'0.75rem', color:'var(--neutral-400)' }}>
            <span>🟢 {activeRide.pickup_address?.split(',')[0]}</span>
            <span>🔴 {activeRide.destination_address?.split(',')[0]}</span>
          </div>
        </div>
      )}

      {/* ── MAP CANVAS ───────────────────────────────────────────── */}
      <div className="map-container" style={{ height: typeof window !== 'undefined' && window.innerWidth < 768 ? 260 : MAP_H, position:'relative' }}>
        <div className="map-grid" />

        {/* Roads */}
        {[18,32,48,62,78].map(p => <div key={p} className="map-road-h" style={{ top:`${p}%` }} />)}
        {[12,25,40,55,70,85].map(p => <div key={p} className="map-road-v" style={{ left:`${p}%` }} />)}

        {/* SVG — route line + animated travel path */}
        {pPx && dPx && (
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }}>
            <defs>
              <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#7C3AED" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.5" />
              </linearGradient>
              <linearGradient id="travelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#7C3AED" stopOpacity="1" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
              </linearGradient>
              {/* Glow filter */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Full route (dashed, faded) */}
            <line
              x1={pPx.x} y1={pPx.y} x2={dPx.x} y2={dPx.y}
              stroke="url(#routeGrad)" strokeWidth="2.5" strokeDasharray="8 5"
            />

            {/* Travelled portion (solid, bright) */}
            {vPx && (
              <line
                x1={pPx.x} y1={pPx.y} x2={vPx.x} y2={vPx.y}
                stroke="url(#travelGrad)" strokeWidth="4"
                filter="url(#glow)"
              />
            )}

            {/* Distance label on route midpoint */}
            {totalDist > 0 && (
              <g>
                <rect
                  x={(pPx.x+dPx.x)/2 - 26} y={(pPx.y+dPx.y)/2 - 10}
                  width={52} height={20} rx={10}
                  fill="rgba(13,11,20,0.75)"
                />
                <text
                  x={(pPx.x+dPx.x)/2} y={(pPx.y+dPx.y)/2 + 4}
                  textAnchor="middle"
                  fill="white" fontSize="10" fontWeight="700"
                  fontFamily="'Syne', sans-serif"
                >
                  {totalDist} km
                </text>
              </g>
            )}
          </svg>
        )}

        {/* Pickup pin */}
        {pPx && (
          <div style={{ position:'absolute', left:pPx.x, top:pPx.y, transform:'translate(-50%,-100%)' }}>
            <div style={{
              background:'var(--green)', width:32, height:32,
              borderRadius:'50% 50% 50% 0', transform:'rotate(-45deg)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 12px rgba(5,150,105,0.7)',
            }}>
              <span style={{ transform:'rotate(45deg)', color:'white', fontSize:13, fontWeight:700 }}>A</span>
            </div>
            <div style={{
              marginTop:4, background:'rgba(5,150,105,0.9)', backdropFilter:'blur(4px)',
              borderRadius:4, padding:'2px 6px', fontSize:'0.6rem', fontWeight:700,
              color:'white', whiteSpace:'nowrap', textAlign:'center',
              maxWidth:90, overflow:'hidden', textOverflow:'ellipsis',
            }}>
              📍 {activeRide?.pickup_address?.split(',')[0]}
            </div>
          </div>
        )}

        {/* Destination pin */}
        {dPx && (
          <div style={{ position:'absolute', left:dPx.x, top:dPx.y, transform:'translate(-50%,-100%)' }}>
            <div style={{
              background:'var(--gold)', width:32, height:32,
              borderRadius:'50% 50% 50% 0', transform:'rotate(-45deg)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 12px rgba(245,158,11,0.7)',
              animation:'goldGlow 2s infinite',
            }}>
              <span style={{ transform:'rotate(45deg)', color:'white', fontSize:13, fontWeight:700 }}>B</span>
            </div>
            <div style={{
              marginTop:4, background:'rgba(180,83,9,0.9)', backdropFilter:'blur(4px)',
              borderRadius:4, padding:'2px 6px', fontSize:'0.6rem', fontWeight:700,
              color:'white', whiteSpace:'nowrap', textAlign:'center',
              maxWidth:90, overflow:'hidden', textOverflow:'ellipsis',
            }}>
              🏁 {activeRide?.destination_address?.split(',')[0]}
            </div>
          </div>
        )}

        {/* Driver pin with direction indicator */}
        {vPx && (
          <div style={{
            position:'absolute', left:vPx.x, top:vPx.y,
            transform:'translate(-50%,-50%)',
            transition:'left 1s ease, top 1s ease',
            zIndex:10,
          }}>
            {/* Ripple ring */}
            <div style={{
              position:'absolute', inset:-8, borderRadius:'50%',
              border:'2px solid rgba(124,58,237,0.4)',
              animation:'glowPulse 1.5s infinite',
            }} />
            <div style={{
              width:40, height:40, borderRadius:'50%',
              background:'linear-gradient(135deg, var(--purple), var(--purple-dark))',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'18px',
              boxShadow:'0 0 20px rgba(124,58,237,0.9)',
              border:'2px solid rgba(255,255,255,0.3)',
            }}>🚗</div>
            <div style={{
              position:'absolute', top:-22, left:'50%', transform:'translateX(-50%)',
              background:'rgba(124,58,237,0.9)', backdropFilter:'blur(4px)',
              borderRadius:4, padding:'2px 8px',
              fontSize:'0.6rem', fontWeight:700, color:'white', whiteSpace:'nowrap',
            }}>
              {activeRide?.status === 'matched' ? '▶ Arriving' : `▶ ${progress}% done`}
            </div>
          </div>
        )}

        {/* Status badge top-left */}
        {activeRide && (
          <div style={{
            position:'absolute', top:'var(--sp-3)', left:'var(--sp-3)',
            background:'rgba(13,11,20,0.8)', backdropFilter:'blur(8px)',
            border:'1px solid rgba(124,58,237,0.4)',
            borderRadius:'var(--r-full)', padding:'5px 14px',
            display:'flex', alignItems:'center', gap:'var(--sp-2)',
          }}>
            <div style={{
              width:7, height:7, borderRadius:'50%',
              background: activeRide.status==='in_progress' ? 'var(--green)'
                        : activeRide.status==='matched'     ? 'var(--purple)'
                        : 'var(--amber)',
              animation:'pulse 1.5s infinite',
            }} />
            <span style={{ color:'white', fontSize:'0.75rem', fontWeight:700, fontFamily:'var(--font-head)' }}>
              {activeRide.status === 'requested'   ? 'Finding driver…'
               : activeRide.status === 'matched'   ? 'Driver on the way'
               : activeRide.status === 'in_progress' ? 'En route'
               : activeRide.status}
            </span>
          </div>
        )}

        {/* ETA badge top-right (when in progress) */}
        {activeRide?.status === 'in_progress' && (
          <div style={{
            position:'absolute', top:'var(--sp-3)', right:'var(--sp-3)',
            background:'rgba(245,158,11,0.15)', backdropFilter:'blur(8px)',
            border:'1px solid rgba(245,158,11,0.4)',
            borderRadius:'var(--r-full)', padding:'5px 14px',
          }}>
            <span style={{ fontSize:'0.75rem', fontWeight:700, fontFamily:'var(--font-head)' }} className="gold-text">
              Arrives {arrivalTime}
            </span>
          </div>
        )}

        {/* Idle overlay */}
        {!activeRide && (
          <div style={{
            position:'absolute', inset:0, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center', gap:'var(--sp-4)',
            background:'rgba(13,11,20,0.55)',
          }}>
            <div style={{ fontSize:'3.5rem', animation:'float 3s ease-in-out infinite' }}>🗺️</div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:700, color:'rgba(255,255,255,0.7)', fontSize:'1rem' }}>
                Book a ride to see the map
              </div>
              <div style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.8125rem', marginTop:4 }}>
                Live tracking will appear here
              </div>
            </div>
          </div>
        )}

        {/* Bottom credit */}
        <div style={{
          position:'absolute', bottom:'var(--sp-2)', right:'var(--sp-3)',
          background:'rgba(13,11,20,0.6)', backdropFilter:'blur(6px)',
          border:'1px solid rgba(124,58,237,0.2)',
          borderRadius:'var(--r-full)', padding:'2px 8px',
          fontSize:'0.6rem', color:'rgba(255,255,255,0.3)',
        }}>
          Simulated map · RideNow
        </div>
      </div>

      {/* ── ROUTE SUMMARY CARD (when ride active) ─────────────────── */}
      {activeRide && (
        <div style={{
          background:'var(--white)', borderRadius:'var(--r-lg)',
          border:'1px solid var(--gray-100)', padding:'var(--sp-4)',
          display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:'var(--sp-3)',
        }}>
          {/* Pickup */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', marginBottom:4 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--green)', flexShrink:0 }} />
              <span className="label">Pickup</span>
            </div>
            <div style={{ fontWeight:600, fontSize:'0.875rem', color:'var(--black)' }}>
              {activeRide.pickup_address}
            </div>
          </div>

          {/* Arrow + dist */}
          <div style={{ textAlign:'center', padding:'0 var(--sp-2)' }}>
            <div style={{ fontSize:'1.25rem', marginBottom:2 }} className="gradient-text">→</div>
            <div style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--neutral-400)' }}>{totalDist} km</div>
          </div>

          {/* Destination */}
          <div style={{ textAlign:'right' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', marginBottom:4, justifyContent:'flex-end' }}>
              <span className="label">Drop</span>
              <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--gold)', flexShrink:0 }} />
            </div>
            <div style={{ fontWeight:600, fontSize:'0.875rem', color:'var(--black)' }}>
              {activeRide.destination_address}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── MAP STAT CARD ────────────────────────────────────────────────── */
function MapStatCard({ icon, label, value, sub, highlight, gold }) {
  const isDark = highlight || gold
  return (
    <div style={{
      background: highlight ? 'linear-gradient(135deg, var(--purple-deep), var(--purple-mid))'
                : gold      ? 'linear-gradient(135deg, #92400E, #78350F)'
                : 'var(--white)',
      borderRadius:'var(--r-md)',
      border: highlight ? '1px solid rgba(124,58,237,0.5)'
            : gold      ? '1px solid rgba(245,158,11,0.5)'
            : '1px solid var(--gray-100)',
      padding:'var(--sp-3) var(--sp-2)',
      textAlign:'center',
      transition:'transform var(--t-normal), box-shadow var(--t-normal)',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='var(--shadow-md)' }}
    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
    >
      <div style={{ fontSize:'1rem', marginBottom:4 }}>{icon}</div>

      {/* Value — always white on dark, always black on white */}
      <div style={{
        fontFamily:'var(--font-head)', fontWeight:800,
        fontSize:'0.9375rem', lineHeight:1.2,
        color: isDark ? '#FFFFFF' : 'var(--black)',
      }}>
        {value}
      </div>

      {/* Label */}
      <div style={{
        fontSize:'0.6rem', fontWeight:600,
        letterSpacing:'0.05em', textTransform:'uppercase', marginTop:3,
        color: isDark ? 'rgba(255,255,255,0.55)' : 'var(--neutral-500)',
      }}>
        {label}
      </div>

      {/* Sub */}
      {sub && (
        <div style={{
          fontSize:'0.6rem', marginTop:2,
          color: isDark ? 'rgba(255,255,255,0.4)' : 'var(--neutral-400)',
        }}>
          {sub}
        </div>
      )}
    </div>
  )
}
/* ── RATING MODAL ─────────────────────────────────────────────────── */
function RatingModal({ ride, userId, onClose }) {
  const [score, setScore]     = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')

  // Priority chain for driver's user_id:
  // 1. ride.drivers.user_id  → best, from joined query
  // 2. Look it up from DB if missing
  const [driverUserId, setDriverUserId] = useState(null)

  useEffect(() => {
    // If we already have user_id from the join, use it directly
    if (ride.drivers?.user_id) {
      setDriverUserId(ride.drivers.user_id)
      return
    }
    // ride.driver_id is drivers table UUID — look up the user_id
    if (ride.driver_id) {
      supabase
        .from('drivers')
        .select('user_id')
        .eq('id', ride.driver_id)
        .single()
        .then(({ data }) => {
          if (data?.user_id) setDriverUserId(data.user_id)
          else setError('Could not find driver details.')
        })
    }
  }, [ride.driver_id, ride.drivers?.user_id])

  const submit = async () => {
    if (!driverUserId) { setError('Driver info missing. Please try again.'); return }
    setLoading(true)
    setError('')
    try {
      await ratingService.submit(ride.id, userId, driverUserId, score, comment)
      setDone(true)
      setTimeout(onClose, 2000)
    } catch (err) {
      setError(err.message || 'Failed to submit rating. Please try again.')
    }
    setLoading(false)
  }

  const stars = [1, 2, 3, 4, 5]
  const labels = { 1:'Terrible', 2:'Poor', 3:'Okay', 4:'Good', 5:'Excellent' }

  return (
    <div style={{
      position:'fixed', inset:0,
      background:'rgba(13,11,20,0.85)',
      backdropFilter:'blur(12px)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:500, padding:'var(--sp-4)',
    }}>
      <div className="anim-scale" style={{
        background:'white',
        borderRadius:'var(--r-xl)',
        padding:'var(--sp-8)',
        maxWidth:420, width:'100%',
        textAlign:'center',
        boxShadow:'0 32px 80px rgba(124,58,237,0.5)',
        border:'1px solid var(--gray-100)',
      }}>
        {done ? (
          /* ── Success state ── */
          <div style={{ padding:'var(--sp-4) 0' }}>
            <div style={{ fontSize:'4rem', marginBottom:'var(--sp-4)', animation:'float 2s ease-in-out infinite' }}>🎉</div>
            <h2 className="heading-1 gradient-text" style={{ marginBottom:'var(--sp-2)' }}>
              Thanks for rating!
            </h2>
            <p style={{ color:'var(--neutral-500)' }}>
              Your feedback helps improve the platform.
            </p>
            <div style={{ display:'flex', justifyContent:'center', gap:4, marginTop:'var(--sp-4)' }}>
              {stars.map(s => (
                <span key={s} style={{
                  fontSize:'1.5rem',
                  filter: s <= score ? 'none' : 'grayscale(1) opacity(0.3)',
                }}>⭐</span>
              ))}
            </div>
          </div>
        ) : (
          /* ── Rating form ── */
          <>
            {/* Header */}
            <div style={{
              background:'linear-gradient(135deg, var(--purple-deep), var(--purple-mid))',
              borderRadius:'var(--r-lg)', padding:'var(--sp-5)',
              marginBottom:'var(--sp-6)',
            }}>
              <div style={{ fontSize:'2rem', marginBottom:'var(--sp-2)' }}>🏁</div>
              <h2 className="heading-2" style={{ color:'white', marginBottom:'var(--sp-1)' }}>
                Trip Completed!
              </h2>
              <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.8125rem' }}>
                {ride.pickup_address?.split(',')[0]} → {ride.destination_address?.split(',')[0]}
              </p>
              <div style={{ marginTop:'var(--sp-3)', display:'flex', justifyContent:'center', gap:'var(--sp-6)' }}>
                <div>
                  <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>Fare</div>
                  <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:'1.25rem' }} className="gold-text">
                    ₹{ride.fare_estimate}
                  </div>
                </div>
                <div>
                  <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.65rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>Distance</div>
                  <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:'1.25rem', color:'white' }}>
                    {ride.distance_km} km
                  </div>
                </div>
              </div>
            </div>

            <h3 className="heading-3" style={{ marginBottom:'var(--sp-2)', color:'var(--purple-dark)' }}>
              Rate your driver
            </h3>
            <p style={{ color:'var(--neutral-500)', marginBottom:'var(--sp-5)', fontSize:'0.875rem' }}>
              {ride.drivers?.users?.email?.split('@')[0] || 'Your driver'} ·{' '}
              {ride.drivers?.vehicle_make} {ride.drivers?.vehicle_model}
            </p>

            {/* Star selector */}
            <div style={{ marginBottom:'var(--sp-2)' }}>
              <div style={{ display:'flex', justifyContent:'center', gap:'var(--sp-2)', marginBottom:'var(--sp-2)' }}>
                {stars.map(s => (
                  <button key={s} onClick={() => setScore(s)} style={{
                    fontSize:'2.25rem', background:'none', cursor:'pointer', border:'none',
                    transform: s <= score ? 'scale(1.2)' : 'scale(0.9)',
                    transition:'all 0.15s ease',
                    filter: s <= score ? 'none' : 'grayscale(1) opacity(0.3)',
                  }}>⭐</button>
                ))}
              </div>
              <div style={{
                fontFamily:'var(--font-head)', fontWeight:700,
                fontSize:'0.875rem', color:'var(--purple)',
                height:20,
              }}>
                {labels[score]}
              </div>
            </div>

            {/* Comment */}
            <textarea
              className="form-input"
              rows={3}
              placeholder="Add a comment (optional)…"
              value={comment}
              onChange={e => setComment(e.target.value)}
              style={{ resize:'none', marginBottom:'var(--sp-4)', marginTop:'var(--sp-4)', textAlign:'left' }}
            />

            {error && <div className="alert alert-error" style={{ marginBottom:'var(--sp-3)', fontSize:'0.8125rem' }}>{error}</div>}

            <div style={{ display:'flex', gap:'var(--sp-3)' }}>
              <button onClick={onClose} className="btn btn-ghost btn-full">
                Skip
              </button>
              <button onClick={submit} className="btn btn-primary btn-full" disabled={loading}>
                {loading
                  ? <><div className="spinner spinner-sm" style={{borderTopColor:'white'}} /> Submitting…</>
                  : `Submit ${score}★`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ── TRIP HISTORY ─────────────────────────────────────────────────── */
export function TripHistoryPage() {
  const { user } = useAuth()
  const [trips, setTrips]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    rideService.getRiderHistory(user.id).then(({ data }) => {
      setTrips(data || []); setLoading(false)
    })
  }, [user])

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-main">
        <div className="container">
          <div className="page-header anim-fade">
            <h1 className="heading-1" style={{ marginBottom:'var(--sp-1)' }}>
              My <span className="gradient-text">Trips</span>
            </h1>
            <p style={{ color:'var(--neutral-500)' }}>{trips.length} trip{trips.length !== 1 ? 's' : ''} total</p>
          </div>

          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'var(--sp-16)' }}>
              <div className="spinner spinner-lg" />
            </div>
          ) : trips.length === 0 ? (
            <EmptyState icon="🗺️" title="No trips yet" description="Your completed trips will appear here" />
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)' }} className="stagger">
              {trips.map((trip,i) => (
                <div key={trip.id} className="card anim-fade" style={{
                  display:'flex', gap:'var(--sp-5)', alignItems:'center',
                  animationDelay:`${i*40}ms`,
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
                    fontSize:'1.25rem', flexShrink:0,
                  }}>🚕</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', flexWrap:'wrap' }}>
                      <span style={{ fontFamily:'var(--font-head)', fontWeight:600 }}>{trip.pickup_address}</span>
                      <span style={{ color:'var(--purple)', fontWeight:700 }}>→</span>
                      <span style={{ fontFamily:'var(--font-head)', fontWeight:600, color:'var(--neutral-600)' }}>{trip.destination_address}</span>
                    </div>
                    <div style={{ fontSize:'0.8125rem', color:'var(--neutral-400)', marginTop:2 }}>
                      {new Date(trip.created_at).toLocaleDateString('en-IN',{ weekday:'short', day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:'1.125rem', marginBottom:'var(--sp-1)' }} className="gradient-text">
                      ₹{trip.fare_estimate}
                    </div>
                    <div className={`badge badge-${trip.status}`}>{trip.status.replace('_',' ')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}