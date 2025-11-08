import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

/**
 * Create a booking. Accepts driver_id, space_id, optional slot_id, start_time, end_time.
 * If slot_id not provided, picks the first available slot in the space (and matching slot_type if provided).
 * Calculates estimated_amount based on slot hourly_rate and hours.
 * Validates that the slot is not already booked for the requested time range.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { driver_id, space_id, slot_id, slot_type, start_time, end_time, hourly_rate } = body

    if (!driver_id || !space_id) return new Response(JSON.stringify({ error: 'Missing driver_id or space_id' }), { status: 400 })

    // Fetch driver profile to get license plate (no longer required in request body)
    const { data: driverProfile, error: profileError } = await supabaseAdmin
      .from('driver_profiles')
      .select('plate_number, license_number')
      .eq('user_id', driver_id)
      .single()

    if (profileError || !driverProfile) {
      return new Response(JSON.stringify({ error: 'Driver profile not found' }), { status: 404 })
    }

    if (!driverProfile.plate_number) {
      return new Response(JSON.stringify({ error: 'Please complete your profile with vehicle plate number' }), { status: 400 })
    }

    const start = start_time ? new Date(start_time) : new Date()
    const end = end_time ? new Date(end_time) : new Date(start.getTime() + 2 * 60 * 60 * 1000) // default 2 hours

    // determine slot
    let chosenSlotId = slot_id
    let slotHourlyRate = hourly_rate ? Number(hourly_rate) : 0

    if (!chosenSlotId) {
      // find first available slot in the space that's not booked for the requested time range
      let q = supabaseAdmin.from('parking_slots').select('*').eq('space_id', space_id).limit(100)
      if (slot_type) q = q.eq('slot_type', slot_type)
      
      const { data: slots, error: slotErr } = await q
      if (slotErr) return new Response(JSON.stringify({ error: slotErr.message }), { status: 500 })
      if (!slots || slots.length === 0) return new Response(JSON.stringify({ error: 'No slots found' }), { status: 409 })

      // Check which slots have overlapping bookings
      const slotIds = slots.map((s: any) => s.slot_id)
      const { data: overlappingBookings } = await supabaseAdmin
        .from('bookings')
        .select('slot_id')
        .in('slot_id', slotIds)
        .lt('start_time', end.toISOString())
        .gt('end_time', start.toISOString())
        .in('booking_status', ['confirmed', 'active', 'pending'])

      const bookedSlotIds = new Set(overlappingBookings?.map((b: any) => b.slot_id) ?? [])
      
      // Find first slot that's not booked during the requested time
      const availableSlot = slots.find((s: any) => !bookedSlotIds.has(s.slot_id))
      
      if (!availableSlot) return new Response(JSON.stringify({ error: 'No available slots for the requested time' }), { status: 409 })
      
      chosenSlotId = availableSlot.slot_id
      slotHourlyRate = Number(availableSlot.hourly_rate ?? 0)
    } else {
      // Validate that the specific slot is not already booked for the requested time
      const { data: overlapping } = await supabaseAdmin
        .from('bookings')
        .select('booking_id')
        .eq('slot_id', chosenSlotId)
        .lt('start_time', end.toISOString())
        .gt('end_time', start.toISOString())
        .in('booking_status', ['confirmed', 'active', 'pending'])
        .limit(1)

      if (overlapping && overlapping.length > 0) {
        return new Response(JSON.stringify({ error: 'Slot is already booked for this time range' }), { status: 409 })
      }

      // Get hourly rate for the chosen slot
      const { data: slotData } = await supabaseAdmin
        .from('parking_slots')
        .select('hourly_rate')
        .eq('slot_id', chosenSlotId)
        .single()
      
      if (!slotData) {
        return new Response(JSON.stringify({ error: 'Slot not found' }), { status: 404 })
      }
      
      slotHourlyRate = Number(slotData.hourly_rate ?? 0)
    }

    const hours = Math.max(0.25, (end.getTime() - start.getTime()) / (1000 * 60 * 60))
    const estimated = Math.round(hours * slotHourlyRate * 100) / 100

    const insertPayload = {
      driver_id,
      slot_id: chosenSlotId,
      space_id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      estimated_amount: estimated,
      booking_status: 'pending',
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert([insertPayload])
      .select() // Must select to return inserted data
    
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    
    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ error: 'Failed to create booking' }), { status: 500 })
    }

    const booking = data[0]

    // create initial payment record (pending)
    await supabaseAdmin.from('payments').insert([{ 
      booking_id: booking.booking_id, 
      estimated_amount: estimated, 
      payment_method: 'card', 
      payment_status: 'pending' 
    }])

    return new Response(JSON.stringify({ data: booking }), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const driverId = url.searchParams.get('driver_id')
    const spaceId = url.searchParams.get('space_id')

    let q = supabaseAdmin
      .from('bookings')
      .select(`
        *, 
        users(full_name, email),
        parking_spaces(space_name, address, latitude, longitude)
      `)
      .limit(500)
      
    if (driverId) q = q.eq('driver_id', driverId)
    if (spaceId) q = q.eq('space_id', spaceId)

    const { data, error } = await q
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    return new Response(JSON.stringify({ data }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
