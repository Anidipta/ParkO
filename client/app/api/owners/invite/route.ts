import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'
import { getSessionFromRequest } from '@/lib/session'

function makeToken(len = 40) {
  return Array.from(crypto.getRandomValues(new Uint8Array(len))).map((b) => b.toString(36)).join('').slice(0, len)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { space_id, email, name, phone } = body

    if (!space_id || !email) {
      return NextResponse.json({ error: 'Missing fields: space_id, email' }, { status: 400 })
    }

    // Require auth; use current user as the assigner (owner)
    const session = getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const assigned_by = session.userId

    const token = makeToken(48)

    const payload = {
      space_id,
      user_id: null,
      assigned_by,
      invite_token: token,
      invite_status: 'pending',
      assigned_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin.from('space_managers').insert([payload]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Build invite URL using request origin, pointing to app page
    const origin = req.headers.get('origin') || req.nextUrl.origin
    const inviteUrl = `${origin}/owner/invite/accept?token=${encodeURIComponent(token)}${email ? `&email=${encodeURIComponent(email)}` : ''}`

    return NextResponse.json({ data, invite_url: inviteUrl }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
