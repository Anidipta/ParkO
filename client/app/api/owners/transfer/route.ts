import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'
import { getSessionFromRequest } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { space_id, new_manager_user_id } = body

    if (!space_id || !new_manager_user_id) {
      return NextResponse.json({ error: 'Missing fields: space_id, new_manager_user_id' }, { status: 400 })
    }

    const session = getSessionFromRequest(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const assigned_by = session.userId

    // Insert or upsert manager record for this space
    const payload = {
      space_id,
      user_id: new_manager_user_id,
      assigned_by,
      invite_status: 'accepted',
      assigned_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin.from('space_managers').insert([payload]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
