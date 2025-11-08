import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

/**
 * Calculate time-aware slot availability for a space.
 * Returns count of slots that are NOT booked during the requested time range.
 * 
 * Query params:
 * - space_id (required): the parking space
 * - start_time (optional): ISO string for range start (default: now)
 * - end_time (optional): ISO string for range end (default: now + 2 hours)
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const spaceId = url.searchParams.get('space_id')
    
    if (!spaceId) {
      return new Response(JSON.stringify({ error: 'space_id required' }), { status: 400 })
    }

    const now = new Date()
    const startParam = url.searchParams.get('start_time')
    const endParam = url.searchParams.get('end_time')
    
    const startTime = startParam ? new Date(startParam) : now
    const endTime = endParam ? new Date(endParam) : new Date(now.getTime() + 2 * 60 * 60 * 1000)

    // Get all slots for this space
    const { data: slots, error: slotsError } = await supabaseAdmin
      .from('parking_slots')
      .select('slot_id')
      .eq('space_id', spaceId)

    if (slotsError) {
      return new Response(JSON.stringify({ error: slotsError.message }), { status: 500 })
    }

    const totalSlots = slots?.length ?? 0

    // Find bookings that overlap with the requested time range
    // A booking overlaps if: booking.start_time < requested.end_time AND booking.end_time > requested.start_time
    const { data: overlappingBookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('slot_id, booking_status')
      .eq('space_id', spaceId)
      .lt('start_time', endTime.toISOString())
      .gt('end_time', startTime.toISOString())
      .in('booking_status', ['confirmed', 'active', 'pending'])

    if (bookingsError) {
      return new Response(JSON.stringify({ error: bookingsError.message }), { status: 500 })
    }

    // Get unique slot IDs that have overlapping bookings
    const bookedSlotIds = new Set(overlappingBookings?.map(b => b.slot_id) ?? [])
    const availableCount = Math.max(0, totalSlots - bookedSlotIds.size)

    return new Response(
      JSON.stringify({
        space_id: spaceId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        total_slots: totalSlots,
        available_count: availableCount,
        occupied_count: bookedSlotIds.size,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

// Update slot availability and record a slot_availability entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slot_id, is_occupied, occupied_until } = body
    if (!slot_id || typeof is_occupied !== 'boolean') return new Response(JSON.stringify({ error: 'slot_id and is_occupied required' }), { status: 400 })

    // update parking_slots is_available flag
    const { error: upErr } = await supabaseAdmin.from('parking_slots').update({ is_available: !is_occupied }).eq('slot_id', slot_id)
    if (upErr) return new Response(JSON.stringify({ error: upErr.message }), { status: 500 })

    // record availability entry for now
    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const time_slot = now.toTimeString().slice(0, 8)

    // PostgREST upsert on multiple columns expects a comma-separated string for onConflict
    const { data, error } = await supabaseAdmin.from('slot_availability').upsert([
      { slot_id, date, time_slot, is_occupied, occupied_until: occupied_until ?? null },
    ], { onConflict: 'slot_id,date,time_slot' })

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

    return new Response(JSON.stringify({ data }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

