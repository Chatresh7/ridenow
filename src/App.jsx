// src/App.jsx
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProtectedRoute, LoadingScreen } from './components/shared/index.jsx'
import { LandingPage }     from './pages/LandingPage'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { RiderDashboard, TripHistoryPage } from './pages/RiderDashboard'
import { DriverDashboard, EarningsPage }   from './pages/DriverDashboard'
import { AdminPanel }      from './pages/AdminPanel'

// Auto-redirect after login based on role
function RoleRedirect() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!user) return
    if (profile?.role === 'driver') navigate('/driver', { replace: true })
    else if (profile?.role === 'admin') navigate('/admin', { replace: true })
    else navigate('/rider', { replace: true })
  }, [user, profile, loading])

  return <LoadingScreen message="Redirecting..." />
}

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingScreen />

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={!user ? <LandingPage /> : <RoleRedirect />} />
      <Route path="/login" element={!user ? <LoginPage /> : <RoleRedirect />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <RoleRedirect />} />

      {/* Rider */}
      <Route path="/rider" element={
        <ProtectedRoute requiredRole="rider"><RiderDashboard /></ProtectedRoute>
      } />
      <Route path="/rider/history" element={
        <ProtectedRoute requiredRole="rider"><TripHistoryPage /></ProtectedRoute>
      } />

      {/* Driver */}
      <Route path="/driver" element={
        <ProtectedRoute requiredRole="driver"><DriverDashboard /></ProtectedRoute>
      } />
      <Route path="/driver/earnings" element={
        <ProtectedRoute requiredRole="driver"><EarningsPage /></ProtectedRoute>
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
