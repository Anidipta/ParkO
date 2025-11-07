import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const ownerId = url.searchParams.get('owner_id')

    let query = supabaseAdmin
      .from('parking_spaces')
      .select('space_id, space_name, address, latitude, longitude, total_slots, is_active, hourly_rate')
      .limit(500)

    if (ownerId) {
      query = query.eq('owner_id', ownerId)
    } else {
      query = query.eq('is_active', true)
    }

    const { data: spaces, error } = await query

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

    // For each space, get the cheapest available slot rate
    const spacesWithRates = await Promise.all(
      (spaces || []).map(async (space: any) => {
        const { data: slots } = await supabaseAdmin
          .from('parking_slots')
          .select('hourly_rate, slot_type')
          .eq('space_id', space.space_id)
          .eq('is_available', true)
          .order('hourly_rate', { ascending: true })
          .limit(1)
        
        const cheapestSlot = slots?.[0]
        return {
          ...space,
          hourly_rate: space.hourly_rate ?? 0,
          cheapest_rate: cheapestSlot?.hourly_rate ?? 0,
          slot_type: cheapestSlot?.slot_type ?? 'Standard'
        }
      })
    )

    return new Response(JSON.stringify({ data: spacesWithRates }), { status: 200, headers: { 'Content-Type': 'application/json' } })
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

    const { data: newSpace, error } = await supabaseAdmin.from('parking_spaces').insert([
      {
        owner_id,
        space_name,
        address: address ?? '',
        latitude,
        longitude,
        total_slots,
        is_active: true,
        hourly_rate: body.hourly_rate ?? 0,
      },
    ]).select().single()

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

    // Auto-create default parking slots for the new space
    const defaultSlots = []
    for (let i = 1; i <= total_slots; i++) {
      defaultSlots.push({
        space_id: newSpace.space_id,
        slot_number: `A${i.toString().padStart(2, '0')}`,
        slot_type: 'Standard',
        hourly_rate: 50, // Default rate
        is_available: true,
      })
    }

    // Insert all slots
    const { error: slotsError } = await supabaseAdmin
      .from('parking_slots')
      .insert(defaultSlots)

    if (slotsError) {
      console.warn('Failed to create default slots:', slotsError)
      // Don't fail the space creation if slots fail
    }

    return new Response(JSON.stringify({ data: newSpace }), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { space_id, hourly_rate } = body

    if (!space_id || hourly_rate == null) {
      return new Response(JSON.stringify({ error: 'Missing fields: space_id and hourly_rate' }), { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('parking_spaces')
      .update({ hourly_rate })
      .eq('space_id', space_id)
      .select()
      .single()

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

    return new Response(JSON.stringify({ data }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

