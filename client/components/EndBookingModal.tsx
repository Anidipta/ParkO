"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface EndBookingModalProps {
  booking: any
  onClose: () => void
  onSuccess: (data: any) => void
}

export default function EndBookingModal({ booking, onClose, onSuccess }: EndBookingModalProps) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const endBooking = async () => {
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/bookings/verify-exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking.booking_id,
          otp_exit: otp || undefined
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        onSuccess(data)
        onClose()
      } else {
        setError(data.error || 'Failed to end booking')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to end booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>End Booking</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Booking ID</p>
            <p className="font-mono text-sm">{booking.booking_id?.slice(0, 8)}</p>
          </div>

          <div>
            <label className="text-sm font-medium">Exit OTP (Optional)</label>
            <Input 
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-2xl font-mono tracking-widest"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to end without OTP verification
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={endBooking}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Processing...' : 'End Booking'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
