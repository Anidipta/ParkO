"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { MapPin, Navigation, LogOut, User, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import BookingDetailsModal from "@/components/BookingDetailsModal"

interface ParkingSpace {
  id: string
  name: string
  distance: string
  rate: number
  type: string
  availability: number
  nextFree: string
  reserved?: boolean
}

interface Booking {
  id: string
  space: string
  date: string
  startTime: string
  endTime: string
  amount: number
  status: "active" | "completed" | "upcoming"
  slot_type?: string
  rawData?: any
}

export default function DriverDashboard() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [displayName, setDisplayName] = useState<string>('')
  const [checkedAuth, setCheckedAuth] = useState(false)
  const [role, setRole] = useState<string | null>(null)
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [driverProfile, setDriverProfile] = useState<any | null>(null)
  const router = useRouter()

  // run an initial auth check. If there's no session, redirect to driver signup.
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' })
        if (!mounted) return
        if (!res.ok) {
          router.replace('/driver/signup')
          return
        }
        const json = await res.json()
        const user = json?.user
        const uid = user?.userId ?? user?.user_id ?? null
        const userRole = user?.user_type ?? user?.userType ?? null
        const name = user?.fullName || user?.full_name || user?.name || user?.email || ''

        if (!uid) {
          router.replace('/driver/signup')
          return
        }

        // if an owner tries to access driver dashboard, send them to owner dashboard
        if (userRole === 'owner' || userRole === 'manager') {
          router.replace('/owner/dashboard')
          return
        }

        setAuthUserId(uid)
        setRole(userRole)
        setDisplayName(name)
        setCheckedAuth(true)
      } catch (err) {
        console.warn('auth check failed', err)
        router.replace('/driver/signup')
      }
    })()
    return () => { mounted = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null)  
  const [userId, setUserId] = useState<string | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [nearbySpaces, setNearbySpaces] = useState<ParkingSpace[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [loadingSpaces, setLoadingSpaces] = useState(false)
  const [detailsModalBooking, setDetailsModalBooking] = useState<any | null>(null)

  // current and past computed from bookings
  const currentBooking = bookings.find((b) => b.status === 'active' || b.status === 'upcoming') ?? null
  const pastBookings = bookings.filter((b) => b.status === 'completed')

  // fetch bookings after auth check passes
  useEffect(() => {
    if (!checkedAuth) return
    let ignore = false
    const load = async () => {
      try {
        const uid = authUserId
        if (!uid) return
        if (ignore) return
        setUserId(uid)
        setLoadingBookings(true)
        const res = await fetch(`/api/bookings?driver_id=${encodeURIComponent(uid)}`)
        const j = await res.json().catch(() => ({}))
        if (res.ok && Array.isArray(j.data)) {
          setBookings(j.data.map((bk: any) => {
            const startDate = bk.start_time ? new Date(bk.start_time) : null
            const endDate = bk.end_time ? new Date(bk.end_time) : null
            
            return {
              id: bk.booking_id,
              name: bk.space_name,
              space: bk.parking_spaces?.address || 'Unknown Location',
              date: startDate && !isNaN(startDate.getTime()) ? startDate.toLocaleDateString() : 'N/A',
              startTime: startDate && !isNaN(startDate.getTime()) ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00',
              endTime: endDate && !isNaN(endDate.getTime()) ? endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00',
              amount: bk.estimated_amount ?? 0,
              status: bk.booking_status ?? 'upcoming',
              slot_type: bk.slot_type,
              rawData: bk, // Store full booking data for modal
            }
          }))
        }
      } catch (err) {
        console.warn('load bookings failed', err)
      } finally {
        setLoadingBookings(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [checkedAuth, authUserId])

  // fetch driver profile after auth check
  useEffect(() => {
    if (!checkedAuth || !authUserId) return
    let ignore = false
    ;(async () => {
      try {
        const res = await fetch(`/api/users/profile?user_id=${encodeURIComponent(authUserId)}`)
        if (!res.ok) return
        const j = await res.json().catch(() => ({}))
        if (res.ok && j.data) {
          if (!ignore) setDriverProfile(j.data)
        }
      } catch (err) {
        console.warn('failed to load driver profile', err)
      }
    })()
    return () => { ignore = true }
  }, [checkedAuth, authUserId])

  // fetch nearby spaces using geolocation then fallback to /api/parking
  useEffect(() => {
    let ignore = false
    const loadSpaces = async () => {
      setLoadingSpaces(true)
      try {
        if (!checkedAuth) return
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            if (ignore) return
            try {
              const lat = pos.coords.latitude
              const lng = pos.coords.longitude
              const res = await fetch(`/api/search?lat=${lat}&lng=${lng}&radius=200`)
              const j = await res.json().catch(() => ({}))
              if (res.ok && Array.isArray(j.data)) {
                // Filter to only show spaces within 200m (double-check)
                const filtered = j.data.filter((r: any) => r.distance_m <= 200)
                const mapped = filtered.map((r: any) => ({ 
                  id: r.space.space_id, 
                  name: r.space.space_name, 
                  distance: `${Math.round(r.distance_m)}m`, 
                  rate: r.cheapest_slot?.hourly_rate ?? 0, 
                  type: r.cheapest_slot?.slot_type ?? 'Standard', 
                  availability: r.total_available ?? 0, // Use total available from API
                  nextFree: 'Now' 
                }))
                setNearbySpaces(mapped)
                return
              }
            } catch (e) {
              console.warn(e)
            }
          }, (err) => {
            console.warn('Geolocation error:', err)
            // If geolocation fails, show empty state
            if (!ignore) setNearbySpaces([])
          }, { enableHighAccuracy: true })
        } else {
          // No geolocation support - show empty state with message
          if (!ignore) setNearbySpaces([])
        }
      } catch (err) {
        console.warn('load spaces failed', err)
      } finally {
        if (!ignore) setLoadingSpaces(false)
      }
    }
    loadSpaces()
    return () => { ignore = true }
  }, [])

  

  return (
    <main className="min-h-screen bg-background">
      {!checkedAuth ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back{displayName ? `, ${displayName}` : ''}</h2>
          <p className="text-muted-foreground">Manage your parking bookings and find new spaces</p>
        </div>

        {/* Active Booking */}
        {currentBooking ? (
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl p-8 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm font-semibold opacity-90">Current Booking </p>
                <h3 className="text-2xl font-bold mt-1">{currentBooking.space}</h3>
              </div>
              <div className="text-4xl font-bold">₹{currentBooking.amount}</div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-primary-foreground/20">
              <div>
                <p className="text-xs opacity-75">Duration</p>
                <p className="font-semibold">
                  {currentBooking.startTime && currentBooking.startTime !== 'Invalid Date' ? currentBooking.startTime : '00:00'} - {currentBooking.endTime && currentBooking.endTime !== 'Invalid Date' ? currentBooking.endTime : '00:00'}
                </p>
              </div>
              <div>
                <p className="text-xs opacity-75">Date</p>
                <p className="font-semibold">{currentBooking.date || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs opacity-75">Status</p>
                <p className="font-semibold capitalize bg-green-500/30 px-2 py-1 rounded text-xs w-fit">{currentBooking.status}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                size="sm" 
                variant="secondary" 
                className="gap-2"
                onClick={() => {
                  const lat = currentBooking.rawData?.parking_spaces?.latitude
                  const lng = currentBooking.rawData?.parking_spaces?.longitude
                  const spaceName = currentBooking.rawData?.parking_spaces?.space_name
                  
                  if (lat && lng) {
                    // Get current location and open directions
                    if ('geolocation' in navigator) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          const currentLat = position.coords.latitude
                          const currentLng = position.coords.longitude
                          // Open Google Maps with directions from current location to destination
                          window.open(
                            `https://www.google.com/maps/dir/${currentLat},${currentLng}/${lat},${lng}`,
                            '_blank'
                          )
                        },
                        (error) => {
                          // If location access denied, open without origin
                          console.warn('Geolocation error:', error)
                          window.open(
                            `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(spaceName || 'Parking Location')}`,
                            '_blank'
                          )
                        },
                        { enableHighAccuracy: true, timeout: 5000 }
                      )
                    } else {
                      // Browser doesn't support geolocation
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                        '_blank'
                      )
                    }
                  } else {
                    alert('Location not available for navigation')
                  }
                }}
              >
                <Navigation className="w-4 h-4" />
                Navigate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
                onClick={() => setDetailsModalBooking(currentBooking)}
              >
                View Details
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-8 mb-8 text-center">
            <p className="text-lg font-semibold text-foreground mb-2">No active bookings</p>
            <p className="text-sm text-muted-foreground mb-4">You currently don't have an active booking. Find nearby parking to start a booking.</p>
            <Link href="/driver/map"><Button>Find Nearby Parking</Button></Link>
          </div>
        )}

        {/* Nearby Parking Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-foreground">Nearby Parking Spaces (200m)</h3>
            <Link href="/driver/map">
              <Button variant="outline" size="sm">
                View Map
              </Button>
            </Link>
          </div>

          {loadingSpaces ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading nearby spaces...</p>
            </div>
          ) : nearbySpaces.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-semibold text-foreground mb-2">No parking spaces within 200m</p>
              <p className="text-sm text-muted-foreground mb-4">
                Enable location access to find nearby parking or view the map to explore all available spaces.
              </p>
              <Link href="/driver/map">
                <Button>View All Parking Spaces</Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {nearbySpaces.map((space) => (
                <div
                  key={space.id}
                  className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-foreground">{space.name}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {space.distance}
                      </p>
                    </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">₹{space.rate}</p>
                    <p className="text-xs text-muted-foreground">per hour</p>
                  </div>
                </div>

                <div className="bg-muted rounded p-3 mb-4">
                  <p className="text-xs text-muted-foreground mb-1">Available Slots</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-lg font-bold text-foreground">{space.availability}</p>
                    <p className="text-xs text-muted-foreground">{space.type}</p>
                  </div>
                  {space.nextFree !== "Now" && (
                    <p className="text-xs text-muted-foreground mt-2">Next available at {space.nextFree}</p>
                  )}
                </div>

                {driverProfile && (!driverProfile.license_number || !driverProfile.plate_number || !driverProfile.pan_card_number) ? (
                  <Link href="/driver/verification">
                    <Button className="w-full" size="sm">Verify to Book</Button>
                  </Link>
                ) : (
                  <Link href={`/driver/booking/${space.id}`}>
                    <Button className="w-full" size="sm">Book Now</Button>
                  </Link>
                )}
              </div>
            ))}
            </div>
          )}
        </div>

        {/* Recent Bookings - 3 Column Grid */}
        <div>
          <h3 className="text-xl font-bold text-foreground mb-6">Recent Bookings</h3>
          {loadingBookings ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <p className="text-lg font-semibold text-foreground mb-2">No bookings yet</p>
              <p className="text-sm text-muted-foreground">Your booking history will appear here</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      booking.status === 'active' ? 'bg-green-100 text-green-700' :
                      booking.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {booking.status === 'active' ? '🟢 Active' : 
                       booking.status === 'upcoming' ? '🔵 Upcoming' : 
                       '⚪ Completed'}
                    </span>
                    <p className="text-sm font-bold text-primary">₹{booking.amount}</p>
                  </div>

                  {/* Space Info */}
                  <div className="mb-4">
                    <h4 className="font-bold text-foreground text-lg mb-1">{booking.space}</h4>
                    <p className="text-sm text-muted-foreground">
                      {booking.date}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.startTime} - {booking.endTime}
                    </p>
                  </div>

                  {/* Entry OTP Section - Only for active/upcoming */}
                  {(booking.status === 'active' || booking.status === 'upcoming') && (
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Entry OTP</p>
                      <div className="flex items-center gap-2">
                        <code className="text-2xl font-bold tracking-wider text-primary bg-white px-3 py-2 rounded border-2 border-dashed border-primary flex-1 text-center">
                          {booking.rawData?.otp_entry || '------'}
                        </code>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Show this code to parking staff
                      </p>
                    </div>
                  )}

                  {/* QR Code Section - Only for active/upcoming */}
                  {(booking.status === 'active' || booking.status === 'upcoming') && (
                    <div className="bg-white rounded-lg p-4 border border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-3 text-center">
                        QR Code
                      </p>
                      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center aspect-square">
                        <div className="text-center text-muted-foreground">
                          <svg 
                            className="w-32 h-32 mx-auto mb-2" 
                            viewBox="0 0 100 100" 
                            fill="currentColor"
                          >
                            <rect x="0" y="0" width="45" height="45" />
                            <rect x="55" y="0" width="45" height="45" />
                            <rect x="0" y="55" width="45" height="45" />
                            <rect x="65" y="65" width="15" height="15" />
                            <rect x="85" y="65" width="15" height="15" />
                            <rect x="65" y="85" width="15" height="15" />
                            <rect x="85" y="85" width="15" height="15" />
                          </svg>
                          <p className="text-xs">Scan to verify</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    size="sm"
                    onClick={() => setDetailsModalBooking(booking)}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Booking Details Modal */}
        {detailsModalBooking && (
          <BookingDetailsModal
            booking={detailsModalBooking}
            onClose={() => setDetailsModalBooking(null)}
          />
        )}
      </div>
      )}
    </main>
  )
}
