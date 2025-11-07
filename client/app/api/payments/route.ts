import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { booking_id, payment_method } = body
    if (!booking_id || !payment_method) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })

    // Process payment (in production this would integrate with Stripe/PayPal etc.)
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const receiptUrl = `/api/receipts/${transactionId}` // internal receipt endpoint

    const { data, error } = await supabaseAdmin.from('payments').update({ payment_status: 'completed', transaction_id: transactionId, receipt_url: receiptUrl, payment_method }).eq('booking_id', booking_id)
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

    // also update bookings/payment link if needed
    return new Response(JSON.stringify({ data }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
