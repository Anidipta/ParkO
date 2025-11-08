"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { Car, MapPin, Users, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

// leaflet imports (client-only) — react-leaflet is heavy so we dynamically import the Map components
// MapClient component (dynamically loaded below) will import Leaflet CSS client-side

type ParkingSpace = {
  space_id: string
  space_name: string
  address: string
  latitude: number
  longitude: number
  total_slots: number
}

export default function Home() {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null)
  const [coordsText, setCoordsText] = useState<string>('')
  const [spaces, setSpaces] = useState<ParkingSpace[]>([])
  const MapClient = dynamic(() => import('@/components/map-client').then(mod => mod.default), { ssr: false })
  const isClient = typeof window !== 'undefined'
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' })
        if (!mounted) return
        if (!res.ok) return
        const j = await res.json()
        const user = j?.user
        const role = user?.user_type ?? user?.userType ?? null
        if (mounted) setUserRole(role)
      } catch (e) {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [])

  const watchId = useRef<number | null>(null)

  // Request permission and start watch
  useEffect(() => {
    if (!('geolocation' in navigator)) return

    const success = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      setUserPos({ lat, lng })
      setCoordsText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    }

    const error = (err: GeolocationPositionError) => {
      console.warn('Geolocation error', err)
    }

    // Prompt for permission and watch position for live coordinates
    navigator.permissions?.query?.({ name: 'geolocation' as PermissionName }).then(() => {
      const id = navigator.geolocation.watchPosition(success, error, { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 })
      watchId.current = id as unknown as number
    }).catch(() => {
      // Fallback: try to get current position once
      navigator.geolocation.getCurrentPosition(success, error)
    })

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    }
  }, [])

  // Fetch parking spaces from server API
  useEffect(() => {
    fetch('/api/parking')
      .then(res => res.json())
      .then(json => {
        if (json?.data) {
          setSpaces(json.data as ParkingSpace[])
        }
      })
      .catch(err => console.error('Failed to load parking spaces', err))
  }, [])

  // Helper to compute distance (meters) between two lat/lng using Haversine
  function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const toRad = (v: number) => v * Math.PI / 180
    const R = 6371000 // metres
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  return (
    <section className="relative mx-auto max-w-6xl px-4 py-8">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -top-10 -left-8 opacity-90 hidden md:block">
        <div className="blob blob-1" />
      </div>
      <div className="pointer-events-none absolute -bottom-10 -right-8 opacity-90 hidden md:block">
        <div className="blob blob-2" />
      </div>

      <div className="hero-card card-border mx-auto md:mx-0 flex flex-col md:flex-row items-center gap-8 mb-16">
        <div className="flex-1 text-center md:text-left fade-up">
          <h2 className="text-5xl font-bold text-foreground mb-4 text-balance">
            Smart Parking, <span className="text-[var(--sidebar-primary)]">Simplified</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto md:mx-0 mb-8">
            Find, book, and manage parking spaces in real-time. For drivers seeking convenience and parking owners
            maximizing revenue.
          </p>
          <div className="flex items-center justify-center md:justify-start gap-4">
            <Link href={userRole === 'driver' ? '/driver/dashboard' : '/driver/signup'}>
              <Button size="lg" className="btn-elevated">For Drivers</Button>
            </Link>
            <Link href={userRole === 'owner' || userRole === 'manager' ? '/owner/dashboard' : '/owner/signup'}>
              <Button variant="ghost" size="lg" className="text-foreground/90">For Owners</Button>
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center md:justify-end">
          <div className="w-72 h-44 md:w-[520px] md:h-[280px] relative float-anim">
            <Image src="/car.gif" alt="car" fill style={{ objectFit: 'contain' }} priority />
          </div>
        </div>
      </div>

        {/* User Type Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link href="/driver/signup" className="group">
            <div className="bg-card border border-border rounded-xl p-8 hover:border-primary transition-all hover:shadow-lg cursor-pointer">
              <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Car className="w-7 h-7 text-primary group-hover:text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">For Drivers</h3>
              <p className="text-muted-foreground mb-4">
                Find nearby parking, book instantly, and enjoy seamless entry with OTP verification.
              </p>
              <div className="flex items-center text-primary font-semibold group-hover:gap-2 transition-all">
                Get Started <span className="ml-2">→</span>
              </div>
            </div>
          </Link>

          <Link href="/owner/signup" className="group">
            <div className="bg-card border border-border rounded-xl p-8 hover:border-secondary transition-all hover:shadow-lg cursor-pointer">
              <div className="w-14 h-14 bg-secondary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                <Users className="w-7 h-7 text-secondary group-hover:text-secondary-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">For Parking Owners</h3>
              <p className="text-muted-foreground mb-4">
                List your spaces, manage availability in real-time, and track earnings with analytics.
              </p>
              <div className="flex items-center text-secondary font-semibold group-hover:gap-2 transition-all">
                Get Started <span className="ml-2">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Map + Legend */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white/60 p-4 card-border card-shadow rounded-lg">
            <div className="w-full h-80 md:h-[520px] rounded-lg overflow-hidden border border-border">
              {isClient && <MapClient userPos={userPos} spaces={spaces} />}
            </div>
          </div>

          <aside className="bg-card p-4 rounded-lg card-border">
            <h4 className="text-lg font-semibold text-foreground mb-2">Legend & Nearby</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="inline-block w-4 h-4 mr-2 align-middle rounded-full bg-green-500/80"></span>Within 200m — preferred</li>
              <li><span className="inline-block w-4 h-4 mr-2 align-middle rounded-full bg-yellow-400/80"></span>200–450m — nearby</li>
              <li><span className="inline-block w-4 h-4 mr-2 align-middle rounded-full bg-red-500/80"></span>450–800m — far</li>
            </ul>

            <div className="mt-4">
              <h5 className="text-sm font-medium text-foreground mb-2">Parking Spaces ({spaces.length})</h5>
              <div className="max-h-64 overflow-auto space-y-2 text-sm">
                {spaces.map(s => (
                  <div key={s.space_id} className="p-2 rounded-md bg-background/60 border border-border">
                    <div className="font-semibold text-foreground">{s.space_name}</div>
                    <div className="text-muted-foreground text-xs">{s.address}</div>
                    <div className="text-xs text-muted-foreground">Slots: {s.total_slots}</div>
                    {userPos && (
                      <div className="text-xs text-muted-foreground">Distance: {Math.round(distanceMeters(userPos.lat, userPos.lng, Number(s.latitude), Number(s.longitude)))} m</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
  )
}
