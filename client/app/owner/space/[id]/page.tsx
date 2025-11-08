"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { ArrowLeft, MapPin, Users, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from '@/hooks/use-toast'

const MapClient = dynamic(() => import('@/components/map-client').then(m => m.default), { ssr: false })

interface Slot {
  id: string
  number: string
  status: "available" | "occupied" | "maintenance"
  type: "standard" | "premium" | "disabled"
  hourly_rate?: number
  slot_count?: number // Total slots of this type (for grouped slots)
  available_count?: number // Available slots of this type (for grouped slots)
  currentBooking?: { driver: string; endTime: string }
}

export default function SpaceManagement() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [selectedTab, setSelectedTab] = useState<"overview" | "slots" | "managers">("overview")
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [managers, setManagers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [editRate, setEditRate] = useState(false)
  const [rate, setRate] = useState("60")
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)
  const [editingSlotRate, setEditingSlotRate] = useState("")

  const [spaceDetails, setSpaceDetails] = useState<any | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [availableSlots, setAvailableSlots] = useState<number>(0)
  const [maintenanceSlots, setMaintenanceSlots] = useState<number>(0)
  const [showMap, setShowMap] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [slotBookings, setSlotBookings] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window === 'undefined') return
    try { setCurrentUser(JSON.parse(window.localStorage.getItem('park_user') || 'null')) } catch (e) { setCurrentUser(null) }
    // if url contains ?map=1 open map modal
    try {
      if (searchParams?.get('map') === '1') setShowMap(true)
    } catch (e) {}
  }, [])

  // Load real space and slots from API
  useEffect(() => {
    const id = params.id
    if (!id) return

    // fetch parking space details (search and pick the matching id)
    fetch(`/api/parking`)
      .then((res) => res.json())
      .then((json) => {
        const found = Array.isArray(json.data) ? json.data.find((s: any) => s.space_id === id) : null
        if (found) setSpaceDetails(found)
      })
      .catch(() => {
        // ignore
      })

    // fetch slots for this space
    fetch(`/api/slots?space_id=${id}`)
      .then((res) => res.json())
      .then((json) => {
        const raw = Array.isArray(json.data) ? json.data : []
        // Map slot groups to display format
        const mapped: Slot[] = raw.map((slot: any) => ({
          id: slot.slot_id ?? slot.id,
          number: slot.slot_type ?? String(slot.slot_id ?? ''), // Use slot_type as identifier for groups
          status: 'available', // Not used for grouped slots
          type: slot.slot_type ?? 'standard',
          hourly_rate: slot.hourly_rate ?? 0,
          slot_count: slot.slot_count ?? 0, // Total slots of this type
          available_count: slot.available_count ?? 0, // Available slots of this type
          currentBooking: undefined,
        }))
        setSlots(mapped)
      })
      .catch(() => {})
  }, [params.id])

  // derive counts when slots or space details update
  useEffect(() => {
    // For grouped slots, sum up the counts from all slot groups
    const totalAvailable = slots.reduce((sum, slot) => sum + (slot.available_count ?? 0), 0)
    const totalSlotCount = slots.reduce((sum, slot) => sum + (slot.slot_count ?? 0), 0)
    const totalOccupied = totalSlotCount - totalAvailable
    
    setAvailableSlots(totalAvailable)
    setMaintenanceSlots(0) // Maintenance not tracked in grouped slots
  }, [slots, spaceDetails])

  // when space details load, initialize rate state from DB
  useEffect(() => {
    if (spaceDetails && spaceDetails.hourly_rate != null) {
      setRate(String(spaceDetails.hourly_rate))
    }
  }, [spaceDetails])

  // Calculate occupied and capacity from grouped slots
  const totalSlotCount = slots.reduce((sum, slot) => sum + (slot.slot_count ?? 0), 0)
  const totalAvailable = slots.reduce((sum, slot) => sum + (slot.available_count ?? 0), 0)
  const occupied = totalSlotCount - totalAvailable
  const capacity = spaceDetails?.total_slots ?? totalSlotCount
  // prefer explicit space hourly_rate when available
  const displayRate = Number(spaceDetails?.hourly_rate ?? spaceDetails?.cheapest_rate ?? Number(rate) ?? 0)

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
      // show toast with invite URL
      try { toast({ title: 'Invite link', description: j.invite_url }) } catch (e) {}
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

  async function transferManager(userId: string) {
    try {
      const res = await fetch('/api/owners/transfer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ space_id: params.id, new_manager_user_id: userId }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Transfer failed')
      toast({ title: 'Manager transferred', description: 'New manager assigned' })
      loadManagers()
    } catch (err: any) {
      alert(err.message || 'Transfer failed')
    }
  }

  async function updateSlotRate(slotId: string, newRate: number) {
    try {
      const res = await fetch('/api/slots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slotId, hourly_rate: newRate })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Failed to update rate')
      
      // Update local state
      setSlots(prevSlots => prevSlots.map(slot => 
        slot.id === slotId ? { ...slot, hourly_rate: newRate } : slot
      ))
      setEditingSlotId(null)
      setEditingSlotRate("")
      
      toast({ title: 'Rate updated', description: `Slot ${slots.find(s => s.id === slotId)?.number} rate: ₹${newRate}/hr` })
    } catch (err: any) {
      alert(err.message || 'Failed to update rate')
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
            const raw = (parsed.slots || [])
            const mapped: Slot[] = raw.map((slot: any) => ({
              id: slot.slot_id ?? slot.slot_number,
              number: slot.slot_number ?? String(slot.slot_id ?? ''),
              status: slot.is_available === true ? 'available' : slot.is_available === false ? 'occupied' : 'maintenance',
              type: slot.slot_type ?? 'standard',
              hourly_rate: slot.hourly_rate ?? 0,
              currentBooking: undefined,
            }))
            const occ = mapped.filter((s) => s.status === 'occupied').length
            const maint = mapped.filter((s) => s.status === 'maintenance').length
            const cap = mapped.length
            const avail = Math.max(0, cap - occ - maint)
            // update availability state from SSE
            setAvailableSlots(avail)
            // also update local slots array if useful
            setSlots(mapped)
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

  // when a slot is selected, fetch bookings for this space and filter for that slot
  useEffect(() => {
    let mounted = true
    if (!selectedSlot) {
      setSlotBookings([])
      return
    }

    ;(async () => {
      try {
        const res = await fetch(`/api/bookings?space_id=${encodeURIComponent(params.id as string)}`)
        const j = await res.json().catch(() => ({ data: [] }))
        const raw = Array.isArray(j.data) ? j.data : []
        const filtered = raw.filter((b: any) => String(b.slot_id ?? b.slot)?.toString() === String(selectedSlot.id))
        if (!mounted) return
        setSlotBookings(filtered)
      } catch (err) {
        if (mounted) setSlotBookings([])
      }
    })()

    return () => { mounted = false }
  }, [selectedSlot, params.id])

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
            <h1 className="text-xl font-bold text-foreground">{spaceDetails?.space_name ?? 'Parking Space'}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {spaceDetails?.address ?? '—'}
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
              {capacity > 0 ? Math.round((occupied / capacity) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {occupied}/{capacity} slots
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
                  onClick={async () => {
                    // persist rate to DB and update all slot rates
                    try {
                      const newBaseRate = Number(rate)
                      
                      // Update the parking space base rate
                      const res = await fetch('/api/parking', { 
                        method: 'PATCH', 
                        headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify({ 
                          space_id: params.id, 
                          hourly_rate: newBaseRate 
                        }) 
                      })
                      const j = await res.json().catch(() => ({}))
                      if (!res.ok) throw new Error(j.error || 'Failed to update rate')
                      
                      // Calculate and update slot rates based on their types
                      const slotTypeMarkups: Record<string, number> = {
                        'standard': 1.0,
                        'near_gate': 1.02,
                        'women_only': 1.05,
                        'disabled': 1.05,
                        'ev_charging': 1.08,
                        'premium': 1.08,
                        'compact': 1.0,
                      }
                      
                      // Fetch current slots and update their rates
                      const slotsRes = await fetch(`/api/slots?space_id=${params.id}`)
                      const slotsJson = await slotsRes.json().catch(() => ({}))
                      if (slotsRes.ok && Array.isArray(slotsJson.data)) {
                        // Update each slot group's rate
                        const updatePromises = slotsJson.data.map((slot: any) => {
                          const slotType = slot.slot_type || 'standard'
                          const markup = slotTypeMarkups[slotType] || 1.0
                          const newSlotRate = Number((newBaseRate * markup).toFixed(2))
                          
                          return fetch('/api/slots', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              slot_id: slot.slot_id,
                              hourly_rate: newSlotRate
                            })
                          })
                        })
                        
                        await Promise.all(updatePromises)
                      }
                      
                      // update local state
                      setSpaceDetails((s: any) => ({ ...(s || {}), hourly_rate: newBaseRate }))
                      setEditRate(false)
                      
                      // Refresh slots to show updated rates
                      const refreshRes = await fetch(`/api/slots?space_id=${params.id}`)
                      const refreshJson = await refreshRes.json().catch(() => ({}))
                      if (refreshRes.ok && Array.isArray(refreshJson.data)) {
                        const mapped: Slot[] = refreshJson.data.map((slot: any) => ({
                          id: slot.slot_id ?? slot.id,
                          number: slot.slot_type ?? String(slot.slot_id ?? ''), // Use slot_type as identifier for groups
                          status: 'available', // Not used for grouped slots
                          type: slot.slot_type ?? 'standard',
                          hourly_rate: slot.hourly_rate ?? 0,
                          slot_count: slot.slot_count ?? 0, // Total slots of this type
                          available_count: slot.available_count ?? 0, // Available slots of this type
                          currentBooking: undefined,
                        }))
                        setSlots(mapped)
                      }
                      
                      try { 
                        toast({ 
                          title: 'Rates updated', 
                          description: `Base rate: ₹${rate}/hr. All slot rates updated automatically.` 
                        }) 
                      } catch (e) {}
                    } catch (err: any) {
                      alert(err.message || 'Failed to update rate')
                    }
                  }}
                  className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-secondary">₹{spaceDetails?.hourly_rate ?? rate}</p>
                <button onClick={() => setEditRate(true)} className="text-xs text-primary hover:underline">
                  Edit
                </button>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Managers</p>
            <p className="text-2xl font-bold text-foreground">{spaceDetails?.managers ?? managers.length ?? 0}</p>
            <Button size="sm" variant="outline" className="w-full mt-2 text-xs bg-transparent" onClick={() => setSelectedTab('managers')}>
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
                    <span className="flex items-center gap-2 text-sm">Available</span>
                    <span className="font-bold text-foreground">{availableSlots}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">Occupied</span>
                    <span className="font-bold text-foreground">{occupied}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">Maintenance</span>
                    <span className="font-bold text-foreground">{maintenanceSlots}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="font-bold text-foreground mb-4">Revenue Today</h3>
                <p className="text-3xl font-bold text-secondary mb-2">₹{occupied * displayRate}</p>
                <p className="text-xs text-muted-foreground">Based on current occupancy</p>
              </div>
            </div>
          </div>
        )}

        {/* Slots Tab */}
        {selectedTab === "slots" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-foreground text-lg">Slot Overview by Type</h3>
                <p className="text-sm text-muted-foreground">
                  Total: {slots.reduce((sum, slot) => sum + (slot.slot_count ?? 0), 0)} slots in {slots.length} types
                </p>
              </div>
              
              {/* Summary Table by Slot Type */}
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-border bg-muted/50">
                      <th className="text-left py-3 px-4 font-semibold">Slot Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Rate (₹/hr)</th>
                      <th className="text-left py-3 px-4 font-semibold">Available</th>
                      <th className="text-left py-3 px-4 font-semibold">Booked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // For grouped slots, we already have the data we need
                      // Each slot in the array represents a slot group with slot_count and available_count
                      const typeNames: Record<string, string> = {
                        'standard': 'Standard',
                        'near_gate': 'Near Gate',
                        'women_only': 'Women Only',
                        'disabled': 'Disabled/Accessible',
                        'ev_charging': 'EV Charging',
                        'premium': 'Premium/VIP',
                        'compact': 'Compact',
                      }

                      return slots.map((slotGroup: any) => {
                        const type = slotGroup.type || 'standard'
                        const totalCount = slotGroup.slot_count ?? 0
                        const availableCount = slotGroup.available_count ?? 0
                        const bookedCount = totalCount - availableCount

                        return (
                          <tr key={type} className="border-b border-border hover:bg-muted/30 transition-colors">
                            <td className="py-4 px-4">
                              <span className="font-medium text-foreground">
                                {typeNames[type] || type}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({totalCount} total)
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-bold text-primary">₹{slotGroup.hourly_rate ?? 0}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                                {availableCount}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold">
                                {bookedCount}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Map Modal */}
        {showMap && (
          <div className="fixed inset-0 z-50 flex items-stretch">
            <div className="flex-1 p-10">
              <div className="h-full bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="flex items-center justify-between p-3 border-b">
                  <h3 className="font-bold">Map - {spaceDetails?.space_name ?? 'Parking'}</h3>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowMap(false)}>Close</Button>
                  </div>
                </div>
                <div className="h-[600px]">
                  {typeof window !== 'undefined' && (
                    <MapClient userPos={null} spaces={[{ space_id: spaceDetails?.space_id ?? params.id, space_name: spaceDetails?.space_name ?? '', address: spaceDetails?.address ?? '', latitude: Number(spaceDetails?.latitude ?? 0), longitude: Number(spaceDetails?.longitude ?? 0), total_slots: Number(spaceDetails?.total_slots ?? slots.length) }]} availability={{ [spaceDetails?.space_id ?? params.id as string]: { available: availableSlots, total: Number(spaceDetails?.total_slots ?? slots.length) } }} />
                  )}
                </div>
              </div>
            </div>

            <div className="w-96 bg-card border-l border-border p-4 overflow-y-auto">
              <h4 className="font-semibold mb-2">Slot Details</h4>
              {selectedSlot ? (
                <div>
                  <p className="text-sm font-semibold">Slot {selectedSlot.number}</p>
                  <p className="text-xs text-muted-foreground">Type: {selectedSlot.type}</p>
                  <p className="text-xs text-muted-foreground">Status: {selectedSlot.status}</p>
                  <p className="mt-3 text-sm font-semibold">Manager</p>
                  <p className="text-xs">{(managers[0]?.users?.full_name) ?? 'Manager'}</p>
                  <div className="mt-3">
                    <p className="text-sm font-semibold">Sales</p>
                    <p className="text-xs">₹{slotBookings.reduce((s, b) => s + Number(b.amount ?? b.total_amount ?? 0), 0)}</p>
                    <p className="text-xs text-muted-foreground">Bookings: {slotBookings.length}</p>
                  </div>
                  <div className="mt-4">
                    <Button size="sm" onClick={() => { /* placeholder for view more analytics */ }} className="w-full">View analytics</Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Select a slot to see details</div>
              )}
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
                      <p className="font-semibold text-foreground text-sm">{m.users?.full_name ?? 'Invitee'} {m.users?.user_id === currentUser?.user_id ? <span className="text-xs text-primary">(You)</span> : null}</p>
                      <p className="text-xs text-muted-foreground">{m.users?.email ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">Status: {m.invite_status}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${m.invite_status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{m.invite_status}</span>
                      {/* Transfer manager action */}
                      <Button size="sm" variant="ghost" onClick={() => transferManager(m.users?.user_id)} disabled={m.users?.user_id === currentUser?.user_id}>Make Manager</Button>
                    </div>
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
