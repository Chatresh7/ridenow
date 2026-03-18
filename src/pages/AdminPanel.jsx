// src/pages/AdminPanel.jsx
import { useState, useEffect } from 'react'
import { driverService, rideService, userService } from '../services/supabase'
import { Navbar, Toast, EmptyState } from '../components/shared/index.jsx'
import { useAuth } from '../context/AuthContext'

export function AdminPanel() {
  const { profile } = useAuth()
  const [tab, setTab]     = useState('overview')
  const [toast, setToast] = useState(null)

  const showToast = (msg, type='success') => {
    setToast({ message:msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const tabs = [
    { id:'overview',  label:'Overview',    icon:'📊' },
    { id:'drivers',   label:'Drivers',     icon:'🚗' },
    { id:'rides',     label:'All Rides',   icon:'🗺️' },
    { id:'users',     label:'Users',       icon:'👥' },
  ]

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="page-main">
        <div className="container">
          <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <h1 className="heading-1">Admin Panel</h1>
              <p style={{ color:'var(--gray-500)' }}>Platform management · {profile?.email}</p>
            </div>
            <div style={{
              background:'var(--red-light)', color:'var(--red)',
              border:'1.5px solid var(--red)', borderRadius:'var(--r-full)',
              padding:'6px 16px', fontFamily:'var(--font-head)', fontWeight:700, fontSize:'0.8125rem',
              letterSpacing:'0.04em'
            }}>
              ADMIN
            </div>
          </div>

          {/* Tab bar */}
          <div style={{
            display:'flex', gap:'var(--sp-1)',
            background:'var(--gray-100)', borderRadius:'var(--r-lg)',
            padding:'var(--sp-1)', marginBottom:'var(--sp-8)',
            width:'fit-content'
          }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display:'flex', alignItems:'center', gap:'var(--sp-2)',
                padding:'var(--sp-2) var(--sp-5)',
                borderRadius:'var(--r-md)',
                background: tab === t.id ? 'var(--white)' : 'transparent',
                boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
                fontFamily:'var(--font-head)', fontWeight:600,
                fontSize:'0.875rem', color: tab === t.id ? 'var(--black)' : 'var(--gray-500)',
                cursor:'pointer', transition:'all var(--t-fast)'
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="anim-fade" key={tab}>
            {tab === 'overview' && <OverviewTab />}
            {tab === 'drivers'  && <DriversTab onToast={showToast} />}
            {tab === 'rides'    && <RidesTab />}
            {tab === 'users'    && <UsersTab onToast={showToast} />}
          </div>
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

// ── OVERVIEW TAB ──────────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState({ rides:0, drivers:0, pending:0, completed:0 })
  const [loading, setLoading] = useState(true)
  const [recentRides, setRecentRides] = useState([])

  useEffect(() => {
    Promise.all([
      rideService.getAllRides(),
      driverService.getAllApproved(),
      driverService.getPendingApprovals(),
    ]).then(([{ data:rides }, { data:drivers }, { data:pending }]) => {
      const completed = (rides||[]).filter(r => r.status === 'completed').length
      setStats({
        rides: (rides||[]).length,
        drivers: (drivers||[]).length,
        pending: (pending||[]).length,
        completed,
      })
      setRecentRides((rides||[]).slice(0,8))
      setLoading(false)
    })
  }, [])

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:'var(--sp-16)'}}><div className="spinner spinner-lg" /></div>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-8)' }}>
      <div className="grid-4">
        <StatBox value={stats.rides}     label="Total rides"       color="var(--blue)"  icon="🚕" />
        <StatBox value={stats.completed} label="Completed rides"   color="var(--green)" icon="✅" />
        <StatBox value={stats.drivers}   label="Active drivers"    color="var(--black)"  icon="🚗" />
        <StatBox value={stats.pending}   label="Pending approvals" color="var(--amber)" icon="⏳" badge={stats.pending > 0} />
      </div>

      <div>
        <h2 className="heading-2" style={{ marginBottom:'var(--sp-4)' }}>Recent Rides</h2>
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <RidesTable rides={recentRides} />
        </div>
      </div>
    </div>
  )
}

