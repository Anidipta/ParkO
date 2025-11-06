"use client"

import React from 'react'
import { MapContainer, TileLayer, Circle, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

type ParkingSpace = {
  space_id: string
  space_name: string
  address: string
  latitude: number
  longitude: number
  total_slots: number
}

export default function MapClient({ userPos, spaces }: { userPos: { lat: number; lng: number } | null; spaces: ParkingSpace[] }) {
  const center = userPos ? [userPos.lat, userPos.lng] : [20.5937, 78.9629]

  return (
    <MapContainer center={center as [number, number]} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* parking spaces as small markers */}
      {spaces.map(s => (
        <CircleMarker key={s.space_id} center={[Number(s.latitude), Number(s.longitude)]} radius={6} pathOptions={{ color: '#003F79', fillColor: '#0EC496', fillOpacity: 0.9 }}>
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">{s.space_name}</div>
              <div className="text-xs">{s.address}</div>
              <div className="text-xs">Slots: {s.total_slots}</div>
              <div className="mt-2">
                <a href={`/driver/booking/${s.space_id}`} className="inline-block px-3 py-1 rounded bg-primary text-primary-foreground text-sm">Book Now</a>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* user distance rings */}
      {userPos && (
        <>
          {/* User rings: 100m green, 200m yellow, 300m red */}
          {/* @ts-ignore - react-leaflet Circle typing can be picky about radius in some setups */}
          <Circle center={[userPos.lat, userPos.lng]} radius={100} pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.5 }} />
          {/* @ts-ignore - react-leaflet Circle typing can be picky about radius in some setups */}
          <Circle center={[userPos.lat, userPos.lng]} radius={200} pathOptions={{ color: 'yellow', fillColor: 'yellow', fillOpacity: 0.25 }} />
          {/* @ts-ignore - react-leaflet Circle typing can be picky about radius in some setups */}
          <Circle center={[userPos.lat, userPos.lng]} radius={300} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.18 }} />
        </>
      )}
    </MapContainer>
  )
}
