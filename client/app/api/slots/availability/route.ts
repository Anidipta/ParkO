import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

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
