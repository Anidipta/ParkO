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

  const spaces: ParkingSpace[] = [
    {
      id: "SP001",
      name: "Downtown Plaza",
      location: "Downtown District",
      capacity: 50,
      occupied: 35,
      rate: 60,
      managers: 2,
    },
    {
      id: "SP002",
      name: "Tech Hub Garage",
      location: "Tech Park",
      capacity: 100,
      occupied: 67,
      rate: 50,
      managers: 1,
    },
    {
      id: "SP003",
      name: "Shopping Mall",
      location: "Retail Zone",
      capacity: 75,
      occupied: 42,
      rate: 45,
      managers: 3,
    },
  ]

  const recentBookings: Booking[] = [
    {
      id: "BK001",
      driver: "John Doe",
      space: "Downtown Plaza",
      startTime: "14:30",
      endTime: "16:30",
      amount: 120,
      status: "active",
    },
    {
      id: "BK002",
      driver: "Jane Smith",
      space: "Tech Hub Garage",
      startTime: "10:00",
      endTime: "14:00",
      amount: 200,
      status: "active",
    },
    {
      id: "BK003",
      driver: "Mike Johnson",
      space: "Shopping Mall",
      startTime: "09:00",
      endTime: "11:00",
      amount: 90,
      status: "completed",
    },
  ]

  const totalEarnings = spaces.reduce((sum, space) => sum + space.occupied * space.rate, 0)
  const totalOccupancy = Math.round(
    (spaces.reduce((sum, space) => sum + space.occupied, 0) / spaces.reduce((sum, space) => sum + space.capacity, 0)) *
      100,
  )

  const [analytics, setAnalytics] = useState<Array<any>>([])
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  useEffect(() => {
    // fetch analytics for the first space (demo)
    const spaceId = spaces[0]?.id
    if (!spaceId) return
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
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back, Premium Parking</h2>
          <p className="text-muted-foreground">Manage your parking spaces and track earnings</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
                <h3 className="text-3xl font-bold text-foreground">₹{totalEarnings.toLocaleString()}</h3>
              </div>
              <TrendingUp className="w-8 h-8 text-secondary" />
            </div>
            <p className="text-xs text-muted-foreground">Today's revenue from all spaces</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Occupancy Rate</p>
                <h3 className="text-3xl font-bold text-foreground">{totalOccupancy}%</h3>
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
        <div className="flex gap-4 mb-8 border-b border-border">
          {(["overview", "spaces", "managers"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-3 font-semibold border-b-2 transition-colors ${
                selectedTab === tab
                  ? "border-secondary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
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
          <div className="space-y-4">
            {spaces.map((space) => (
              <div key={space.id} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground">{space.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {space.location}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-secondary">₹{space.rate}</p>
                    <p className="text-xs text-muted-foreground">per hour</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                    <p className="font-bold text-foreground">{space.capacity} spots</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Occupied</p>
                    <p className="font-bold text-foreground">
                      {space.occupied}/{space.capacity}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Occupancy</p>
                    <p className="font-bold text-foreground">{Math.round((space.occupied / space.capacity) * 100)}%</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/owner/space/${space.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
                      <Edit2 className="w-4 h-4" />
                      Manage
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <MapPin className="w-4 h-4" />
                    View Map
                  </Button>
                </div>
              </div>
            ))}

            <Link href="/owner/add-space">
              <Button className="w-full">+ Add New Parking Space</Button>
            </Link>
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
