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
    specialSlots: "",
    location: "Current Location",
    address: "",
    lat: "",
    lng: "",
  })

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleCreate = async () => {
    try {
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
        total_slots: Number(formData.capacity || 0),
        hourly_rate: Number(formData.ratePerHour || 0),
      }
      const res = await fetch('/api/parking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || `Failed (${res.status})`)
      }
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

          {/* Step 2: Pricing */}
          {step === 2 && (
            <div className="space-y-4">
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
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Special Slots (Optional)</label>
                <Input
                  name="specialSlots"
                  value={formData.specialSlots}
                  onChange={handleChange}
                  placeholder="e.g., Disabled, Women-only, Electric vehicle charging"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated</p>
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
                    <p className="text-xs text-blue-800 mt-1">Search an address or drag the marker on the map. Your current GPS is shown in red.</p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Input placeholder="Search address..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  <Button type="button" onClick={searchAddress} disabled={searching}>Search</Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white border border-border rounded">
                    {searchResults.map((r, idx) => (
                      <button key={idx} className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
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
                    onChange={(ll) => setFormData(prev => ({ ...prev, lat: String(ll.lat), lng: String(ll.lng) }))}
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
