// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { authService, userService, supabase } from '../services/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(null)
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    authService.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = authService.onAuthChange((_event, session) => {
      setSession(session)
      if (session?.user) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Load profile — auto-creates it if missing ─────────────────
  async function loadProfile(userId) {
    setLoading(true)
    try {
      let { data: profile } = await userService.getProfile(userId)

      // Profile missing — create it automatically
      if (!profile) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const role     = user.user_metadata?.role     || 'rider'
          const fullName = user.user_metadata?.full_name || ''
          await supabase.from('users').upsert({
            id: user.id,
            email: user.email,
            role,
            full_name: fullName,
            is_active: true,
          })
          const { data: newProfile } = await userService.getProfile(userId)
          profile = newProfile
        }
      }
      setProfile(profile)
    } catch (err) {
      console.error('loadProfile error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── Sign in ───────────────────────────────────────────────────
  async function signIn(email, password) {
    const { data, error } = await authService.signIn(email, password)
    if (error) throw error
    return data
  }

  // ── Sign up — creates everything in one go ────────────────────
  async function signUp(email, password, role, fullName, vehicleData) {
    // 1. Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: fullName },
        emailRedirectTo: window.location.origin + '/login',
      }
    })
    if (error) throw error

    const user = data.user
    if (!user) throw new Error('User creation failed')

    // 2. Upsert public.users profile
    const { error: profileError } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      role,
      full_name: fullName,
      is_active: true,
    })
    if (profileError) console.error('Profile upsert error:', profileError)

    // 3. If driver — create drivers row immediately
    if (role === 'driver' && vehicleData) {
      const { error: driverError } = await supabase.from('drivers').upsert({
        user_id:       user.id,
        vehicle_make:  vehicleData.make,
        vehicle_model: vehicleData.model,
        vehicle_plate: vehicleData.plate,
        vehicle_color: vehicleData.color,
        is_approved:   false,
        is_available:  false,
      })
      if (driverError) console.error('Driver upsert error:', driverError)
    }

    return data
  }

  // ── Sign out ──────────────────────────────────────────────────
  async function signOut() {
    await authService.signOut()
    setSession(null)
    setProfile(null)
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile: () => session?.user && loadProfile(session.user.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}