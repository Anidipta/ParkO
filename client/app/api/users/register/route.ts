import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password_hash, full_name, phone, user_type } = body

    if (!email || !password_hash || !full_name || !user_type) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }

    // insert into users
    const { data, error } = await supabaseAdmin.from('users').insert([
      {
        email,
        password_hash,
        full_name,
        phone: phone ?? null,
        user_type,
      },
    ])

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

    const user = data?.[0]

    // if driver, create empty driver_profile row to track progress
    if (user_type === 'driver' && user && (user as any).user_id) {
      await supabaseAdmin.from('driver_profiles').insert([{ user_id: (user as any).user_id }])
    }

    return new Response(JSON.stringify({ data: user ?? null }), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
