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
  const [spaces, setSpaces] = useState<Space[]>([])
  const [ownerId, setOwnerId] = useState<string>('')
  const [form, setForm] = useState({ space_name: '', address: '', latitude: '', longitude: '', total_slots: '10' })

  useEffect(() => {
    // If ownerId is set (e.g., from auth), fetch only their spaces; otherwise fetch all active
    const q = ownerId ? `/api/parking?owner_id=${ownerId}` : `/api/parking`
    fetch(q).then(r => r.json()).then(j => setSpaces(j?.data ?? [])).catch(() => setSpaces([]))
  }, [ownerId])

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
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="relative bg-gradient-to-br from-blue-50 to-white border border-border rounded-lg overflow-hidden" style={{ height: 500 }}>
              {typeof window !== 'undefined' && <MapClient userPos={null} spaces={spaces} />}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"/> <span>You</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"/> <span>Your Locations</span></div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-foreground">Manage Locations</h3>

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
                    <Link href={`/owner/space/${s.space_id}`}><Button size="sm" variant="outline" className="mt-2">Manage</Button></Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
