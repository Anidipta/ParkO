import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const spaceId = url.searchParams.get('space_id')
    const date = url.searchParams.get('date') // YYYY-MM-DD
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')

    if (!spaceId) return new Response(JSON.stringify({ error: 'space_id required' }), { status: 400 })

    let q = supabaseAdmin.from('analytics_logs').select('*').eq('space_id', spaceId)
    if (date) q = q.eq('date', date)
    if (from) q = q.gte('date', from)
    if (to) q = q.lte('date', to)

    const { data, error } = await q.order('date', { ascending: false }).limit(365)
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    return new Response(JSON.stringify({ data }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
