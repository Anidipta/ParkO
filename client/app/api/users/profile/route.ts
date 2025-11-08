import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const user_id = url.searchParams.get('user_id')
    if (!user_id) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 })

    const { data, error } = await supabaseAdmin.from('driver_profiles').select('*').eq('user_id', user_id).single()
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

    return new Response(JSON.stringify({ data }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, documents } = body // documents: [{ type, extracted, b64 }]
    if (!user_id || !documents || !Array.isArray(documents)) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })

    const updates: any = {}

    for (const doc of documents) {
      const name = `${doc.type}-${Date.now()}.jpg`
      const key = `drivers/${user_id}/${name}`
      // decode base64 and upload
      try {
        const b64 = doc.b64.replace(/^data:.*;base64,/, '')
        const buffer = Buffer.from(b64, 'base64')
        // upload to storage bucket 'driver-docs'
        const up = await supabaseAdmin.storage.from('driver-docs').upload(key, buffer, { contentType: 'image/jpeg', upsert: true })
        if (up.error) {
          // fallback: skip storing but continue
          console.warn('storage upload error', up.error.message)
        } else {
          const urlRes = await supabaseAdmin.storage.from('driver-docs').getPublicUrl(key)
          const publicUrl = (urlRes as any).data?.publicUrl
          if (doc.type === 'license') {
            updates.license_number = doc.extracted
            updates.license_image_url = publicUrl
          }
          if (doc.type === 'plate') {
            updates.plate_number = doc.extracted
            updates.plate_image_url = publicUrl
          }
          if (doc.type === 'pan') {
            updates.pan_card_number = doc.extracted
            updates.pan_card_image_url = publicUrl
          }
        }
      } catch (err) {
        console.warn('upload failed', err)
      }
    }

    // mark verification status pending and let trigger calculate completion
    const { data, error } = await supabaseAdmin.from('driver_profiles').update({ ...updates, verification_status: 'pending' }).eq('user_id', user_id)
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

    return new Response(JSON.stringify({ data }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, full_name, phone } = body
    if (!user_id) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400 })

    // Update user table fields
    const updates: any = {}
    if (full_name !== undefined) updates.full_name = full_name
    if (phone !== undefined) updates.phone = phone

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString()
      const { error } = await supabaseAdmin.from('users').update(updates).eq('user_id', user_id)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
