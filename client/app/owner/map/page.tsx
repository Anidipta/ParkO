"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

const MapClient = dynamic(() => import('@/components/map-client').then(m => m.default), { ssr: false })

type Space = {
  space_id: string
  space_name: string
  address: string
  latitude: number
  longitude: number
  total_slots: number
}

export default function OwnerMap() {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'requesting' | 'granted' | 'denied' | 'unavailable'>('requesting')
  const [spaces, setSpaces] = useState<Space[]>([])
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
  const [spaceBookings, setSpaceBookings] = useState<any[]>([])
  const [spaceAnalytics, setSpaceAnalytics] = useState<any[]>([])
  const [spaceAvailability, setSpaceAvailability] = useState<{ available: number; total: number } | null>(null)
  const [ownerId, setOwnerId] = useState<string>('')
  const [form, setForm] = useState({ space_name: '', address: '', latitude: '', longitude: '', total_slots: '10' })

  useEffect(() => {
    // If ownerId is set (e.g., from auth), fetch only their spaces; otherwise fetch all active
    const q = ownerId ? `/api/parking?owner_id=${ownerId}` : `/api/parking`
    fetch(q).then(r => r.json()).then(j => setSpaces(j?.data ?? [])).catch(() => setSpaces([]))
  }, [ownerId])

  // GPS Location tracking
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation not supported')
      setLocationStatus('unavailable')
      return
    }
    
    const onSuccess = (pos: GeolocationPosition) => {
      setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      setLocationStatus('granted')
      
      // Auto-fill form coordinates if they're empty
      if (!form.latitude && !form.longitude) {
        setForm(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        }))
      }
    }
    
    const onError = (err: GeolocationPositionError) => {
      console.warn('Geolocation error:', err.message)
      if (err.code === err.PERMISSION_DENIED) {
        setLocationStatus('denied')
      }
    }
    
    // Request initial position
    navigator.geolocation.getCurrentPosition(onSuccess, onError, { 
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0 
    })
    
    // Watch position for live updates
    const id = navigator.geolocation.watchPosition(onSuccess, onError, { 
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    })
    
    return () => { 
      if (id) {
        navigator.geolocation.clearWatch(id) 
      }
    }
  }, [])

  // when a space is selected, load its bookings, analytics and availability
  useEffect(() => {
    if (!selectedSpace) return
    let mounted = true
    ;(async () => {
      try {
        const [bRes, aRes, sRes] = await Promise.all([
          fetch(`/api/bookings?space_id=${encodeURIComponent(selectedSpace.space_id)}`).then(r => r.json()).catch(() => ({ data: [] })),
          fetch(`/api/analytics?space_id=${encodeURIComponent(selectedSpace.space_id)}`).then(r => r.json()).catch(() => ({ data: [] })),
          fetch(`/api/slots?space_id=${encodeURIComponent(selectedSpace.space_id)}`).then(r => r.json()).catch(() => ({ data: [] })),
        ])
        if (!mounted) return
        setSpaceBookings(Array.isArray(bRes.data) ? bRes.data : [])
        setSpaceAnalytics(Array.isArray(aRes.data) ? aRes.data : [])
        const slots = Array.isArray(sRes.data) ? sRes.data : []
        setSpaceAvailability({ available: slots.filter((s:any)=>s.is_available).length, total: slots.length })
      } catch (e) {
        if (mounted) {
          setSpaceBookings([])
          setSpaceAnalytics([])
          setSpaceAvailability(null)
        }
      }
    })()
    return () => { mounted = false }
  }, [selectedSpace])

  async function createSpace(e: React.FormEvent) {
    e.preventDefault()
    // For now we require ownerId to be provided; in a full app you'd take from auth session
    if (!ownerId) return alert('Set owner id first (simulate by entering owner id)')

    const body = {
      owner_id: ownerId,
      space_name: form.space_name,
      address: form.address,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      total_slots: Number(form.total_slots),
    }

    const res = await fetch('/api/parking', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json()
    if (res.ok) {
      setSpaces(prev => [...prev, ...json.data])
      setForm({ space_name: '', address: '', latitude: '', longitude: '', total_slots: '10' })
    } else alert(json.error || 'Failed')
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/owner/dashboard">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">My Parking Locations</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* GPS Status Banner */}
        {locationStatus !== 'granted' && (
          <div className={`mb-4 p-4 rounded-lg border ${
            locationStatus === 'denied' ? 'bg-red-50 border-red-200' :
            locationStatus === 'unavailable' ? 'bg-gray-50 border-gray-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <p className={`text-sm font-semibold ${
              locationStatus === 'denied' ? 'text-red-900' :
              locationStatus === 'unavailable' ? 'text-gray-900' :
              'text-blue-900'
            }`}>
              {locationStatus === 'denied' ? '⚠️ Location Access Denied' :
               locationStatus === 'unavailable' ? '⚠️ Location Not Available' :
               '📍 Requesting Location...'}
            </p>
            <p className={`text-xs mt-1 ${
              locationStatus === 'denied' ? 'text-red-800' :
              locationStatus === 'unavailable' ? 'text-gray-800' :
              'text-blue-800'
            }`}>
              {locationStatus === 'denied' ? 'Enable location to auto-fill coordinates and see your position on the map.' :
               locationStatus === 'unavailable' ? 'Your browser does not support geolocation.' :
               'Waiting for GPS signal...'}
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="relative bg-gradient-to-br from-blue-50 to-white border border-border rounded-lg overflow-hidden" style={{ height: 500 }}>
              {typeof window !== 'undefined' && <MapClient userPos={userPos} spaces={spaces} onSelect={(sp) => setSelectedSpace(sp)} />}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs space-y-2">
                <div className="font-semibold text-foreground mb-2">Map Legend</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"/> <span>Your Location</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"/> <span>Your Parking Spaces</span></div>
                <div className="border-t border-gray-200 my-2 pt-2">
                  <div className="font-semibold text-foreground mb-1">Distance Rings</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-400 opacity-50"/> <span>200m (Green)</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-400 opacity-50"/> <span>450m (Yellow)</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-400 opacity-50"/> <span>800m (Red)</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-foreground">Manage Locations</h3>
            {/* If a space is selected, show its details and analytics in the side panel */}
            {selectedSpace ? (
              <div className="space-y-4 bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{selectedSpace.space_name}</h4>
                    <div className="text-xs text-muted-foreground">{selectedSpace.address}</div>
                    <div className="text-xs mt-1">Slots: {selectedSpace.total_slots}</div>
                    <div className="text-xs mt-1">Available: {spaceAvailability ? `${spaceAvailability.available}/${spaceAvailability.total}` : '—'}</div>
                  </div>
                  <div>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedSpace(null)}>Close</Button>
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mt-2">Recent Bookings</h5>
                  <div className="space-y-2 max-h-36 overflow-auto mt-2">
                    {spaceBookings.length === 0 ? (
                      <div className="text-xs text-muted-foreground">No recent bookings</div>
                    ) : (
                      spaceBookings.slice(0, 10).map((b: any) => (
                        <div key={b.booking_id || b.id} className="p-2 bg-muted rounded">
                          <div className="text-sm font-semibold">{b.users?.full_name ?? b.driver_name ?? 'Driver'}</div>
                          <div className="text-xs text-muted-foreground">{b.start_time ? new Date(b.start_time).toLocaleString() : ''} • ₹{b.estimated_amount ?? b.amount ?? 0}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold mt-2">Analytics (summary)</h5>
                  {spaceAnalytics.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No analytics available</div>
                  ) : (
                    <div className="text-xs mt-2">
                      <div>Total bookings (last period): {spaceAnalytics.reduce((s,a)=>s+(a.total_bookings||0),0)}</div>
                      <div>Total revenue: ₹{spaceAnalytics.reduce((s,a)=>s+Number(a.total_revenue||0),0)}</div>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <Link href={`/owner/space/${selectedSpace.space_id}`}><Button className="w-full">Manage Space</Button></Link>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <label className="text-xs text-muted-foreground">Owner id (simulate auth)</label>
                  <input value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className="w-full p-2 border rounded" />
                </div>

                <form onSubmit={createSpace} className="space-y-3">
                  <input placeholder="Space name" value={form.space_name} onChange={(e) => setForm(f => ({ ...f, space_name: e.target.value }))} className="w-full p-2 border rounded" />
                  <input placeholder="Address" value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} className="w-full p-2 border rounded" />
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Latitude" value={form.latitude} onChange={(e) => setForm(f => ({ ...f, latitude: e.target.value }))} className="p-2 border rounded" />
                    <input placeholder="Longitude" value={form.longitude} onChange={(e) => setForm(f => ({ ...f, longitude: e.target.value }))} className="p-2 border rounded" />
                  </div>
                  <input placeholder="Total slots" value={form.total_slots} onChange={(e) => setForm(f => ({ ...f, total_slots: e.target.value }))} className="w-full p-2 border rounded" />
                  <Button type="submit" className="w-full">Add Location</Button>
                </form>

                <div className="mt-4">
                  <h4 className="font-medium">Your locations ({spaces.length})</h4>
                  <div className="space-y-2 max-h-64 overflow-auto mt-2">
                    {spaces.map(s => (
                      <div key={s.space_id} className="p-2 border rounded bg-background/60">
                        <div className="font-semibold">{s.space_name}</div>
                        <div className="text-xs text-muted-foreground">{s.address}</div>
                        <div className="text-xs">Slots: {s.total_slots}</div>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedSpace(s)}>View</Button>
                          <Link href={`/owner/space/${s.space_id}`}><Button size="sm" variant="outline">Manage</Button></Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
