"use client"

import { useState } from "react"
import { useEffect } from "react"
import Link from "next/link"
import { Plus, MapPin, Users, TrendingUp, LogOut, Menu, X, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ParkingSpace {
  id: string
  name: string
  location: string
  capacity: number
  occupied: number
  rate: number
  managers: number
}

interface Booking {
  id: string
  driver: string
  space: string
  startTime: string
  endTime: string
  amount: number
  status: "active" | "completed" | "pending"
}

export default function OwnerDashboard() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState<"overview" | "spaces" | "managers">("overview")
  const [spaces, setSpaces] = useState<ParkingSpace[]>([])
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [loadingSpaces, setLoadingSpaces] = useState(true)
  const [loadingBookings, setLoadingBookings] = useState(true)

  // Load owner's session, then fetch spaces and bookings from APIs.
  useEffect(() => {
    let mounted = true
    async function loadSpacesAndBookings() {
      try {
        // Get session to identify owner (if available)
        const sessRes = await fetch('/api/auth/session', { credentials: 'include' })
        const sessJson = await sessRes.json().catch(() => ({}))
        const ownerId = sessJson?.user?.userId ?? sessJson?.user?.user_id ?? null

        // Fetch spaces belonging to this owner (if ownerId available) otherwise fetch active spaces
        const spacesUrl = ownerId ? `/api/parking?owner_id=${encodeURIComponent(ownerId)}` : '/api/parking'
        setLoadingSpaces(true)
        const spRes = await fetch(spacesUrl, { credentials: 'include' })
        const spJson = await spRes.json().catch(() => ({ data: [] }))
        const rawSpaces = Array.isArray(spJson.data) ? spJson.data : []

        const mappedSpaces: ParkingSpace[] = rawSpaces.map((s: any) => ({
          id: s.space_id ?? s.id ?? String(s.id ?? ''),
          name: s.space_name ?? s.name ?? 'Parking Space',
          location: s.address ?? s.location ?? '—',
          capacity: Number(s.total_slots ?? s.capacity ?? 0),
          occupied: Number(s.occupied ?? 0),
          rate: Number(s.hourly_rate ?? s.cheapest_rate ?? s.rate ?? 0),
          managers: Number(s.managers_count ?? s.managers ?? 0),
        }))

        if (!mounted) return
        setSpaces(mappedSpaces)
        setLoadingSpaces(false)

        // Fetch recent bookings for all spaces owned
        setLoadingBookings(true)
        const bookingsPerSpace = await Promise.all(
          mappedSpaces.map(async (sp) => {
            try {
              const res = await fetch(`/api/bookings?space_id=${encodeURIComponent(sp.id)}`, { credentials: 'include' })
              const j = await res.json().catch(() => ({ data: [] }))
              const raw = Array.isArray(j.data) ? j.data : []
              return raw.map((b: any) => ({
                id: b.booking_id ?? b.id ?? String(b.id ?? ''),
                driver: b.users?.full_name ?? b.driver_name ?? b.driver ?? 'Driver',
                space: sp.name,
                startTime: b.start_time ? new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (b.start_time ?? ''),
                endTime: b.end_time ? new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (b.end_time ?? ''),
                amount: Number(b.estimated_amount ?? b.amount ?? 0),
                status: (b.booking_status ?? b.status ?? 'pending') as Booking['status'],
              }))
            } catch (err) {
              return []
            }
          }),
        )

        if (!mounted) return
        const flattened = bookingsPerSpace.flat().sort((a, b) => {
          // sort by most recent start time (fallback to 0)
          const ta = new Date(a.startTime).getTime() || 0
          const tb = new Date(b.startTime).getTime() || 0
          return tb - ta
        })
        setRecentBookings(flattened.slice(0, 25))
      } catch (err) {
        // ignore errors but stop spinners
        setSpaces([])
        setRecentBookings([])
      } finally {
        if (mounted) {
          setLoadingSpaces(false)
          setLoadingBookings(false)
        }
      }
    }

    loadSpacesAndBookings()
    return () => {
      mounted = false
    }
  }, [])

  const totalEarnings = spaces.reduce((sum, space) => sum + space.occupied * space.rate, 0)
  const totalOccupancy = Math.round(
    (spaces.reduce((sum, space) => sum + space.occupied, 0) / spaces.reduce((sum, space) => sum + space.capacity, 0)) *
      100,
  )

  const [analytics, setAnalytics] = useState<Array<any>>([])
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false)

  useEffect(() => {
    // fetch analytics for the first space only once
    if (analyticsLoaded || spaces.length === 0) return
    const spaceId = spaces[0]?.id
    if (!spaceId) return
    
    setAnalyticsLoaded(true) // Prevent re-runs
    const to = new Date()
    const from = new Date()
    from.setDate(to.getDate() - 6)
    const fmt = (d: Date) => d.toISOString().slice(0, 10)
    setLoadingAnalytics(true)
    fetch(`/api/analytics?space_id=${encodeURIComponent(spaceId)}&from=${fmt(from)}&to=${fmt(to)}`)
      .then(r => r.json())
      .then(j => setAnalytics(j.data ?? []))
      .catch(() => setAnalytics([]))
      .finally(() => setLoadingAnalytics(false))
  }, [spaces.length > 0, analyticsLoaded]) // Only run when spaces are available and not already loaded

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, Premium Parking</h2>
          <p className="text-muted-foreground">Manage your parking spaces and track earnings</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card-pattern border border-blue-200/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-blue-600 font-medium mb-1">Total Earnings</p>
                <h3 className="text-3xl font-bold text-slate-800">₹{totalEarnings.toLocaleString()}</h3>
              </div>
              <div className="bg-gradient-to-br from-green-400 to-green-600 p-2 rounded-lg shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Today's revenue from all spaces</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Occupancy Rate</p>
                <h3 className="text-3xl font-bold text-foreground">{ totalOccupancy > 0 ? totalOccupancy + '%' : '0%' }</h3>
              </div>
              <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-secondary" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Across all parking spaces</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Bookings</p>
                <h3 className="text-3xl font-bold text-foreground">
                  {recentBookings.filter((b) => b.status === "active").length}
                </h3>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Right now</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mb-8 border-b border-border w-full">
          {(["overview", "spaces", "managers"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`flex-1 px-4 py-3 font-semibold border-2 rounded-lg mx-2 transition-colors ${
                selectedTab === tab
                  ? "border-red-500 text-foreground bg-gray-200"
                  : "border-black bg-gray-100 text-muted-foreground hover:text-foreground hover:bg-gray-200"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {selectedTab === "overview" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-4">Analytics (last 7 days)</h3>
              <div className="bg-card border border-border rounded-lg overflow-hidden p-4">
                {loadingAnalytics ? (
                  <div className="text-sm text-muted-foreground">Loading analytics…</div>
                ) : analytics.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No analytics data available</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground">
                          <th className="p-2">Date</th>
                          <th className="p-2">Bookings</th>
                          <th className="p-2">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.map((row: any) => (
                          <tr key={row.date} className="border-t border-border">
                            <td className="p-2">{row.date}</td>
                            <td className="p-2">{row.total_bookings}</td>
                            <td className="p-2">₹{Number(row.total_revenue || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-4">Recent Bookings</h3>
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="divide-y divide-border">
                  {recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 flex items-center justify-between hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{booking.driver}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.space} • {booking.startTime}-{booking.endTime}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">₹{booking.amount}</p>
                        <p
                          className={`text-xs font-semibold ${
                            booking.status === "active" ? "text-green-600" : "text-muted-foreground"
                          }`}
                        >
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Spaces Tab */}
        {selectedTab === "spaces" && (
          <div>
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
              {spaces.map((space) => (
                <div key={space.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-foreground">{space.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {space.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-secondary">₹{space.rate}</p>
                      <p className="text-xs text-muted-foreground">per hour</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Capacity</p>
                      <p className="font-bold text-foreground">{space.capacity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Occupied</p>
                      <p className="font-bold text-foreground">{space.occupied}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Occupancy</p>
                      <p className="font-bold text-foreground">{Math.round((space.occupied / Math.max(1, space.capacity)) * 100)}%</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/owner/space/${space.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
                        <Edit2 className="w-4 h-4" />
                        Manage
                      </Button>
                    </Link>
                    <Link href={`/owner/space/${space.id}?map=1`}>
                      <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <MapPin className="w-4 h-4" />
                        View Map
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Link href="/owner/add-space">
                <Button className="w-full">+ Add New Parking Space</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Managers Tab */}
        {selectedTab === "managers" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-bold text-foreground mb-4">Space Managers</h3>
              <div className="space-y-3">
                {spaces.map((space) => (
                  <div key={space.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{space.name}</p>
                      <p className="text-xs text-muted-foreground">{space.managers} manager(s)</p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                      <Users className="w-4 h-4" />
                      Manage
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-6">
              <h3 className="font-bold text-foreground mb-3">Add a Manager</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Invite sub-managers to handle specific parking spaces. They'll receive a special referral link.
              </p>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Invite Manager
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
