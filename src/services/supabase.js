// src/services/supabase.js
// ─────────────────────────────────────────────────────────────────
// ALL Supabase interactions are centralised here.
// Replace the two constants below with your Supabase project values.
// ─────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL     || 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 2,  // limit events to reduce rate limit hits
    }
  }
})

// ── AUTH ──────────────────────────────────────────────────────────
export const authService = {
  signUp: (email, password) =>
    supabase.auth.signUp({ email, password }),

  signIn: (email, password) =>
    supabase.auth.signInWithPassword({ email, password }),

  signOut: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),

  onAuthChange: (cb) => supabase.auth.onAuthStateChange(cb),
}

// ── USERS (public profile) ────────────────────────────────────────
export const userService = {
  createProfile: (id, email, role) =>
    supabase.from('users').insert({ id, email, role }),

  getProfile: (id) =>
    supabase.from('users').select('*').eq('id', id).single(),

  updateProfile: (id, updates) =>
    supabase.from('users').update(updates).eq('id', id),

  suspendUser: (id) =>
    supabase.from('users').update({ is_active: false }).eq('id', id),
}

// ── DRIVERS ───────────────────────────────────────────────────────
export const driverService = {
  register: (data) =>
    supabase.from('drivers').insert(data),

  getByUserId: (userId) =>
    supabase.from('drivers').select('*, users(*)').eq('user_id', userId).single(),

  setAvailability: (driverId, isAvailable) =>
    supabase.from('drivers').update({ is_available: isAvailable }).eq('id', driverId),

  getPendingApprovals: () =>
    supabase.from('drivers').select('*, users(email)').eq('is_approved', false),

  approve: (driverId) =>
    supabase.from('drivers').update({ is_approved: true }).eq('id', driverId),

  getAllApproved: () =>
    supabase.from('drivers').select('*, users(email)').eq('is_approved', true),
}

// ── RIDES ─────────────────────────────────────────────────────────
export const rideService = {
  request: (data) =>
    supabase.from('rides').insert(data).select().single(),

  acceptRide: (rideId, driverId) =>
    supabase.from('rides')
      .update({ driver_id: driverId, status: 'matched' })
      .eq('id', rideId)
      .eq('status', 'requested')
      .select().single(),

  startRide: (rideId) =>
    supabase.from('rides')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', rideId).select().single(),

  completeRide: async (rideId) => {
    // Step 1: Get ride details first (don't filter by status — it may have changed)
    const { data: ride, error: fetchError } = await supabase
      .from('rides')
      .select('id, driver_id, fare_estimate, status')
      .eq('id', rideId)
      .single()

    if (fetchError) { console.error('completeRide fetch error:', fetchError); throw fetchError }
    if (!ride)      throw new Error('Ride not found')
    if (!ride.driver_id) throw new Error('No driver assigned to this ride')

    console.log('Completing ride:', ride)

    // Step 2: Update status to completed
    const { error: updateError } = await supabase
      .from('rides')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', rideId)

    if (updateError) { console.error('completeRide update error:', updateError); throw updateError }

    // Step 3: Insert earnings — use insert with ignore on duplicate
    const amount = Math.round(parseFloat(ride.fare_estimate || 0) * 0.80 * 100) / 100
    console.log('Inserting earnings:', { driver_id: ride.driver_id, ride_id: rideId, amount })

    const { error: earningsError } = await supabase
      .from('earnings')
      .insert({ driver_id: ride.driver_id, ride_id: rideId, amount })

    if (earningsError) {
      // Only ignore duplicate key errors (ride already has earnings)
      if (!earningsError.code?.includes('23505')) {
        console.error('earnings insert error:', earningsError)
      }
    }

    // Step 4: Increment total_trips
    const { error: tripError } = await supabase.rpc('increment_driver_trips', {
      driver_id: ride.driver_id
    })
    if (tripError) console.error('increment_driver_trips error:', tripError)

    return { success: true }
  },

  cancelRide: (rideId) =>
    supabase.from('rides')
      .update({ status: 'cancelled' })
      .eq('id', rideId),

  getRiderHistory: (riderId) =>
    supabase.from('rides')
      .select('*, drivers(vehicle_make, vehicle_model, vehicle_plate, users(email))')
      .eq('rider_id', riderId)
      .order('created_at', { ascending: false }),

  getDriverHistory: (driverId) =>
    supabase.from('rides')
      .select('*, users!rides_rider_id_fkey(email)')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false }),

  getActiveRide: (riderId) =>
    supabase.from('rides')
      .select('*, drivers(id, vehicle_make, vehicle_model, vehicle_plate, user_id, users(email))')
      .eq('rider_id', riderId)
      .in('status', ['requested', 'matched', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

  getDriverActiveRide: (driverId) =>
    supabase.from('rides')
      .select('*, users!rides_rider_id_fkey(email)')
      .eq('driver_id', driverId)
      .in('status', ['matched', 'in_progress'])
      .limit(1)
      .maybeSingle(),

  getPendingRides: () =>
    supabase.from('rides')
      .select('*, users!rides_rider_id_fkey(email)')
      .eq('status', 'requested')
      .order('created_at', { ascending: true }),

  getAllRides: () =>
    supabase.from('rides')
      .select('*, users!rides_rider_id_fkey(email), drivers(vehicle_plate)')
      .order('created_at', { ascending: false })
      .limit(50),
}

// ── LOCATIONS ─────────────────────────────────────────────────────
export const locationService = {
  upsert: (driverId, rideId, lat, lng) =>
    supabase.from('locations').insert({ driver_id: driverId, ride_id: rideId, lat, lng }),

  getLatest: (driverId) =>
    supabase.from('locations')
      .select('lat, lng, recorded_at')
      .eq('driver_id', driverId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
}

// ── EARNINGS ──────────────────────────────────────────────────────
export const earningsService = {
  getByDriver: (driverId) =>
    supabase.from('earnings')
      .select('*, rides(pickup_address, destination_address, completed_at)')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false }),

  getTotal: (driverId) =>
    supabase.from('earnings')
      .select('amount')
      .eq('driver_id', driverId),
}

