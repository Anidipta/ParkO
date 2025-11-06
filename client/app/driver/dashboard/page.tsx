"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MapPin, Navigation, LogOut, User, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ParkingSpace {
  id: string
  name: string
  distance: string
  rate: number
  type: string
  availability: number
  nextFree: string
  reserved?: boolean
}

interface Booking {
  id: string
  space: string
  date: string
  startTime: string
  endTime: string
  amount: number
  status: "active" | "completed" | "upcoming"
}

export default function DriverDashboard() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [displayName, setDisplayName] = useState<string>('')
  
  // fetch session user to personalize greeting
  useEffect(() => {
    let ignore = false
    fetch('/api/auth/session')
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (!ignore && j?.user) {
          const name = j.user.fullName || j.user.full_name || j.user.name || j.user.email || 'Driver'
          setDisplayName(name)
        }
      })
      .catch(() => {})
    return () => { ignore = true }
  }, [])
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null)  
  const [userId, setUserId] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [nearbySpaces, setNearbySpaces] = useState<ParkingSpace[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [loadingSpaces, setLoadingSpaces] = useState(false)

  // current and past computed from bookings
  const currentBooking = bookings.find((b) => b.status === 'active' || b.status === 'upcoming') ?? null
  const pastBookings = bookings.filter((b) => b.status === 'completed')

  // fetch session and bookings
  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        const s = await fetch('/api/auth/session').then((r) => r.ok ? r.json() : null).catch(() => null)
        const uid = s?.user?.userId ?? s?.user?.user_id ?? null
        if (!uid) return
        if (ignore) return
        setUserId(uid)
        setLoadingBookings(true)
        const res = await fetch(`/api/bookings?driver_id=${encodeURIComponent(uid)}`)
        const j = await res.json().catch(() => ({}))
        if (res.ok && Array.isArray(j.data)) {
          setBookings(j.data.map((bk: any) => ({
            id: bk.booking_id,
            space: bk.space_id || bk.space_name || 'Unknown',
            date: bk.start_time ? new Date(bk.start_time).toLocaleDateString() : '',
            startTime: bk.start_time ? new Date(bk.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            endTime: bk.end_time ? new Date(bk.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            amount: bk.estimated_amount ?? 0,
            status: bk.booking_status ?? 'upcoming'
          })))
        }
      } catch (err) {
        console.warn('load bookings failed', err)
      } finally {
        setLoadingBookings(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  // fetch nearby spaces using geolocation then fallback to /api/parking
  useEffect(() => {
    let ignore = false
    const loadSpaces = async () => {
      setLoadingSpaces(true)
      try {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            if (ignore) return
            try {
              const lat = pos.coords.latitude
              const lng = pos.coords.longitude
              const res = await fetch(`/api/search?lat=${lat}&lng=${lng}&radius=200`)
              const j = await res.json().catch(() => ({}))
              if (res.ok && Array.isArray(j.data)) {
                const mapped = j.data.map((r: any) => ({ id: r.space.space_id, name: r.space.space_name, distance: r.distance_text ?? '', rate: r.space.rate_per_hour ?? 0, type: r.space.type ?? '', availability: r.available_count ?? 0, nextFree: r.next_free ?? 'Now' }))
                setNearbySpaces(mapped)
                return
              }
            } catch (e) {
              console.warn(e)
            }
          }, () => {}, { enableHighAccuracy: true })
        }

        // fallback: fetch all parking spaces
        const res2 = await fetch('/api/parking')
        const j2 = await res2.json().catch(() => ({}))
        if (res2.ok && Array.isArray(j2.data)) {
          const mapped = j2.data.slice(0, 6).map((s: any) => ({ id: s.space_id, name: s.space_name, distance: '', rate: s.rate_per_hour ?? 0, type: s.type ?? '', availability: s.total_slots ?? 0, nextFree: 'Now' }))
          if (!ignore) setNearbySpaces(mapped)
        }
      } catch (err) {
        console.warn('load spaces failed', err)
      } finally {
        if (!ignore) setLoadingSpaces(false)
      }
    }
    loadSpaces()
    return () => { ignore = true }
  }, [])

  

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back{displayName ? `, ${displayName}` : ''}</h2>
          <p className="text-muted-foreground">Manage your parking bookings and find new spaces</p>
        </div>

        {/* Active Booking */}
        {currentBooking ? (
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm font-semibold opacity-90">Current Booking</p>
                <h3 className="text-2xl font-bold mt-1">{currentBooking.space}</h3>
              </div>
              <div className="text-4xl font-bold">₹{currentBooking.amount}</div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-primary-foreground/20">
              <div>
                <p className="text-xs opacity-75">Duration</p>
                <p className="font-semibold">
                  {currentBooking.startTime} - {currentBooking.endTime}
                </p>
              </div>
              <div>
                <p className="text-xs opacity-75">Date</p>
                <p className="font-semibold">{currentBooking.date}</p>
              </div>
              <div>
                <p className="text-xs opacity-75">Status</p>
                <p className="font-semibold capitalize bg-green-500/30 px-2 py-1 rounded text-xs w-fit">{currentBooking.status}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button size="sm" variant="secondary" className="gap-2">
                <Navigation className="w-4 h-4" />
                Navigate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
              >
                View Details
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 mb-8 text-center">
            <p className="text-lg font-semibold text-foreground mb-2">No active bookings</p>
            <p className="text-sm text-muted-foreground mb-4">You currently don't have an active booking. Find nearby parking to start a booking.</p>
            <Link href="/driver/map"><Button>Find Nearby Parking</Button></Link>
          </div>
        )}

        {/* Nearby Parking Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-foreground">Nearby Parking Spaces (200m)</h3>
            <Link href="/driver/map">
              <Button variant="outline" size="sm">
                View Map
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {nearbySpaces.map((space) => (
              <div
                key={space.id}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-foreground">{space.name}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {space.distance}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">₹{space.rate}</p>
                    <p className="text-xs text-muted-foreground">per hour</p>
                  </div>
                </div>

                <div className="bg-muted rounded p-3 mb-4">
                  <p className="text-xs text-muted-foreground mb-1">Available Slots</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-lg font-bold text-foreground">{space.availability}</p>
                    <p className="text-xs text-muted-foreground">{space.type}</p>
                  </div>
                  {space.nextFree !== "Now" && (
                    <p className="text-xs text-muted-foreground mt-2">Next available at {space.nextFree}</p>
                  )}
                </div>

                <Link href={`/driver/booking/${space.id}`}>
                  <Button className="w-full" size="sm">
                    Book Now
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Past Bookings */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-6">Recent Bookings</h3>
          <div className="space-y-3">
            {pastBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:bg-muted transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{booking.space}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.date} • {booking.startTime}-{booking.endTime}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">₹{booking.amount}</p>
                  <p className="text-xs text-muted-foreground capitalize">Completed</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