function StatBox({ value, label, color, icon, badge }) {
  return (
    <div className="stat-card" style={{ position:'relative' }}>
      {badge && (
        <div style={{
          position:'absolute', top:'var(--sp-3)', right:'var(--sp-3)',
          width:10, height:10, borderRadius:'50%', background:'var(--red)',
          animation:'pulse 1.5s infinite'
        }} />
      )}
      <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)' }}>
        <div style={{
          width:44, height:44, background: color + '18',
          borderRadius:'var(--r-md)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem'
        }}>{icon}</div>
        <div>
          <div className="stat-value" style={{ color, fontSize:'1.75rem' }}>{value}</div>
          <div className="stat-label">{label}</div>
        </div>
      </div>
    </div>
  )
}

// ── DRIVERS TAB ───────────────────────────────────────────────────
function DriversTab({ onToast }) {
  const [drivers, setDrivers]   = useState([])
  const [pending, setPending]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [approving, setApproving] = useState(null)
  const [view, setView]         = useState('pending') // pending | approved

  useEffect(() => {
    Promise.all([
      driverService.getPendingApprovals(),
      driverService.getAllApproved(),
    ]).then(([{ data:p }, { data:a }]) => {
      setPending(p || [])
      setDrivers(a || [])
      setLoading(false)
    })
  }, [])

  const handleApprove = async (driverId) => {
    setApproving(driverId)
    await driverService.approve(driverId)
    const { data } = await driverService.getPendingApprovals()
    const { data: approved } = await driverService.getAllApproved()
    setPending(data || [])
    setDrivers(approved || [])
    setApproving(null)
    onToast('✅ Driver approved successfully', 'success')
  }

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:'var(--sp-16)'}}><div className="spinner spinner-lg" /></div>

  const list = view === 'pending' ? pending : drivers

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:'var(--sp-3)', marginBottom:'var(--sp-6)' }}>
        {[
          { id:'pending',  label:`Pending (${pending.length})` },
          { id:'approved', label:`Approved (${drivers.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)} className={`btn ${view === t.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}>
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={view === 'pending' ? '🎉' : '🚗'} title={view === 'pending' ? 'No pending approvals' : 'No approved drivers'} description="" />
      ) : (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Plate</th>
                <th>Status</th>
                {view === 'pending' && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {list.map(d => (
                <tr key={d.id}>
                  <td>
                    <div style={{ fontWeight:600 }}>{d.users?.email?.split('@')[0]}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--gray-500)' }}>{d.users?.email}</div>
                  </td>
                  <td>{d.vehicle_color} {d.vehicle_make} {d.vehicle_model}</td>
                  <td><code style={{ background:'var(--gray-100)', padding:'2px 8px', borderRadius:4, fontSize:'0.875rem' }}>{d.vehicle_plate}</code></td>
                  <td>
                    {d.is_approved
                      ? <span className="badge badge-completed">Approved</span>
                      : <span className="badge badge-requested">Pending</span>}
                  </td>
                  {view === 'pending' && (
                    <td>
                      <button
                        onClick={() => handleApprove(d.id)}
                        className="btn btn-success btn-sm"
                        disabled={approving === d.id}
                      >
                        {approving === d.id ? <div className="spinner spinner-sm" style={{borderTopColor:'white'}} /> : 'Approve'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── RIDES TAB ─────────────────────────────────────────────────────
function RidesTab() {
  const [rides, setRides]     = useState([])
  const [filter, setFilter]   = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    rideService.getAllRides().then(({ data }) => {
      setRides(data || [])
      setLoading(false)
    })
  }, [])

  const statuses = ['all', 'requested', 'matched', 'in_progress', 'completed', 'cancelled']
  const filtered = filter === 'all' ? rides : rides.filter(r => r.status === filter)

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:'var(--sp-16)'}}><div className="spinner spinner-lg" /></div>

  return (
    <div>
      {/* Filter chips */}
      <div style={{ display:'flex', gap:'var(--sp-2)', flexWrap:'wrap', marginBottom:'var(--sp-5)' }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding:'4px 14px', borderRadius:'var(--r-full)',
            fontFamily:'var(--font-head)', fontWeight:600, fontSize:'0.8125rem',
            background: filter === s ? 'var(--black)' : 'var(--gray-100)',
            color: filter === s ? 'var(--white)' : 'var(--gray-600)',
            cursor:'pointer', border:'none', transition:'all var(--t-fast)',
            textTransform:'capitalize'
          }}>
            {s === 'all' ? `All (${rides.length})` : `${s.replace('_',' ')} (${rides.filter(r=>r.status===s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🗺️" title="No rides found" description={`No rides with status: ${filter}`} />
      ) : (
        <div className="card" style={{ padding:0, overflow:'auto' }}>
          <RidesTable rides={filtered} showDriver />
        </div>
      )}
    </div>
  )
}

function RidesTable({ rides, showDriver }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Rider</th>
          <th>From → To</th>
          {showDriver && <th>Driver</th>}
          <th>Fare</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {rides.map(r => (
          <tr key={r.id}>
            <td style={{ fontSize:'0.875rem' }}>{r['users!rides_rider_id_fkey']?.email?.split('@')[0] || '—'}</td>
            <td style={{ fontSize:'0.8125rem', maxWidth:220 }}>
              <div style={{ fontWeight:500 }}>{r.pickup_address}</div>
              <div style={{ color:'var(--gray-500)' }}>→ {r.destination_address}</div>
            </td>
            {showDriver && <td style={{ fontSize:'0.875rem' }}>{r.drivers?.vehicle_plate || '—'}</td>}
            <td style={{ fontFamily:'var(--font-head)', fontWeight:700 }}>₹{r.fare_estimate || '—'}</td>
            <td><span className={`badge badge-${r.status}`}>{r.status.replace('_',' ')}</span></td>
            <td style={{ fontSize:'0.8125rem', color:'var(--gray-500)' }}>
              {new Date(r.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── USERS TAB ─────────────────────────────────────────────────────
function UsersTab({ onToast }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // Note: admin needs service_role for full user list; this shows what RLS permits
  useEffect(() => {
    // Using a workaround — fetch drivers which have user info joined
    driverService.getAllApproved().then(({ data }) => {
      setUsers(data || [])
      setLoading(false)
    })
  }, [])

  const handleSuspend = async (userId) => {
    await userService.suspendUser(userId)
    onToast('User suspended', 'info')
  }

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:'var(--sp-16)'}}><div className="spinner spinner-lg" /></div>

  return (
    <div>
      <div className="alert alert-info" style={{ marginBottom:'var(--sp-5)', fontSize:'0.875rem' }}>
        ℹ️ Showing approved driver accounts. Full user management requires Supabase service role key (admin SDK).
      </div>
      {users.length === 0 ? (
        <EmptyState icon="👥" title="No users yet" description="Registered users will appear here" />
      ) : (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Vehicle</th>
                <th>Trips</th>
                <th>Rating</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight:500 }}>{u.users?.email}</td>
                  <td style={{ fontSize:'0.875rem' }}>{u.vehicle_make} {u.vehicle_model}</td>
                  <td>{u.total_trips}</td>
                  <td>⭐ {u.rating_avg}</td>
                  <td style={{ fontSize:'0.8125rem', color:'var(--gray-500)' }}>
                    {new Date(u.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </td>
                  <td>
                    <button onClick={() => handleSuspend(u.user_id)} className="btn btn-danger btn-sm">
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
