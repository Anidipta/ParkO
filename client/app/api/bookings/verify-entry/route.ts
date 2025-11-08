import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    const { booking_id, otp_entry } = await req.json()
    
    if (!booking_id || !otp_entry) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
    }
    
    // Get booking
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('booking_id', booking_id)
      .single()
    
    if (fetchError || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404 })
    }
    
    // Verify OTP
    if (booking.otp_entry !== otp_entry) {
      return new Response(JSON.stringify({ error: 'Invalid OTP' }), { status: 400 })
    }
    
    // Update booking: mark entry verified, set actual entry time, change status to active
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        otp_entry_verified: true,
        actual_entry_time: new Date().toISOString(),
        booking_status: 'active'
      })
      .eq('booking_id', booking_id)
      .select()
    
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
    }
    
    return new Response(JSON.stringify({ 
      data: updated[0], 
      message: 'Entry verified successfully' 
    }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
