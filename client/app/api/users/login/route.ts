import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password_hash } = body
    if (!email || !password_hash) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })

    const { data, error } = await supabaseAdmin.from('users').select('*').eq('email', email).limit(1)
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    const user = (data && (data as any)[0]) ?? null
    if (!user) return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })

    // NOTE: password_hash in DB is stored as-is in this demo; compare directly
    if (user.password_hash !== password_hash) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })

    return new Response(JSON.stringify({ data: user }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
