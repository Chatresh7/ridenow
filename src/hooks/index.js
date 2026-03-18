// src/hooks/useRideStatus.js
import { useEffect, useState, useCallback } from 'react'
import { rideService, realtimeService } from '../services/supabase'

export function useRideStatus(riderId) {
  const [ride, setRide]       = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchRide = useCallback(async () => {
    if (!riderId) return
    const { data } = await rideService.getActiveRide(riderId)
    setRide(data)
    setLoading(false)
  }, [riderId])

  useEffect(() => {
    fetchRide()
  }, [fetchRide])

  useEffect(() => {
    if (!ride?.id) return
    const unsub = realtimeService.subscribeToRide(ride.id, (payload) => {
      setRide(prev => ({ ...prev, ...payload.new }))
    })
    return unsub
  }, [ride?.id])

  return { ride, loading, refetch: fetchRide }
}

// src/hooks/useDriverLocation.js
export function useDriverLocation(driverId, onUpdate) {
  useEffect(() => {
    if (!driverId) return
    const unsub = realtimeService.subscribeToDriverLocation(driverId, (payload) => {
      if (payload.new) onUpdate(payload.new)
    })
    return unsub
  }, [driverId, onUpdate])
}

// src/hooks/usePendingRides.js
export function usePendingRides() {
  const [rides, setRides]     = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRides = useCallback(async () => {
    const { data } = await rideService.getPendingRides()
    setRides(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRides()
    const unsub = realtimeService.subscribeToPendingRides(() => fetchRides())
    return unsub
  }, [fetchRides])

  return { rides, loading, refetch: fetchRides }
}
