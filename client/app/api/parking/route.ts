import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const ownerId = url.searchParams.get('owner_id')

    let query = supabaseAdmin
      .from('parking_spaces')
      .select('space_id, space_name, address, latitude, longitude, total_slots, is_active')
      .limit(500)

    if (ownerId) {
      query = query.eq('owner_id', ownerId)
    } else {
      query = query.eq('is_active', true)
    }

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
    const { owner_id, space_name, address, latitude, longitude, total_slots } = body

    if (!owner_id || !space_name || latitude == null || longitude == null || !total_slots) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    const { data, error } = await supabaseAdmin.from('parking_spaces').insert([
      {
        owner_id,
        space_name,
        address: address ?? '',
        latitude,
        longitude,
        total_slots,
        is_active: true,
      },
    ])

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

    return new Response(JSON.stringify({ data }), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

