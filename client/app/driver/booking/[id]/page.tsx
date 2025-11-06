"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MapPin, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TimeSlot {
  hour: number
  available: boolean
  reserved: boolean
}

export default function BookingPage() {
  const params = useParams()
  const [duration, setDuration] = useState(2)
  const [currentTime, setCurrentTime] = useState("14:00")
  const [step, setStep] = useState<"time" | "payment" | "confirm">("time")
  const [bookingResult, setBookingResult] = useState<any | null>(null)

  // Mock parking space details
  const space = {
    id: params.id,
    name: "Downtown Plaza",
    address: "123 Main Street, Downtown",
    rate: 60,
    type: "Standard",
    level: "Level 2, Spot A12",
  }

  const hourlyRate = 60
  const totalAmount = duration * hourlyRate

  const timeSlots: TimeSlot[] = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    available: !(i < 9 || i > 20),
    reserved: i >= 13 && i <= 14,
  }))

  const handleBooking = () => {
    if (step === "time") {
      setStep("payment")
    } else if (step === "payment") {
      ;(async () => {
        try {
          const user = typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem('park_user') || 'null') : null
          const driver_id = user?.user_id
          if (!driver_id) throw new Error('You must be signed in to book')

          const start = new Date()
          const [h, m] = currentTime.split(':').map(Number)
          start.setHours(h, m, 0, 0)
          const end = new Date(start.getTime() + duration * 60 * 60 * 1000)

          const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ driver_id, space_id: params.id, start_time: start.toISOString(), end_time: end.toISOString() }),
          })
          const json = await res.json()
          if (!res.ok) throw new Error(json.error || 'Booking failed')

          const booking = json.data

          // mock payment: mark completed and get receipt
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
        <label className="text-sm font-semibold text-foreground mb-2 block">Duration (hours)</label>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 6, 8, 12].map((h) => (
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

      <div className="bg-muted rounded-lg p-4">
        <p className="text-sm text-muted-foreground mb-2">Availability</p>
        <div className="flex flex-wrap gap-2">
          {timeSlots.map((slot) => (
            <div
              key={slot.hour}
              className={`w-8 h-8 rounded flex items-center justify-center text-xs font-semibold ${
                slot.reserved
                  ? "bg-destructive text-destructive-foreground"
                  : slot.available
                    ? "bg-green-100 text-green-700"
                    : "bg-border text-muted-foreground"
              }`}
              title={`${slot.hour}:00 - ${slot.reserved ? "Reserved" : slot.available ? "Available" : "Unavailable"}`}
            >
              {slot.hour}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const PaymentReview = () => (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-bold text-foreground mb-4">Booking Summary</h3>

        <div className="space-y-3 mb-4 pb-4 border-b border-border">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-semibold text-foreground">{duration} hours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rate</span>
            <span className="font-semibold text-foreground">₹{hourlyRate}/hour</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location</span>
            <span className="font-semibold text-foreground text-right text-sm">{space.level}</span>
          </div>
        </div>

        <div className="flex justify-between mb-6">
          <span className="font-bold text-foreground">Total Amount</span>
          <span className="text-2xl font-bold text-primary">₹{totalAmount}</span>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border" />
            <span className="text-sm text-muted-foreground">I agree to the terms and conditions</span>
          </label>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          Payment will be processed using Parko Wallet or Credit Card. You'll receive an OTP verification upon
          confirmation.
        </p>
      </div>
    </div>
  )

  const ConfirmationScreen = () => (
    <div className="space-y-6 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-8 h-8 text-green-600" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h2>
        <p className="text-muted-foreground">Your parking spot has been reserved</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 text-left space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Location</p>
          <p className="font-bold text-foreground">{space.name}</p>
          <p className="text-sm text-muted-foreground">{space.address}</p>
        </div>
        <div className="border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">Time</p>
          <p className="font-bold text-foreground">
            {currentTime} - {String(Number.parseInt(currentTime) + duration).padStart(2, "0")}:00
          </p>
        </div>
        <div className="border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">Booking Reference</p>
           <p className="font-mono font-bold text-foreground bg-muted p-2 rounded">{bookingResult?.booking_id ?? 'BK-2025-001234'}</p>
        </div>
        <div className="border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">Amount</p>
           <p className="text-2xl font-bold text-primary">₹{bookingResult?.estimated_amount ?? totalAmount}</p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900 font-semibold">OTP sent to your phone: {bookingResult?.otp_entry ?? '7382'}</p>
        <p className="text-xs text-green-800 mt-1">Use this OTP to enter your parking spot</p>
      </div>

      <Link href="/driver/dashboard" className="block">
        <Button className="w-full">Back to Dashboard</Button>
      </Link>
    </div>
  )

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
        {/* Space Info */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{space.name}</h2>
              <p className="text-muted-foreground flex items-center gap-2 mt-2">
                <MapPin className="w-4 h-4" />
                {space.address}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">₹{space.rate}</p>
              <p className="text-sm text-muted-foreground">per hour</p>
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
            <Button onClick={handleBooking} className="flex-1">
              {step === "time" ? "Continue to Payment" : "Confirm Booking"}
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
