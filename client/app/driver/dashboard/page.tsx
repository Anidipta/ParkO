"use client"

import { useState } from "react"
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
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null)

  const currentBooking: Booking = {
    id: "BK001",
    space: "Downtown Plaza - Level 2",
    date: "Today",
    startTime: "14:30",
    endTime: "16:30",
    amount: 120,
    status: "active",
  }

  const nearbySpaces: ParkingSpace[] = [
    {
      id: "PS001",
      name: "Downtown Plaza",
      distance: "45m",
      rate: 60,
      type: "Standard",
      availability: 5,
      nextFree: "1:15 PM",
    },
    {
      id: "PS002",
      name: "Shopping Mall",
      distance: "120m",
      rate: 45,
      type: "Compact",
      availability: 12,
      nextFree: "Now",
    },
    {
      id: "PS003",
      name: "Tech Hub Garage",
      distance: "185m",
      rate: 50,
      type: "Premium",
      availability: 3,
      nextFree: "2:45 PM",
    },
  ]

  const pastBookings: Booking[] = [
    {
      id: "BK002",
      space: "Airport Terminal Parking",
      date: "Nov 1, 2025",
      startTime: "10:00",
      endTime: "16:00",
      amount: 180,
      status: "completed",
    },
    {
      id: "BK003",
      space: "Metro Station Lot",
      date: "Oct 30, 2025",
      startTime: "08:30",
      endTime: "14:30",
      amount: 120,
      status: "completed",
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Parko</h1>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/driver/map">
              <Button variant="ghost" size="sm" className="gap-2">
                <MapPin className="w-4 h-4" />
                Find Parking
              </Button>
            </Link>
            <Link href="/driver/profile">
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="w-4 h-4" />
                Profile
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-destructive">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-card p-4 space-y-2">
            <Link href="/driver/map" className="block">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <MapPin className="w-4 h-4" />
                Find Parking
              </Button>
            </Link>
            <Link href="/driver/profile" className="block">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <User className="w-4 h-4" />
                Profile
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="ghost" className="w-full justify-start gap-2 text-destructive">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </Link>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, John</h2>
          <p className="text-muted-foreground">Manage your parking bookings and find new spaces</p>
        </div>

        {/* Active Booking */}
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
              <p className="font-semibold capitalize bg-green-500/30 px-2 py-1 rounded text-xs w-fit">Active</p>
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
