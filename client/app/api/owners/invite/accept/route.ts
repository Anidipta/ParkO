import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'
import { hashPassword, isValidEmail, validatePasswordStrength } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, full_name, password, email } = body
    if (!token || !full_name || !password || !email) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }
    const pwd = validatePasswordStrength(password)
    if (!pwd.isValid) {
      return NextResponse.json({ error: pwd.error }, { status: 400 })
    }

    // find invite
    const { data: invites, error: invErr } = await supabaseAdmin
      .from('space_managers')
      .select('*')
      .eq('invite_token', token)
      .limit(1)
    if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 })
    const invite = (invites as any)?.[0]
    if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    if (invite.invite_status === 'accepted') {
      return NextResponse.json({ error: 'Invite already accepted' }, { status: 409 })
    }

    // check if user already exists
    const { data: existing } = await supabaseAdmin.from('users').select('user_id').eq('email', email).single()
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const password_hash = await hashPassword(password)

    // create user for manager
    const { data: users, error: uErr } = await supabaseAdmin
      .from('users')
      .insert([{ email, password_hash, full_name, user_type: 'manager' }])
      .select()
      .single()
    if (uErr || !users) return NextResponse.json({ error: uErr?.message || 'Failed to create user' }, { status: 500 })
    const user = users as any

    // update space_managers with user_id and set accepted
    const { error } = await supabaseAdmin
      .from('space_managers')
      .update({ user_id: user.user_id, invite_status: 'accepted' })
      .eq('invite_token', token)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, user }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
