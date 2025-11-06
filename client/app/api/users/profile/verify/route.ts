import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id } = body
    if (!user_id) return new Response(JSON.stringify({ error: 'Missing user_id' }), { status: 400 })

    const { data, error } = await supabaseAdmin.from('driver_profiles').update({ verification_status: 'verified' }).eq('user_id', user_id)
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

    return new Response(JSON.stringify({ data }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
