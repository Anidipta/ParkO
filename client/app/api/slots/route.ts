import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const spaceId = url.searchParams.get('space_id')
    const slotType = url.searchParams.get('slot_type')
    const onlyAvailable = url.searchParams.get('available') === '1'

    let query = supabaseAdmin.from('parking_slots').select('*').limit(500)
    if (spaceId) query = query.eq('space_id', spaceId)
    if (slotType) query = query.eq('slot_type', slotType)
    if (onlyAvailable) query = query.gt('available_count', 0)

    const { data, error } = await query
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    return new Response(JSON.stringify({ data }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { space_id, slot_type, slot_count, available_count, hourly_rate } = body
    if (!space_id || !slot_type || slot_count == null || hourly_rate == null) {
      return new Response(JSON.stringify({ error: 'Missing required fields: space_id, slot_type, slot_count, hourly_rate' }), { status: 400 })
    }

    const { data, error } = await supabaseAdmin.from('parking_slots').insert([
      { 
        space_id, 
        slot_type, 
        slot_count: Number(slot_count), 
        available_count: available_count != null ? Number(available_count) : Number(slot_count),
        hourly_rate 
      },
    ]).select()
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    return new Response(JSON.stringify({ data }), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { slot_id, hourly_rate, slot_count, available_count, slot_type } = body
    if (!slot_id) return new Response(JSON.stringify({ error: 'slot_id required' }), { status: 400 })

    const updates: any = {}
    if (hourly_rate != null) updates.hourly_rate = hourly_rate
    if (slot_count != null) updates.slot_count = slot_count
    if (available_count != null) updates.available_count = available_count
    if (slot_type) updates.slot_type = slot_type

    const { data, error } = await supabaseAdmin.from('parking_slots').update(updates).eq('slot_id', slot_id).select().single()
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    return new Response(JSON.stringify({ data }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
