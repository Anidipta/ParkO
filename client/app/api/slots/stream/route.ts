import type { NextRequest } from 'next/server'
import supabaseAdmin from '@/lib/supabaseServer'

// Simple SSE endpoint that polls slot availability for a space and streams updates.
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const spaceId = url.searchParams.get('space_id')
    if (!spaceId) return new Response(JSON.stringify({ error: 'space_id required' }), { status: 400 })

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        let lastSent: string | null = null

        const send = async () => {
          try {
            // fetch current slots for space (include hourly_rate so clients can show updated prices)
            const { data: slots } = await supabaseAdmin.from('parking_slots').select('slot_id, slot_number, slot_type, is_available, hourly_rate').eq('space_id', spaceId)
            const payload = { time: new Date().toISOString(), slots }
            const text = JSON.stringify(payload)
            if (text !== lastSent) {
              controller.enqueue(encoder.encode(`data: ${text}\n\n`))
              lastSent = text
            }
          } catch (err) {
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`))
          }
        }

        // initial send
        await send()

        const iv = setInterval(send, 2000)

        const onAbort = () => {
          clearInterval(iv)
          controller.close()
        }

        // abort handling
        // @ts-ignore - NextRequest.signal exists at runtime
        (req.signal as any).addEventListener?.('abort', onAbort)
      }
    })

    return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}
