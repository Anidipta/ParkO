import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const spaceId = url.searchParams.get('space_id')
    if (!spaceId) return new Response(JSON.stringify({ error: 'space_id required' }), { status: 400 })

    // join space_managers with users to get manager details
    const { data, error } = await supabaseAdmin
      .from('space_managers')
      .select('manager_id, space_id, user_id, assigned_by, invite_token, invite_status, assigned_at, users(user_id, email, full_name, phone)')
      .eq('space_id', spaceId)

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    return new Response(JSON.stringify({ data }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
