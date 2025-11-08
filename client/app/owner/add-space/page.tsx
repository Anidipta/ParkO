"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import dynamic from 'next/dynamic'

const LocationPicker = dynamic(() => import('@/components/location-picker'), { ssr: false })

export default function AddParkingSpace() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    spaceName: "",
    capacity: "50",
    type: "standard",
    ratePerHour: "60",
    location: "Current Location",
    address: "",
    lat: "",
    lng: "",
  })

  // Special slots state
  const [specialSlotTypes, setSpecialSlotTypes] = useState<string[]>([])
  const [slotCounts, setSlotCounts] = useState<Record<string, number>>({
    near_gate: 0,
    disabled: 0,
    women_only: 0,
    ev_charging: 0,
    premium: 0,
    compact: 0,
  })

  const availableSpecialTypes = [
    { value: 'disabled', label: 'Disabled/Accessible' },
    { value: 'women_only', label: 'Women Only' },
    { value: 'ev_charging', label: 'EV Charging' },
    { value: 'premium', label: 'Premium/VIP' },
    { value: 'compact', label: 'Compact Cars' },
  ]

  const totalCapacity = Number(formData.capacity || 0)
  const specialSlotsTotal = Object.values(slotCounts).reduce((sum, count) => sum + count, 0)
  const normalSlotsCount = Math.max(0, totalCapacity - specialSlotsTotal)

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserPos(null),
      { enableHighAccuracy: true }
    )
  }, [])

  const [searchTerm, setSearchTerm] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([])

  const searchAddress = async () => {
    if (!searchTerm.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}`, { headers: { 'Accept': 'application/json' } })
      const j = await res.json()
      setSearchResults(j.slice(0, 5))
    } catch (e) {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  // Reverse geocode when clicking on map
  const handleMapClick = async (lat: number, lng: number) => {
    setFormData(prev => ({ ...prev, lat: String(lat), lng: String(lng) }))
    
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, { headers: { 'Accept': 'application/json' } })
      const j = await res.json()
      if (j.display_name) {
        setFormData(prev => ({ ...prev, address: j.display_name }))
      }
    } catch (e) {
      console.warn('Reverse geocoding failed:', e)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleSpecialTypeToggle = (type: string) => {
    if (specialSlotTypes.includes(type)) {
      setSpecialSlotTypes(prev => prev.filter(t => t !== type))
      setSlotCounts(prev => ({ ...prev, [type]: 0 }))
    } else {
      setSpecialSlotTypes(prev => [...prev, type])
    }
  }

  const handleSlotCountChange = (type: string, count: number) => {
    const newCount = Math.max(0, Math.min(count, totalCapacity))
    setSlotCounts(prev => ({ ...prev, [type]: newCount }))
  }

  const handleCreate = async () => {
    try {
      // Validation
      if (specialSlotsTotal > totalCapacity) {
        alert('Special slots allocation exceeds total capacity. Please adjust the numbers.')
        return
      }

      const sess = await fetch('/api/auth/session').then(r => r.json()).catch(() => null)
      const owner_id = sess?.user?.userId
      if (!owner_id) {
        alert('Please login as owner to create a space')
        return
      }
      
      const payload = {
        owner_id,
        space_name: formData.spaceName.trim() || 'My Parking Space',
        address: formData.address,
        latitude: formData.lat ? Number(formData.lat) : (userPos?.lat ?? null),
        longitude: formData.lng ? Number(formData.lng) : (userPos?.lng ?? null),
        total_slots: totalCapacity,
        hourly_rate: Number(formData.ratePerHour || 0),
      }
      
      const res = await fetch('/api/parking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `Failed (${res.status})`)
      }
      
      const created = await res.json()
      const spaceId = created.data?.[0]?.space_id || created.data?.space_id
      
      if (!spaceId) {
        throw new Error('Space created but ID not returned')
      }

      // Create slots for each type
      const slotPromises: Promise<any>[] = []
      
      // Normal slots
      for (let i = 1; i <= normalSlotsCount; i++) {
        slotPromises.push(
          fetch('/api/slots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              space_id: spaceId,
              slot_number: `N${i}`,
              slot_type: 'standard',
              hourly_rate: Number(formData.ratePerHour || 0),
            })
          })
        )
      }
      
      // Near gate slots
      for (let i = 1; i <= slotCounts.near_gate; i++) {
        slotPromises.push(
          fetch('/api/slots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              space_id: spaceId,
              slot_number: `G${i}`,
              slot_type: 'near_gate',
              hourly_rate: Number(formData.ratePerHour || 0),
            })
          })
        )
      }
      
      // Special slot types
      for (const type of specialSlotTypes) {
        const count = slotCounts[type]
        for (let i = 1; i <= count; i++) {
          const prefix = type.charAt(0).toUpperCase()
          slotPromises.push(
            fetch('/api/slots', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                space_id: spaceId,
                slot_number: `${prefix}${i}`,
                slot_type: type,
                hourly_rate: Number(formData.ratePerHour || 0),
              })
            })
          )
        }
      }
      
      // Wait for all slots to be created
      await Promise.all(slotPromises)
      
      window.location.href = '/owner/dashboard'
    } catch (err: any) {
      alert(err.message || 'Failed to create')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-secondary via-background to-primary/20">
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link
            href="/owner/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="bg-card border border-border rounded-xl p-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Add Parking Space</h1>
          <p className="text-muted-foreground mb-8">Step {step} of 3</p>

          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-secondary" : "bg-border"}`}
              />
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Parking Space Name</label>
                <Input
                  name="spaceName"
                  value={formData.spaceName}
                  onChange={handleChange}
                  placeholder="e.g., Downtown Plaza Level 2"
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Total Capacity</label>
                <Input
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="50"
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Parking Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="standard">Standard</option>
                  <option value="compact">Compact</option>
                  <option value="premium">Premium</option>
                  <option value="covered">Covered</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Pricing & Slots */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Rate per Hour (₹)</label>
                <Input
                  name="ratePerHour"
                  type="number"
                  value={formData.ratePerHour}
                  onChange={handleChange}
                  placeholder="60"
                  className="w-full"
                />
              </div>

              {/* Special Slots Configuration */}
              <div className="border border-border rounded-lg p-4 bg-muted/30">
                <label className="text-sm font-semibold text-foreground mb-3 block">Special Slots (Optional)</label>
                
                {/* Multi-select special slot types */}
                <div className="space-y-2 mb-4">
                  {availableSpecialTypes.map(type => (
                    <label key={type.value} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-muted/50 rounded">
                      <input
                        type="checkbox"
                        checked={specialSlotTypes.includes(type.value)}
                        onChange={() => handleSpecialTypeToggle(type.value)}
                        className="w-4 h-4 rounded border-border"
                      />
                      <span className="text-sm text-foreground">{type.label}</span>
                    </label>
                  ))}
                </div>

                {/* Slot count inputs in 3 columns */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                  {/* Normal slots (non-editable, calculated) */}
                  <div className="bg-card border border-border rounded-lg p-3">
                    <label className="text-xs text-muted-foreground block mb-1">Normal Slots</label>
                    <input
                      type="number"
                      value={normalSlotsCount}
                      readOnly
                      className="w-full px-2 py-1 text-sm font-semibold bg-muted border border-border rounded text-center cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-center">Auto-calculated</p>
                  </div>

                  {/* Near Gate slots */}
                  <div className="bg-card border border-border rounded-lg p-3">
                    <label className="text-xs text-muted-foreground block mb-1">Near Gate</label>
                    <input
                      type="number"
                      value={slotCounts.near_gate}
                      onChange={(e) => handleSlotCountChange('near_gate', Number(e.target.value))}
                      min="0"
                      max={totalCapacity}
                      className="w-full px-2 py-1 text-sm font-semibold border border-border rounded text-center"
                    />
                  </div>

                  {/* Selected special slot types */}
                  {specialSlotTypes.map(type => (
                    <div key={type} className="bg-card border border-primary/30 rounded-lg p-3">
                      <label className="text-xs text-muted-foreground block mb-1">
                        {availableSpecialTypes.find(t => t.value === type)?.label}
                      </label>
                      <input
                        type="number"
                        value={slotCounts[type]}
                        onChange={(e) => handleSlotCountChange(type, Number(e.target.value))}
                        min="0"
                        max={totalCapacity}
                        className="w-full px-2 py-1 text-sm font-semibold border border-border rounded text-center"
                      />
                    </div>
                  ))}
                </div>

                {/* Slot allocation summary */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Slot Allocation Summary</p>
                  <div className="text-xs text-blue-800 space-y-1">
                    <div className="flex justify-between">
                      <span>Total Capacity:</span>
                      <span className="font-semibold">{totalCapacity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Special Slots:</span>
                      <span className="font-semibold">{specialSlotsTotal}</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-300 pt-1">
                      <span>Normal Slots:</span>
                      <span className="font-semibold">{normalSlotsCount}</span>
                    </div>
                  </div>
                  {specialSlotsTotal > totalCapacity && (
                    <p className="text-xs text-red-600 mt-2 font-semibold">⚠️ Special slots exceed total capacity!</p>
                  )}
                </div>
              </div>

              <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
                <p className="text-sm text-foreground font-semibold mb-2">Estimated Monthly Revenue</p>
                <p className="text-2xl font-bold text-secondary">
                  ₹
                  {(
                    Number.parseInt(formData.capacity) *
                    Number.parseInt(formData.ratePerHour) *
                    24 *
                    30
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Based on 100% occupancy</p>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-900 text-sm">Pinpoint Your Parking Location</p>
                    <p className="text-xs text-blue-800 mt-1">
                      <strong>Click anywhere on the map</strong> to set location, search an address, or drag the marker. 
                      Your current GPS is shown in red.
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Input placeholder="Search address..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  <Button type="button" onClick={searchAddress} disabled={searching}>Search</Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white border border-border rounded max-h-48 overflow-y-auto">
                    {searchResults.map((r, idx) => (
                      <button key={idx} className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-b-0"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, address: r.display_name, lat: String(r.lat), lng: String(r.lon) }))
                          setSearchResults([])
                        }}>
                        {r.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Full Address</label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main Street, Downtown District"
                  className="w-full"
                />
              </div>
              <div className="rounded-lg overflow-hidden border border-border">
                {typeof window !== 'undefined' && (
                  <LocationPicker
                    value={formData.lat && formData.lng ? { lat: Number(formData.lat), lng: Number(formData.lng) } : null}
                    onChange={(ll) => handleMapClick(ll.lat, ll.lng)}
                    userPos={userPos}
                    height={360}
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Latitude</label>
                  <Input value={formData.lat} onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))} placeholder="Lat" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Longitude</label>
                  <Input value={formData.lng} onChange={(e) => setFormData(prev => ({ ...prev, lng: e.target.value }))} placeholder="Lng" />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                Previous
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={handleNext} className="flex-1">
                Next
              </Button>
            ) : (
              <Button onClick={handleCreate} className="flex-1">Create Parking Space</Button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
