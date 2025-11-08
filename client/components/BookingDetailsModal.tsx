"use client"

import { MapPin, Clock, Calendar, CreditCard, Car, Hash, QrCode } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface BookingDetailsModalProps {
  booking: any
  onClose: () => void
}

export default function BookingDetailsModal({ booking, onClose }: BookingDetailsModalProps) {
  if (!booking) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'upcoming':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'completed':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢'
      case 'upcoming':
      case 'confirmed':
        return '🔵'
      case 'completed':
        return '⚪'
      default:
        return '⚫'
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Booking Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold px-4 py-2 rounded-full border ${getStatusColor(booking.status)}`}>
              {getStatusIcon(booking.status)} {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-primary">₹{booking.amount}</p>
            </div>
          </div>

          {/* Parking Location */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 p-3 rounded-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-blue-600 font-semibold mb-1">PARKING LOCATION</p>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {booking.space_name || booking.rawData?.parking_spaces?.space_name || 'Unknown Location'}
                </h3>
                {booking.slot_type && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full font-semibold">
                      {booking.slot_type.replace('_', ' ').toUpperCase()} SLOT
                    </span>
                  </div>
                )}
                {booking.rawData?.parking_spaces?.address ? (
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-blue-200">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {booking.rawData.parking_spaces.address}
                        </p>
                        {booking.rawData.parking_spaces.latitude && booking.rawData.parking_spaces.longitude && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📍 {booking.rawData.parking_spaces.latitude.toFixed(6)}, {booking.rawData.parking_spaces.longitude.toFixed(6)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Address not available
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Booking Information Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Booking ID */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Hash className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Booking ID</p>
                  <p className="font-mono font-semibold text-sm">{booking.id.slice(0, 8)}...</p>
                </div>
              </div>
            </div>

            {/* Slot Type */}
            {booking.slot_type && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Car className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Slot Type</p>
                    <p className="font-semibold text-sm capitalize">{booking.slot_type.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Date */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-semibold text-sm">{booking.date}</p>
                </div>
              </div>
            </div>

            {/* Time */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time</p>
                  <p className="font-semibold text-sm">
                    {booking.startTime || '00:00'} - {booking.endTime || '00:00'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Entry OTP - Only for active/upcoming */}
          {(booking.status === 'active' || booking.status === 'upcoming' || booking.status === 'confirmed') && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-dashed border-blue-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Entry Verification Code</p>
                  <p className="text-xs text-muted-foreground">Show this code to parking staff</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
                <p className="text-xs text-center text-muted-foreground mb-2">Entry OTP</p>
                <code className="text-3xl font-bold tracking-[0.5em] text-primary block text-center">
                  {booking.rawData?.otp_entry || '------'}
                </code>
              </div>
            </div>
          )}

          {/* QR Code - Only for active/upcoming */}
          {(booking.status === 'active' || booking.status === 'upcoming' || booking.status === 'confirmed') && (
            <div className="bg-white rounded-lg p-6 border border-border">
              <p className="text-sm font-semibold text-center text-muted-foreground mb-4">
                QR Code for Quick Verification
              </p>
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center aspect-square max-w-xs mx-auto">
                <div className="text-center text-muted-foreground">
                  <svg 
                    className="w-48 h-48 mx-auto mb-3" 
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
                  <p className="text-sm">Scan to verify entry</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-foreground">Payment Details</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hourly Rate</span>
                <span className="font-semibold">
                  ₹{booking.rawData?.hourly_rate ? Number(booking.rawData.hourly_rate).toFixed(2) : '0.00'}/hr
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-semibold">
                  {booking.rawData?.start_time && booking.rawData?.end_time ? 
                    (() => {
                      const start = new Date(booking.rawData.start_time)
                      const end = new Date(booking.rawData.end_time)
                      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                        const hours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60))
                        return `${hours}h`
                      }
                      return 'N/A'
                    })() : 
                    'N/A'}
                </span>
              </div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between">
                <span className="font-semibold text-foreground">Total Amount</span>
                <span className="text-xl font-bold text-primary">₹{booking.amount || 0}</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex gap-3">
            {booking.rawData?.parking_spaces?.latitude && booking.rawData?.parking_spaces?.longitude && (
              <Button 
                variant="secondary"
                onClick={() => {
                  const lat = booking.rawData.parking_spaces.latitude
                  const lng = booking.rawData.parking_spaces.longitude
                  const spaceName = booking.rawData.parking_spaces.space_name
                  
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
                }}
                className="flex-1 gap-2"
                size="lg"
              >
                <MapPin className="w-4 h-4" />
                Navigate
              </Button>
            )}
            <Button onClick={onClose} className="flex-1" size="lg">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
