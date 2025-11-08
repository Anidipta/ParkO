import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const space_id = url.searchParams.get('space_id')
    const slot_type = url.searchParams.get('slot_type')
    
    if (!space_id || !slot_type) {
      return new Response(JSON.stringify({ error: 'space_id and slot_type required' }), { status: 400 })
    }
    
    // Get slot group for this type
    const { data: slotGroup } = await supabaseAdmin
      .from('parking_slots')
      .select('slot_id')
      .eq('space_id', space_id)
      .eq('slot_type', slot_type)
      .single()
    
    if (!slotGroup) {
      return new Response(JSON.stringify({ error: 'Slot type not found' }), { status: 404 })
    }
    
    // Find active bookings for this slot, sorted by end_time
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select('end_time')
      .eq('slot_id', slotGroup.slot_id)
      .in('booking_status', ['confirmed', 'active'])
      .order('end_time', { ascending: true })
      .limit(1)
    
    if (!bookings || bookings.length === 0) {
      return new Response(JSON.stringify({ nextAvailable: null }), { status: 200 })
    }
    
    // Calculate next available: earliest end_time + 15 minutes buffer
    const earliestExit = new Date(bookings[0].end_time)
    const nextAvailable = new Date(earliestExit.getTime() + 15 * 60 * 1000) // +15 minutes
    
    return new Response(JSON.stringify({ 
      nextAvailable: nextAvailable.toISOString(),
      earliestExit: earliestExit.toISOString()
    }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
