"use client"

import { useState } from "react"
import Link from "link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ParkingLocation {
  id: string
  name: string
  lat: number
  lng: number
  capacity: number
  occupied: number
}

export default function OwnerMap() {
  const [userLat, setUserLat] = useState(40.7128)
  const [userLng, setUserLng] = useState(-74.006)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)

  const parkingLocations: ParkingLocation[] = [
    { id: "L1", name: "Downtown Plaza", lat: 40.715, lng: -74.006, capacity: 50, occupied: 35 },
    { id: "L2", name: "Tech Hub Garage", lat: 40.71, lng: -74.009, capacity: 100, occupied: 67 },
    { id: "L3", name: "Shopping Mall", lat: 40.708, lng: -74.005, capacity: 75, occupied: 42 },
  ]

  const gridWidth = 400
  const gridHeight = 300
  const scale = 100000

  const latToY = (lat: number) => ((40.72 - lat) * scale) / 200 + gridHeight / 2
  const lngToX = (lng: number) => ((lng + 74.01) * scale) / 200 + gridWidth / 2

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/owner/dashboard">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">My Parking Locations</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div
              className="relative bg-gradient-to-br from-blue-100 to-blue-50 border border-border rounded-lg overflow-hidden"
              style={{ height: "500px" }}
            >
              <svg className="w-full h-full" viewBox={`0 0 ${gridWidth} ${gridHeight}`}>
                {/* Grid */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <g key={i}>
                    <line x1={i * 80} y1="0" x2={i * 80} y2={gridHeight} stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1={i * 60} x2={gridWidth} y2={i * 60} stroke="#e5e7eb" strokeWidth="1" />
                  </g>
                ))}

                {/* User */}
                <circle cx={lngToX(userLng)} cy={latToY(userLat)} r="8" fill="#3b82f6" />
                <circle
                  cx={lngToX(userLng)}
                  cy={latToY(userLat)}
                  r="15"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  opacity="0.5"
                />

                {/* Locations */}
                {parkingLocations.map((loc) => (
                  <g key={loc.id}>
                    <circle
                      cx={lngToX(loc.lng)}
                      cy={latToY(loc.lat)}
                      r="12"
                      fill={selectedLocation === loc.id ? "#f97316" : "#7c3aed"}
                      onClick={() => setSelectedLocation(loc.id)}
                      style={{ cursor: "pointer" }}
                    />
                    <text
                      x={lngToX(loc.lng)}
                      y={latToY(loc.lat) + 4}
                      textAnchor="middle"
                      fontSize="10"
                      fill="white"
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      {loc.capacity}
                    </text>
                  </g>
                ))}
              </svg>

              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>You</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span>Your Locations</span>
                </div>
              </div>
            </div>
          </div>

          {/* Locations List */}
          <div className="space-y-4">
            <h3 className="font-bold text-foreground">Your Parking Locations</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {parkingLocations.map((loc) => (
                <div
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedLocation === loc.id
                      ? "bg-secondary/10 border-secondary"
                      : "bg-card border-border hover:border-secondary"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-foreground text-sm">{loc.name}</h4>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {loc.capacity} slots
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {loc.occupied}/{loc.capacity} occupied
                  </p>
                  <div className="w-full bg-border rounded-full h-2">
                    <div
                      className="bg-secondary h-2 rounded-full transition-all"
                      style={{ width: `${(loc.occupied / loc.capacity) * 100}%` }}
                    />
                  </div>
                  <Link href={`/owner/space/${loc.id}`}>
                    <Button size="sm" variant="outline" className="w-full mt-3 bg-transparent">
                      Manage
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
