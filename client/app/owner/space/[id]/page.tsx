"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MapPin, Users, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Slot {
  id: string
  number: string
  status: "available" | "occupied" | "maintenance"
  type: "standard" | "premium" | "disabled"
  currentBooking?: { driver: string; endTime: string }
}

export default function SpaceManagement() {
  const params = useParams()
  const [selectedTab, setSelectedTab] = useState<"overview" | "slots" | "managers">("overview")
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [managers, setManagers] = useState<any[]>([])
  const [editRate, setEditRate] = useState(false)
  const [rate, setRate] = useState("60")

  const spaceDetails = {
    name: "Downtown Plaza",
    address: "123 Main Street",
    capacity: 50,
    occupied: 35,
    rate: 60,
    managers: 2,
    type: "Standard",
  }

  const slots: Slot[] = Array.from({ length: 50 }, (_, i) => ({
    id: `S${i + 1}`,
    number: String(i + 1),
    status: i < 35 ? "occupied" : i < 48 ? "available" : "maintenance",
    type: i % 10 === 0 ? "disabled" : i % 5 === 0 ? "premium" : "standard",
    currentBooking:
      i < 35
        ? {
            driver: `Driver ${i + 1}`,
            endTime: `${14 + (i % 6)}:30`,
          }
        : undefined,
  }))

  const availableSlots = slots.filter((s) => s.status === "available").length
  const maintenanceSlots = slots.filter((s) => s.status === "maintenance").length

  async function doInvite() {
    if (!inviteEmail) return alert('Enter email')
    try {
      const owner = typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem('park_user') || 'null') : null
      const res = await fetch('/api/owners/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ space_id: params.id, name: inviteName, email: inviteEmail, phone: invitePhone, assigned_by: owner?.user_id }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Invite failed')
      setInviteUrl(j.invite_url)
      setShowInviteForm(false)
      loadManagers()
    } catch (err: any) {
      alert(err.message || 'Invite failed')
    }
  }

  async function loadManagers() {
    try {
      const res = await fetch(`/api/owners/managers?space_id=${params.id}`)
      const j = await res.json()
      setManagers(j.data ?? [])
    } catch (err) {
      console.warn(err)
    }
  }

  // load managers on tab open
  useEffect(() => { if (selectedTab === 'managers') loadManagers() }, [selectedTab])

  // subscribe to slot availability via SSE when on overview tab
  useEffect(() => {
    let es: EventSource | null = null
    if (selectedTab === 'overview') {
      try {
        es = new EventSource(`/api/slots/stream?space_id=${params.id}`)
        es.onmessage = (ev) => {
          try {
            const parsed = JSON.parse(ev.data)
            const avail = (parsed.slots || []).filter((s: any) => s.is_available).length
            // update small availability UI (local state)
            // we don't want to replace the whole slots grid mock, just update managers count placeholder
            // For demo: update managers count to show availability (temporary repurpose)
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const el = document.querySelector('[data-live-available]')
            if (el) el.textContent = String(avail)
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {
        // ignore
      }
    }
    return () => { if (es) es.close() }
  }, [selectedTab, params.id])

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/owner/dashboard">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">{spaceDetails.name}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {spaceDetails.address}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Occupancy</p>
            <p className="text-2xl font-bold text-foreground">
              {Math.round((spaceDetails.occupied / spaceDetails.capacity) * 100)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {spaceDetails.occupied}/{spaceDetails.capacity} slots
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Available</p>
            <p className="text-2xl font-bold text-green-600">{availableSlots}</p>
            <p className="text-xs text-muted-foreground mt-1">Ready to book</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Rate</p>
            {editRate ? (
              <div className="flex gap-2 mt-1">
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="flex-1 px-2 py-1 border border-border rounded text-sm bg-background text-foreground"
                />
                <button
                  onClick={() => setEditRate(false)}
                  className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-secondary">₹{rate}</p>
                <button onClick={() => setEditRate(true)} className="text-xs text-primary hover:underline">
                  Edit
                </button>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Managers</p>
            <p className="text-2xl font-bold text-foreground">{spaceDetails.managers}</p>
            <Button size="sm" variant="outline" className="w-full mt-2 text-xs bg-transparent">
              Manage
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-border">
          {(["overview", "slots", "managers"] as const).map((tab) => (
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
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-900 text-sm">Quick Actions</p>
                <p className="text-xs text-blue-800 mt-1">
                  Manage slot availability, add managers, and view real-time bookings
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-bold text-foreground mb-4">Slot Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      Available
                    </span>
                    <span className="font-bold text-foreground">{availableSlots}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      Occupied
                    </span>
                    <span className="font-bold text-foreground">{spaceDetails.occupied}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      Maintenance
                    </span>
                    <span className="font-bold text-foreground">{maintenanceSlots}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-bold text-foreground mb-4">Revenue Today</h3>
                <p className="text-3xl font-bold text-secondary mb-2">₹{spaceDetails.occupied * spaceDetails.rate}</p>
                <p className="text-xs text-muted-foreground">Based on current occupancy</p>
              </div>
            </div>
          </div>
        )}

        {/* Slots Tab */}
        {selectedTab === "slots" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-bold text-foreground mb-4">Parking Slot Status</h3>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    className={`w-full aspect-square rounded-lg font-bold text-xs transition-colors ${
                      slot.status === "occupied"
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : slot.status === "maintenance"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                    title={`${slot.number} - ${slot.type} - ${slot.status}`}
                  >
                    {slot.number}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-green-100 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-red-100 rounded"></div>
                  <span>Occupied</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-yellow-100 rounded"></div>
                  <span>Maintenance</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Managers Tab */}
        {selectedTab === "managers" && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">Current Managers</h3>
                <Button size="sm" className="gap-2" onClick={() => setShowInviteForm(s => !s)}>
                  <Users className="w-4 h-4" />
                  Add Manager
                </Button>
              </div>

              {showInviteForm && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-1 gap-2">
                    <input placeholder="Name" value={inviteName} onChange={(e) => setInviteName(e.target.value)} className="p-2 border rounded" />
                    <input placeholder="Email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="p-2 border rounded" />
                    <input placeholder="Phone" value={invitePhone} onChange={(e) => setInvitePhone(e.target.value)} className="p-2 border rounded" />
                    <div className="flex gap-2">
                      <Button onClick={() => doInvite()} className="flex-1">Send Invite</Button>
                      <Button variant="outline" onClick={() => setShowInviteForm(false)} className="flex-1">Cancel</Button>
                    </div>
                    {inviteUrl && (
                      <div className="text-sm text-muted-foreground">Invite Link: <a href={inviteUrl} className="text-primary underline">{inviteUrl}</a></div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-2">
                <Button size="sm" variant="ghost" onClick={() => loadManagers()}>Refresh</Button>
              </div>

              <div className="space-y-2">
                {managers.map((m: any, i: number) => (
                  <div key={i} className="p-4 bg-muted rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{m.users?.full_name ?? 'Invitee'}</p>
                      <p className="text-xs text-muted-foreground">{m.users?.email ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">Status: {m.invite_status}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${m.invite_status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{m.invite_status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
