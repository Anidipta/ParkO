import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

/**
 * Create a booking. Accepts driver_id, space_id, optional slot_id, start_time, end_time.
 * If slot_id not provided, picks the first available slot in the space (and matching slot_type if provided).
 * Calculates estimated_amount based on slot hourly_rate and hours.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { driver_id, space_id, slot_id, slot_type, start_time, end_time } = body

    if (!driver_id || !space_id) return new Response(JSON.stringify({ error: 'Missing driver_id or space_id' }), { status: 400 })

    // determine slot
    let chosenSlotId = slot_id
    let hourlyRate = 0

    if (!chosenSlotId) {
      // find first available slot in the space, optionally filtered by type
      let q = supabaseAdmin.from('parking_slots').select('*').eq('space_id', space_id).eq('is_available', true).limit(1)
      if (slot_type) q = q.eq('slot_type', slot_type)
      const { data: slots, error: slotErr } = await q
      if (slotErr) return new Response(JSON.stringify({ error: slotErr.message }), { status: 500 })
      if (!slots || slots.length === 0) return new Response(JSON.stringify({ error: 'No available slots' }), { status: 409 })
      chosenSlotId = (slots as any)[0].slot_id
      hourlyRate = Number((slots as any)[0].hourly_rate ?? 0)
    } else {
      const { data: slotData } = await supabaseAdmin.from('parking_slots').select('*').eq('slot_id', chosenSlotId).limit(1)
      hourlyRate = Number((slotData as any)?.[0]?.hourly_rate ?? 0)
    }

    const start = start_time ? new Date(start_time) : new Date()
    const end = end_time ? new Date(end_time) : new Date(start.getTime() + 2 * 60 * 60 * 1000) // default 2 hours

    const hours = Math.max(0.25, (end.getTime() - start.getTime()) / (1000 * 60 * 60))
    const estimated = Math.round(hours * hourlyRate * 100) / 100

    const insertPayload = {
      driver_id,
      slot_id: chosenSlotId,
      space_id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      estimated_amount: estimated,
      booking_status: 'pending',
    }

    const { data, error } = await supabaseAdmin.from('bookings').insert([insertPayload])
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

    const booking = (data as any)[0]

  // create initial payment record (pending)
  await supabaseAdmin.from('payments').insert([{ booking_id: booking.booking_id, estimated_amount: estimated, payment_method: 'card', payment_status: 'pending' }])

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
      .select('*, users(full_name, email)')
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
