import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180
  const R = 6371000 // meters
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const lat = Number(url.searchParams.get('lat'))
    const lng = Number(url.searchParams.get('lng'))
    const radius = Number(url.searchParams.get('radius') ?? '500') // meters
    const slot_type = url.searchParams.get('slot_type')
    const min_rate = url.searchParams.get('min_rate') ? Number(url.searchParams.get('min_rate')) : undefined
    const max_rate = url.searchParams.get('max_rate') ? Number(url.searchParams.get('max_rate')) : undefined

    // basic validation
    if (isNaN(lat) || isNaN(lng)) return new Response(JSON.stringify({ error: 'lat and lng required' }), { status: 400 })

    // fetch parking spaces (bounded)
    const { data: spaces, error } = await supabaseAdmin.from('parking_spaces').select('space_id, space_name, address, latitude, longitude, total_slots').limit(500)
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

    // for each space, fetch cheapest available slot group matching slot_type if provided
    const results: any[] = []
    for (const s of (spaces as any[])) {
      const dist = haversine(lat, lng, Number(s.latitude), Number(s.longitude))
      if (dist > radius) continue

      // Fetch all slot groups for this space to calculate total availability
      const { data: allSlots } = await supabaseAdmin
        .from('parking_slots')
        .select('*')
        .eq('space_id', s.space_id)
      
      if (!allSlots || allSlots.length === 0) continue
      
      // Calculate total available slots across all groups
      const totalAvailable = allSlots.reduce((sum: number, slot: any) => 
        sum + (slot.available_count ?? 0), 0)
      
      if (totalAvailable === 0) continue // Skip if no available slots
      
      // Find cheapest available slot group matching slot_type if provided
      let cheapestSlot = null
      if (slot_type) {
        const filtered = allSlots.filter((slot: any) => 
          slot.slot_type === slot_type && (slot.available_count ?? 0) > 0)
        cheapestSlot = filtered.sort((a: any, b: any) => 
          Number(a.hourly_rate) - Number(b.hourly_rate))[0]
      } else {
        const available = allSlots.filter((slot: any) => (slot.available_count ?? 0) > 0)
        cheapestSlot = available.sort((a: any, b: any) => 
          Number(a.hourly_rate) - Number(b.hourly_rate))[0]
      }
      
      if (!cheapestSlot) continue // Skip if no matching slots

      if (min_rate != null && Number(cheapestSlot.hourly_rate) < min_rate) continue
      if (max_rate != null && Number(cheapestSlot.hourly_rate) > max_rate) continue

      results.push({ 
        space: s, 
        distance_m: Math.round(dist), 
        cheapest_slot: cheapestSlot,
        total_available: totalAvailable // Total available across all slot types
      })
    }

    // sort by distance
    results.sort((a, b) => a.distance_m - b.distance_m)

    return new Response(JSON.stringify({ data: results }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
