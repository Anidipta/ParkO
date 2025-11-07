import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'
import { getSessionFromRequest } from '@/lib/session'
import { hashPassword } from '@/lib/auth'

function makeToken(len = 40) {
  return Array.from(crypto.getRandomValues(new Uint8Array(len))).map((b) => b.toString(36)).join('').slice(0, len)
}

function generateRandomPassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { space_id, email, name, phone } = body

    if (!space_id || !email || !name) {
      return NextResponse.json({ error: 'Missing fields: space_id, email, name' }, { status: 400 })
    }

    // Require auth; use current user as the assigner (owner)
    const session = getSessionFromRequest(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const assigned_by = session.userId

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('user_id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    // Generate random password for the new manager
    const randomPassword = generateRandomPassword()
    const passwordHash = await hashPassword(randomPassword)

    // Create new user for the manager
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: name,
        phone: phone || null,
        user_type: 'manager',
        is_active: true,
      })
      .select()
      .single()

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    const token = makeToken(48)

    const payload = {
      space_id,
      user_id: newUser.user_id,
      assigned_by,
      invite_token: token,
      invite_status: 'accepted', // Auto-accepted since user is created
      assigned_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin.from('space_managers').insert([payload]).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Build special signup URL with email and password for auto-login
    const origin = req.headers.get('origin') || req.nextUrl.origin
    const inviteUrl = `${origin}/manager/signup?email=${encodeURIComponent(email)}&password=${encodeURIComponent(randomPassword)}&token=${encodeURIComponent(token)}`

    return NextResponse.json({ 
      data, 
      invite_url: inviteUrl,
      manager_email: email,
      manager_password: randomPassword // Include for email/communication
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
