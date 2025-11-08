"use client"

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Circle, CircleMarker, Popup, Marker, useMap } from 'react-leaflet'
// @ts-ignore - leaflet types may not be installed in this workspace; runtime will provide the module
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type ParkingSpace = {
  space_id: string
  space_name: string
  address: string
  latitude: number
  longitude: number
  total_slots: number
}

type AvailabilityMap = Record<string, { available: number; total: number }>

export default function MapClient({ userPos, spaces, availability, onSelect }: { userPos: { lat: number; lng: number } | null; spaces: ParkingSpace[]; availability?: AvailabilityMap; onSelect?: (space: ParkingSpace) => void }) {
  const center = userPos ? [userPos.lat, userPos.lng] : [20.5937, 78.9629]

  // choose an icon at runtime: prefer /loc.png if it exists, otherwise fallback to /logo.png
  const [iconUrl, setIconUrl] = useState('/logo.png')
  useEffect(() => {
    const img = new Image()
    img.onload = () => setIconUrl('/loc.png')
    img.onerror = () => setIconUrl('/logo.png')
    img.src = '/loc.png'
  }, [])

  // @ts-ignore - leaflet Icon may be untyped in this workspace
  const userIcon = new L.Icon({ iconUrl, iconSize: [36, 36], iconAnchor: [18, 36] })

  // react-leaflet typings in this workspace can be fragile; use any aliases when necessary to avoid TS complaints
  const AnyCircle: any = Circle as any
  const AnyMarker: any = Marker as any

  function RecenterEffect({ latlng }: { latlng: [number, number] | null }) {
    const map = useMap()
    useEffect(() => {
      if (!latlng) return
      try { map.setView(latlng, map.getZoom()) } catch (e) {}
    }, [latlng, map])
    return null
  }

  return (
    // @ts-ignore react-leaflet types may vary in this setup
    <MapContainer center={center as [number, number]} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
      // @ts-ignore
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* parking spaces as small markers */}
      {spaces.map(s => {
        const a = availability?.[s.space_id]
        // determine color by availability ratio
        let stroke = '#003F79'
        let fill = '#94a3b8' // neutral
        let fillOpacity = 0.9
        if (a) {
          const total = a.total || s.total_slots || 1
          const ratio = a.available / total
          if (a.available === 0) {
            stroke = '#9ca3af'
            fill = '#ef4444' // red
            fillOpacity = 0.9
          } else if (ratio < 0.5) {
            stroke = '#b45309'
            fill = '#f59e0b' // yellow
            fillOpacity = 0.9
          } else {
            stroke = '#065f46'
            fill = '#10b981' // green
            fillOpacity = 0.9
          }
        }

        return (
          // @ts-ignore
          <CircleMarker
            key={s.space_id}
            center={[Number(s.latitude), Number(s.longitude)]}
            pathOptions={{ color: stroke, fillColor: fill, fillOpacity }}
            eventHandlers={{ click: () => { if (onSelect) onSelect(s) } }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{s.space_name}</div>
                <div className="text-xs">{s.address}</div>
                <div className="text-xs">Slots: {s.total_slots}</div>
                {availability?.[s.space_id] ? (
                  <div className="text-xs">Available: {availability[s.space_id].available}/{availability[s.space_id].total}</div>
                ) : null}
                <div className="mt-2">
                  <a href={`/driver/booking/${s.space_id}`} className="inline-block px-3 py-1 rounded bg-primary text-primary-foreground text-sm">Book Now</a>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}

      {/* user distance rings + marker */}
      {userPos && (
        <>
          <RecenterEffect latlng={[userPos.lat, userPos.lng]} />
          {/* Distance rings: green (200m), yellow (450m), red (800m) */}
          <AnyCircle center={[userPos.lat, userPos.lng]} radius={200} pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.08, weight: 2 }} />
          <AnyCircle center={[userPos.lat, userPos.lng]} radius={450} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.06, weight: 2 }} />
          <AnyCircle center={[userPos.lat, userPos.lng]} radius={800} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.04, weight: 2 }} />
          {/* show custom icon marker for user location */}
          <AnyMarker position={[userPos.lat, userPos.lng]} icon={userIcon} />
        </>
      )}
    </MapContainer>
  )
}
