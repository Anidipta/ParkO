"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const MapClient = dynamic(() => import('@/components/map-client').then(m => m.default), { ssr: false })

type ParkingSpace = {
  space_id: string
  space_name: string
  address: string
  latitude: number
  longitude: number
  total_slots: number
}

export default function DriverMap() {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [spaces, setSpaces] = useState<ParkingSpace[]>([])
  const watchId = useRef<number | null>(null)

  useEffect(() => {
    // fetch parking spaces
    fetch('/api/parking')
      .then(r => r.json())
      .then(j => setSpaces(j?.data ?? []))
      .catch(() => setSpaces([]))
  }, [])

  const handleNearby = async () => {
    if (!userPos) return alert('Allow location access first')
    try {
      const res = await fetch(`/api/search?lat=${userPos.lat}&lng=${userPos.lng}&radius=200`)
      const j = await res.json()
      const results = j.data ?? []
      // map to ParkingSpace shape
      setSpaces(results.map((r: any) => ({ space_id: r.space.space_id, space_name: r.space.space_name, address: r.space.address, latitude: r.space.latitude, longitude: r.space.longitude, total_slots: r.space.total_slots })))
    } catch (err) {
      console.warn(err)
    }
  }

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    const s = (pos: GeolocationPosition) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    const e = (err: GeolocationPositionError) => console.warn('geo error', err)
    const id = navigator.geolocation.watchPosition(s, e, { enableHighAccuracy: true })
    watchId.current = id as unknown as number
    return () => { if (watchId.current) navigator.geolocation.clearWatch(watchId.current) }
  }, [])

  const filtered = spaces.filter(s => s.space_name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/driver/dashboard" className="text-lg font-bold text-foreground">Parko - Find Parking</Link>
          <Link href="/driver/dashboard"><Button variant="outline" size="sm">Back</Button></Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="relative bg-gradient-to-br from-blue-50 to-white border border-border rounded-lg overflow-hidden" style={{ height: 500 }}>
              <div className="w-full h-full">
                {typeof window !== 'undefined' && <MapClient userPos={userPos} spaces={filtered} />}
              </div>
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"/> <span>Your Location</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"/> <span>Available</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-400"/> <span>Limited</span></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <Input placeholder="Search parking..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleNearby} className="flex-1">Find within 200m</Button>
              <Button size="sm" variant="outline" onClick={() => { setSearchTerm(''); fetch('/api/parking').then(r=>r.json()).then(j=>setSpaces(j?.data ?? [])) }}>Reset</Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground"><p>No parking spaces found</p></div>
              ) : (
                filtered.map((s) => (
                  <div key={s.space_id} onClick={() => setSelectedId(s.space_id)} className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedId === s.space_id ? 'bg-primary/10 border-primary' : 'bg-card border-border hover:border-primary'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-foreground text-sm">{s.space_name}</h4>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{Math.round(Math.random()*200)}m</span>
                    </div>
                    <div className="flex items-center justify-between mb-3"><span className="text-sm text-muted-foreground">Slots: {s.total_slots}</span></div>
                    <Link href={`/driver/booking/${s.space_id}`}><Button size="sm" className="w-full">Book Now</Button></Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
