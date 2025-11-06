"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, CircleMarker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

type LatLng = { lat: number; lng: number }

export default function LocationPicker({ value, onChange, userPos, height = 360 }: { value: LatLng | null; onChange: (ll: LatLng) => void; userPos?: LatLng | null; height?: number }) {
  const center = useMemo<[number, number]>(() => {
    if (value) return [value.lat, value.lng]
    if (userPos) return [userPos.lat, userPos.lng]
    return [20.5937, 78.9629] // India
  }, [value, userPos])

  const [position, setPosition] = useState<LatLng | null>(value)
  useEffect(() => setPosition(value), [value?.lat, value?.lng])

  function ClickHandler() {
    useMapEvents({
      click(e: any) {
        const ll = { lat: e.latlng.lat, lng: e.latlng.lng }
        setPosition(ll)
        onChange(ll)
      },
    })
    return null
  }

  return (
    <div style={{ height }}>
      {/* @ts-ignore react-leaflet types may vary */}
      <MapContainer center={center} zoom={15} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        {/* @ts-ignore react-leaflet types may vary */}
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {userPos && (
          // @ts-ignore
          <CircleMarker center={[userPos.lat, userPos.lng]} radius={8} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.85 }} />
        )}
        {position && (
          // @ts-ignore
          <Marker position={[position.lat, position.lng]} draggable={true} eventHandlers={{ dragend: (e: any) => {
            // @ts-ignore
            const ll = e.target.getLatLng()
            const val = { lat: ll.lat, lng: ll.lng }
            setPosition(val)
            onChange(val)
          } }} />
        )}
        <ClickHandler />
      </MapContainer>
    </div>
  )
}
