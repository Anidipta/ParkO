"use client"

import { useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface MapMarker {
  id: string
  lat: number
  lng: number
  name: string
  rate: number
  availability: number
  distance: string
}

export default function DriverMap() {
  const [userLat, setUserLat] = useState(40.7128)
  const [userLng, setUserLng] = useState(-74.006)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)

  const parkingSpots: MapMarker[] = [
    { id: "PS001", lat: 40.715, lng: -74.006, name: "Downtown Plaza", rate: 60, availability: 5, distance: "45m" },
    { id: "PS002", lat: 40.71, lng: -74.009, name: "Shopping Mall", rate: 45, availability: 12, distance: "120m" },
    { id: "PS003", lat: 40.708, lng: -74.005, name: "Tech Hub Garage", rate: 50, availability: 3, distance: "185m" },
    { id: "PS004", lat: 40.716, lng: -74.01, name: "Park Street Lot", rate: 55, availability: 8, distance: "160m" },
    { id: "PS005", lat: 40.709, lng: -74.007, name: "Metro Station", rate: 40, availability: 15, distance: "95m" },
  ]

  const filteredSpots = parkingSpots.filter((spot) => spot.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Simple grid-based map visualization
  const gridWidth = 400
  const gridHeight = 300
  const scale = 100000

  const latToY = (lat: number) => {
    return ((40.72 - lat) * scale) / 200 + gridHeight / 2
  }

  const lngToX = (lng: number) => {
    return ((lng + 74.01) * scale) / 200 + gridWidth / 2
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/driver/dashboard" className="text-lg font-bold text-foreground">
            Parko - Find Parking
          </Link>
          <Link href="/driver/dashboard">
            <Button variant="outline" size="sm">
              Back
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div
              className="relative bg-gradient-to-br from-blue-100 to-blue-50 border border-border rounded-lg overflow-hidden"
              style={{ height: "500px" }}
            >
              {/* Map Grid */}
              <svg className="w-full h-full" viewBox={`0 0 ${gridWidth} ${gridHeight}`}>
                {/* Grid */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <g key={i}>
                    <line x1={i * 80} y1="0" x2={i * 80} y2={gridHeight} stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1={i * 60} x2={gridWidth} y2={i * 60} stroke="#e5e7eb" strokeWidth="1" />
                  </g>
                ))}

                {/* User Location */}
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

                {/* Parking Spots */}
                {filteredSpots.map((spot) => (
                  <g key={spot.id}>
                    <circle
                      cx={lngToX(spot.lng)}
                      cy={latToY(spot.lat)}
                      r="10"
                      fill={selectedMarker === spot.id ? "#f97316" : spot.availability > 5 ? "#10b981" : "#f59e0b"}
                      onClick={() => setSelectedMarker(spot.id)}
                      style={{ cursor: "pointer" }}
                    />
                    <text
                      x={lngToX(spot.lng)}
                      y={latToY(spot.lat) + 4}
                      textAnchor="middle"
                      fontSize="10"
                      fill="white"
                      fontWeight="bold"
                      pointerEvents="none"
                    >
                      {spot.availability}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Your Location</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>High Availability</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>Limited</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search & List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                placeholder="Search parking..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredSpots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No parking spaces found</p>
                </div>
              ) : (
                filteredSpots.map((spot) => (
                  <div
                    key={spot.id}
                    onClick={() => setSelectedMarker(spot.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedMarker === spot.id
                        ? "bg-primary/10 border-primary"
                        : "bg-card border-border hover:border-primary"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-foreground text-sm">{spot.name}</h4>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{spot.distance}</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">{spot.availability} spots available</span>
                      <span className="font-bold text-primary">₹{spot.rate}/hr</span>
                    </div>
                    <Link href={`/driver/booking/${spot.id}`}>
                      <Button size="sm" className="w-full">
                        Book Now
                      </Button>
                    </Link>
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