// ── RATINGS ───────────────────────────────────────────────────────
export const ratingService = {
  submit: async (rideId, raterId, driverTableId, score, comment) => {
    // driverTableId = drivers.id (the UUID from rides.driver_id)
    // Step 1: Get driver's user_id from drivers table
    const { data: driver, error: driverErr } = await supabase
      .from('drivers')
      .select('user_id')
      .eq('id', driverTableId)
      .single()

    if (driverErr || !driver) {
      console.error('Could not find driver:', driverErr)
      throw new Error('Driver not found')
    }

    const driverUserId = driver.user_id

    // Step 2: Insert rating using driver's user_id as ratee_id
    const { error: ratingErr } = await supabase.from('ratings').insert({
      ride_id:  rideId,
      rater_id: raterId,
      ratee_id: driverUserId,
      score,
      comment: comment || null,
    })

    if (ratingErr) {
      // Ignore duplicate rating error
      if (!ratingErr.code?.includes('23505')) {
        console.error('Rating insert error:', ratingErr)
        throw ratingErr
      }
    }

    // Step 3: Recalculate avg rating
    await new Promise(r => setTimeout(r, 500))
    const { data: allRatings } = await supabase
      .from('ratings')
      .select('score')
      .eq('ratee_id', driverUserId)

    if (allRatings && allRatings.length > 0) {
      const avg     = allRatings.reduce((s, r) => s + Number(r.score), 0) / allRatings.length
      const rounded = Math.round(avg * 10) / 10
      await supabase
        .from('drivers')
        .update({ rating_avg: rounded })
        .eq('user_id', driverUserId)
    }

    return { success: true }
  },

  getForRide: (rideId) =>
    supabase.from('ratings').select('*').eq('ride_id', rideId),

  getDriverRatings: (driverUserId) =>
    supabase.from('ratings')
      .select('score, comment, created_at')
      .eq('ratee_id', driverUserId)
      .order('created_at', { ascending: false }),
}

// ── REALTIME SUBSCRIPTIONS ────────────────────────────────────────
export const realtimeService = {
  subscribeToRides: (callback) => {
    const channel = supabase
      .channel('public-rides')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, callback)
      .subscribe()
    return () => supabase.removeChannel(channel)
  },

  subscribeToRide: (rideId, callback) => {
    const channel = supabase
      .channel(`ride-${rideId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${rideId}` }, callback)
      .subscribe()
    return () => supabase.removeChannel(channel)
  },

  subscribeToDriverLocation: (driverId, callback) => {
    const channel = supabase
      .channel(`location-${driverId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'locations', filter: `driver_id=eq.${driverId}` }, callback)
      .subscribe()
    return () => supabase.removeChannel(channel)
  },

  subscribeToPendingRides: (callback) => {
    const channel = supabase
      .channel('pending-rides')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rides', filter: 'status=eq.requested' }, callback)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides' }, callback)
      .subscribe()
    return () => supabase.removeChannel(channel)
  },

  // New: subscribe to rating changes for a specific driver user_id
  subscribeToDriverRatings: (driverUserId, callback) => {
    const channel = supabase
      .channel(`ratings-${driverUserId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'ratings',
        filter: `ratee_id=eq.${driverUserId}`
      }, callback)
      .subscribe()
    return () => supabase.removeChannel(channel)
  },
}