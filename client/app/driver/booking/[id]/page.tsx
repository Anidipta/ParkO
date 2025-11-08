"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MapPin, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function BookingPage() {
  const params = useParams()
  const [duration, setDuration] = useState(2)
  const [currentTime, setCurrentTime] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })
  const [step, setStep] = useState<"time" | "payment" | "confirm">("time")
  const [bookingResult, setBookingResult] = useState<any | null>(null)
  const [space, setSpace] = useState<any>(null)
  const [slots, setSlots] = useState<any[] | null>(null)
  const [loadingSpace, setLoadingSpace] = useState(true)
  const [timeAwareAvailability, setTimeAwareAvailability] = useState<{ available_count: number, total_slots: number, occupied_count: number } | null>(null)
  const [activeBookings, setActiveBookings] = useState<any[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)

  // Fetch real parking space details
  useEffect(() => {
    const spaceId = Array.isArray(params.id) ? params.id[0] : params.id
    if (!spaceId) return
    ;(async () => {
      try {
        setLoadingSpace(true)
        // load basic space info
        const res = await fetch('/api/parking')
        const j = await res.json().catch(() => ({}))
        if (res.ok && Array.isArray(j.data)) {
          const found = j.data.find((s: any) => s.space_id === spaceId)
          if (found) {
            setSpace(found)
          }
        }

        // load slot list for space to compute rate and availability
        const slotsRes = await fetch(`/api/slots?space_id=${encodeURIComponent(spaceId)}`)
        const slotsJson = await slotsRes.json().catch(() => ({}))
        if (slotsRes.ok && Array.isArray(slotsJson.data)) {
          setSlots(slotsJson.data)
        }
      } catch (err) {
        console.warn('load space/slots failed', err)
      } finally {
        setLoadingSpace(false)
      }
    })()
  }, [params.id])

  // subscribe to slot stream for live updates (price / availability)
  useEffect(() => {
  const spaceId = Array.isArray(params.id) ? params.id[0] : params.id
    if (!spaceId) return
    let es: EventSource | null = null
    try {
      es = new EventSource(`/api/slots/stream?space_id=${encodeURIComponent(spaceId)}`)
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data)
          if (payload?.slots && Array.isArray(payload.slots)) {
            setSlots(payload.slots)
          }
        } catch (e) {
          // ignore parse errors
        }
      }
      es.onerror = () => {
        // close on error; fallback will continue to work
        if (es) {
          es.close()
          es = null
        }
      }
    } catch (e) {
      // EventSource not available or blocked
    }
    return () => { if (es) es.close() }
  }, [params.id])

  // compute hourly rate from slots (cheapest available slot) and total amount
  const hourlyRate = (() => {
    if (slots && slots.length > 0) {
      // prefer cheapest available slot, otherwise cheapest overall
      const available = slots.filter((s: any) => s.is_available)
      const pickFrom = available.length > 0 ? available : slots
      const cheapest = pickFrom.reduce((acc: any, s: any) => {
        const rate = Number(s.hourly_rate ?? 0)
        return (acc === null || rate < acc) ? rate : acc
      }, null)
      return cheapest ?? space?.hourly_rate ?? space?.cheapest_rate ?? 60
    }
    return space?.hourly_rate ?? space?.cheapest_rate ?? 60
  })()
  const totalAmount = duration * hourlyRate

  // Use time-aware availability if available, fallback to simple is_available check
  const availableCount = timeAwareAvailability?.available_count ?? (slots?.filter(s => s.is_available).length ?? 0)
  const totalSlots = timeAwareAvailability?.total_slots ?? (slots?.length ?? space?.total_slots ?? 0)
  const occupiedCount = timeAwareAvailability?.occupied_count ?? (totalSlots - availableCount)

  // Fetch time-aware availability when user changes time/duration
  useEffect(() => {
    const spaceId = Array.isArray(params.id) ? params.id[0] : params.id
    if (!spaceId) return

    const fetchAvailability = async () => {
      try {
        const start = new Date()
        const [h, m] = currentTime.split(':').map(Number)
        start.setHours(h, m, 0, 0)
        const end = new Date(start.getTime() + duration * 60 * 60 * 1000)

        const res = await fetch(`/api/slots/availability?space_id=${encodeURIComponent(spaceId)}&start_time=${start.toISOString()}&end_time=${end.toISOString()}`)
        const json = await res.json()
        if (res.ok && json.available_count != null) {
          setTimeAwareAvailability(json)
        }
      } catch (e) {
        // Ignore errors, fallback to simple availability
      }
    }

    fetchAvailability()
  }, [params.id, currentTime, duration])

  // Fetch active bookings for this space to show occupancy info
  useEffect(() => {
    const spaceId = Array.isArray(params.id) ? params.id[0] : params.id
    if (!spaceId) return

    const fetchBookings = async () => {
      try {
        setLoadingBookings(true)
        const res = await fetch(`/api/bookings?space_id=${encodeURIComponent(spaceId)}`)
        const json = await res.json()
        if (res.ok && Array.isArray(json.data)) {
          // Filter for active/pending/confirmed bookings
          const active = json.data.filter((b: any) => 
            ['confirmed', 'active', 'pending'].includes(b.booking_status) &&
            new Date(b.end_time) > new Date()
          )
          setActiveBookings(active)
        }
      } catch (e) {
        console.warn('Failed to fetch bookings', e)
      } finally {
        setLoadingBookings(false)
      }
    }

    fetchBookings()
  }, [params.id])


  const handleBooking = () => {
    if (step === "time") {
      setStep("payment")
    } else if (step === "payment") {
      ;(async () => {
        try {
          // Get current user from session
          const sessionRes = await fetch('/api/auth/session', { credentials: 'include' })
          if (!sessionRes.ok) throw new Error('You must be signed in to book')
          
          const sessionJson = await sessionRes.json()
          const user = sessionJson?.user
          const driver_id = user?.userId ?? user?.user_id
          if (!driver_id) throw new Error('You must be signed in to book')

          const start = new Date()
          const [h, m] = currentTime.split(':').map(Number)
          start.setHours(h, m, 0, 0)
          const end = new Date(start.getTime() + duration * 60 * 60 * 1000)

          const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ driver_id, space_id: params.id, start_time: start.toISOString(), end_time: end.toISOString(), hourly_rate: hourlyRate }),
          })
          const json = await res.json()
          if (!res.ok) throw new Error(json.error || 'Booking failed')

          const booking = json.data

          // create payment record (will be processed) via payments API
          await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ booking_id: booking.booking_id, payment_method: 'card' }) })

          setBookingResult(booking)
          setStep('confirm')
        } catch (err: any) {
          alert(err.message || 'Booking failed')
        }
      })()
    }
  }

  const TimeSelector = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Start Time</label>
          <input
            type="time"
            value={currentTime}
            onChange={(e) => setCurrentTime(e.target.value)}
            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">Date</label>
          <input
            type="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground mb-2 block">Duration (hours)</label>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 6, 8, 12, 24].map((h) => (
            <button
              key={h}
              onClick={() => setDuration(h)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                duration === h
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-border hover:border-primary"
              }`}
            >
              {h}h
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Info Card */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Hourly Rate</p>
            <p className="text-3xl font-bold text-primary">₹{hourlyRate}</p>
            <p className="text-xs text-muted-foreground mt-1">per hour</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Total Cost</p>
            <p className="text-2xl font-bold text-foreground">₹{totalAmount}</p>
            <p className="text-xs text-muted-foreground mt-1">for {duration}h</p>
          </div>
        </div>
        
        <div className="border-t border-primary/20 pt-4">
          <p className="text-xs text-muted-foreground mb-2">Price breakdown:</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Base rate × Duration</span>
            <span className="font-semibold">₹{hourlyRate} × {duration}h = ₹{totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Availability Card */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Space Availability</h3>
          {timeAwareAvailability && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Live</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{availableCount}</div>
            <div className="text-xs text-green-700 mt-1">Available</div>
          </div>
          <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{occupiedCount}</div>
            <div className="text-xs text-red-700 mt-1">Occupied</div>
          </div>
          <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalSlots}</div>
            <div className="text-xs text-blue-700 mt-1">Total Slots</div>
          </div>
        </div>

        <div className="bg-muted/50 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Occupancy Rate</span>
            <span className="text-sm font-bold text-foreground">
              {totalSlots > 0 ? Math.round((occupiedCount / totalSlots) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-green-500 to-primary h-2 rounded-full transition-all"
              style={{ width: `${totalSlots > 0 ? (occupiedCount / totalSlots) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {availableCount === 0 && (
          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800 font-semibold">⚠️ No slots available for selected time</p>
            <p className="text-xs text-orange-700 mt-1">Try a different time or duration</p>
          </div>
        )}
      </div>

      {/* Active Bookings Info */}
      {activeBookings.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="font-semibold text-foreground mb-3">Current Bookings</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activeBookings.slice(0, 5).map((booking: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                <div>
                  <span className="font-medium text-foreground">Slot #{booking.slot_id?.slice(-4) ?? 'N/A'}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    booking.booking_status === 'active' ? 'bg-green-100 text-green-700' :
                    booking.booking_status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {booking.booking_status}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(booking.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - 
                  {new Date(booking.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
          {activeBookings.length > 5 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              +{activeBookings.length - 5} more bookings
            </p>
          )}
        </div>
      )}
    </div>
  )

  const PaymentReview = () => (
    <div className="space-y-6">
      {/* Booking Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-bold text-foreground mb-4 text-lg">Booking Summary</h3>

        <div className="space-y-4">
          {/* Location */}
          <div className="flex items-start gap-3 pb-4 border-b border-border">
            <MapPin className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-foreground">{space?.space_name}</p>
              <p className="text-sm text-muted-foreground">{space?.address}</p>
            </div>
          </div>

          {/* Time Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Start Time</p>
              <p className="font-semibold text-foreground">{currentTime}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="font-semibold text-foreground">{duration} hours</p>
            </div>
          </div>

          {/* Pricing Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Hourly Rate</span>
              <span className="font-semibold text-foreground">₹{hourlyRate}/hr</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-semibold text-foreground">{duration} hours</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">₹{totalAmount}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-bold text-foreground">Total Amount</span>
              <span className="text-2xl font-bold text-primary">₹{totalAmount}</span>
            </div>
          </div>

          {/* Slot Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-semibold mb-1">✓ Slot Selection</p>
            <p className="text-xs text-blue-800">
              Best available slot will be assigned automatically based on your preferences
            </p>
          </div>
        </div>
      </div>

      {/* Terms & Payment Info */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-bold text-foreground mb-4">Payment & Terms</h3>
        
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-5 h-5 mt-0.5 rounded border-border" />
            <span className="text-sm text-foreground">
              I agree to the <span className="text-primary underline">terms and conditions</span> and 
              <span className="text-primary underline"> cancellation policy</span>
            </span>
          </label>
        </div>
      </div>

      {/* Payment Method Info */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-green-900 font-semibold mb-1">Secure Payment Processing</p>
            <p className="text-xs text-green-800">
              Payment will be processed using Parko Wallet or Credit Card. 
              You'll receive an OTP for entry verification after booking confirmation.
            </p>
          </div>
        </div>
      </div>

      {/* Availability Warning */}
      {availableCount === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-900 font-semibold">⚠️ Cannot proceed</p>
          <p className="text-xs text-red-800 mt-1">No slots available for the selected time. Please go back and choose a different time.</p>
        </div>
      )}
    </div>
  )

  const ConfirmationScreen = () => {
    const startTime = currentTime
    const [startHour] = currentTime.split(':').map(Number)
    const endHour = (startHour + duration) % 24
    const endTime = `${String(endHour).padStart(2, '0')}:00`

    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
            <Check className="w-10 h-10 text-white" />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground">Your parking spot has been reserved successfully</p>
        </div>

        <div className="bg-card border-2 border-green-500 rounded-lg p-6 text-left space-y-4">
          {/* Booking Reference */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Booking Reference</p>
            <p className="font-mono font-bold text-lg text-foreground">{bookingResult?.booking_id ?? 'Loading...'}</p>
          </div>

          {/* Location */}
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-1">Parking Location</p>
            <p className="font-bold text-foreground text-lg">{space?.space_name}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              {space?.address}
            </p>
          </div>

          {/* Slot Info */}
          {bookingResult?.slot_id && (
            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted-foreground mb-1">Assigned Slot</p>
              <p className="font-bold text-foreground text-lg">Slot #{bookingResult.slot_id.slice(-8)}</p>
            </div>
          )}

          {/* Time Details */}
          <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Start Time</p>
              <p className="font-bold text-foreground">{startTime}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">End Time</p>
              <p className="font-bold text-foreground">{endTime}</p>
            </div>
          </div>

          {/* Duration */}
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-1">Duration</p>
            <p className="font-bold text-foreground">{duration} hours</p>
          </div>

          {/* Amount */}
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
            <p className="text-3xl font-bold text-primary">₹{bookingResult?.estimated_amount ?? totalAmount}</p>
          </div>

          {/* Status */}
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground mb-1">Booking Status</p>
            <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
              {bookingResult?.booking_status?.toUpperCase() ?? 'PENDING'}
            </span>
          </div>
        </div>

        {/* OTP Info */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm text-green-900 font-semibold mb-2">Entry Instructions</p>
              <p className="text-sm text-green-800">
                An entry OTP will be sent to your registered mobile number. Present this OTP at the parking entrance to access your reserved slot.
              </p>
              {bookingResult?.otp_entry && (
                <div className="mt-3 bg-white border border-green-300 rounded p-2">
                  <p className="text-xs text-green-700 mb-1">Entry OTP:</p>
                  <p className="font-mono text-xl font-bold text-green-900">{bookingResult.otp_entry}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Link href="/driver/dashboard" className="block">
            <Button className="w-full" size="lg">Back to Dashboard</Button>
          </Link>
          <Link href={`/driver/booking/${bookingResult?.booking_id}`} className="block">
            <Button variant="outline" className="w-full">View Booking Details</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/driver/dashboard">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Book Parking Space</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Loading State */}
        {loadingSpace ? (
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        ) : !space ? (
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <p className="text-destructive">Space not found</p>
          </div>
        ) : (
          <>
            {/* Space Info */}
            <div className="bg-gradient-to-br from-card to-muted/30 border border-border rounded-lg p-6 mb-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground mb-2">{space?.space_name}</h2>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {space?.address}
                  </p>
                </div>
                <div className="text-right bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Starting from</p>
                  <p className="text-3xl font-bold text-primary">₹{hourlyRate}</p>
                  <p className="text-xs text-muted-foreground mt-1">per hour</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{availableCount}</p>
                  <p className="text-xs text-muted-foreground">Available Now</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{totalSlots}</p>
                  <p className="text-xs text-muted-foreground">Total Slots</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{slots?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Slot Types</p>
                </div>
              </div>
            </div>

        {/* Progress Steps */}
        <div className="flex gap-4 mb-8">
          {["time", "payment", "confirm"].map((s, i) => (
            <div
              key={s}
              className={`flex-1 flex items-center justify-center p-4 rounded-lg border transition-colors ${
                step === s
                  ? "bg-primary border-primary text-primary-foreground"
                  : ["time", "payment"].includes(s) && (step === "payment" || step === "confirm")
                    ? "bg-primary/10 border-primary"
                    : "bg-muted border-border"
              }`}
            >
              {i + 1}. {s.charAt(0).toUpperCase() + s.slice(1)}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          {step === "time" && <TimeSelector />}
          {step === "payment" && <PaymentReview />}
          {step === "confirm" && <ConfirmationScreen />}
        </div>

        {/* Actions */}
        {step !== "confirm" && (
          <div className="flex gap-4">
            {step !== "time" && (
              <Button
                variant="outline"
                onClick={() => setStep(step === "payment" ? "time" : "payment")}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button 
              onClick={handleBooking} 
              className="flex-1"
              disabled={step === "payment" && availableCount === 0}
            >
              {step === "time" ? "Continue to Payment" : "Confirm Booking"}
            </Button>
          </div>
        )}
            </>
        )}
      </div>
    </main>
  )
}
