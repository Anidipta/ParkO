import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { booking_id, otp, type } = body // type: 'entry' | 'exit'

    if (!booking_id || !otp || !type) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })

    // fetch booking
    const { data: bdata, error: bErr } = await supabaseAdmin.from('bookings').select('*').eq('booking_id', booking_id).limit(1)
    if (bErr) return new Response(JSON.stringify({ error: bErr.message }), { status: 500 })
    const booking = (bdata as any)?.[0]
    if (!booking) return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404 })

    if (type === 'entry') {
      if (booking.otp_entry !== otp) return new Response(JSON.stringify({ error: 'Invalid OTP' }), { status: 403 })
      const { error } = await supabaseAdmin.from('bookings').update({ otp_entry_verified: true }).eq('booking_id', booking_id)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }

    if (type === 'exit') {
      if (booking.otp_exit !== otp) return new Response(JSON.stringify({ error: 'Invalid OTP' }), { status: 403 })
      const { error } = await supabaseAdmin.from('bookings').update({ otp_exit_verified: true, actual_exit_time: new Date().toISOString() }).eq('booking_id', booking_id)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    }

    return new Response(JSON.stringify({ error: 'Unknown type' }), { status: 400 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
