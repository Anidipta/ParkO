import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    const { booking_id, otp_exit } = await req.json()
    
    if (!booking_id) {
      return new Response(JSON.stringify({ error: 'booking_id required' }), { status: 400 })
    }
    
    // Get booking with slot info
    const { data: booking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*, parking_slots(hourly_rate)')
      .eq('booking_id', booking_id)
      .single()
    
    if (fetchError || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404 })
    }
    
    // If OTP provided, verify it
    if (otp_exit && booking.otp_exit !== otp_exit) {
      return new Response(JSON.stringify({ error: 'Invalid exit OTP' }), { status: 400 })
    }
    
    // Calculate final amount including overtime
    const entryTime = new Date(booking.actual_entry_time).getTime()
    const exitTime = new Date().getTime()
    const actualHours = (exitTime - entryTime) / (1000 * 60 * 60)
    const bookedHours = (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / (1000 * 60 * 60)
    
    const hourlyRate = (booking.parking_slots as any)?.hourly_rate ?? 0
    const baseAmount = bookedHours * hourlyRate
    const overtimeHours = Math.max(0, actualHours - bookedHours)
    const overtimeAmount = overtimeHours * hourlyRate * 1.5 // 1.5x rate for overtime
    const finalAmount = Math.round((baseAmount + overtimeAmount) * 100) / 100
    
    // Update booking
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        otp_exit_verified: true,
        actual_exit_time: new Date().toISOString(),
        final_amount: finalAmount,
        booking_status: 'completed'
      })
      .eq('booking_id', booking_id)
      .select()
    
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 })
    }
    
    // Update payment record
    await supabaseAdmin
      .from('payments')
      .update({
        final_amount: finalAmount,
        actual_hours_used: actualHours,
        payment_status: 'completed'
      })
      .eq('booking_id', booking_id)
    
    return new Response(JSON.stringify({ 
      data: updated[0], 
      overtime_hours: Math.round(overtimeHours * 100) / 100,
      overtime_amount: Math.round(overtimeAmount * 100) / 100,
      message: 'Booking completed successfully' 
    }), { status: 200 })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
