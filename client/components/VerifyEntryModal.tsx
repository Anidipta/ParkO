"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface VerifyEntryModalProps {
  booking: any
  onClose: () => void
  onSuccess: () => void
}

export default function VerifyEntryModal({ booking, onClose, onSuccess }: VerifyEntryModalProps) {
  const [mode, setMode] = useState<'manual' | 'scan'>('manual')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const verifyOTP = async (otpValue: string) => {
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/bookings/verify-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking.booking_id,
          otp_entry: otpValue
        })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        onSuccess()
        onClose()
      } else {
        setError(data.error || 'Verification failed')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify')
    } finally {
      setLoading(false)
    }
  }

  const handleScanResult = (result: string) => {
    // QR code format: "ENTRY:123456|EXIT:654321|BOOKING:xxx"
    const match = result.match(/ENTRY:(\d{6})/)
    if (match && match[1]) {
      verifyOTP(match[1])
    } else {
      setError('Invalid QR code format')
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Entry</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Booking ID</p>
            <p className="font-mono text-sm">{booking.booking_id?.slice(0, 8)}</p>
          </div>

          <Tabs value={mode} onValueChange={setMode as any}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Enter OTP</TabsTrigger>
              <TabsTrigger value="scan">Scan QR</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Entry OTP</label>
                <Input 
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl font-mono tracking-widest"
                />
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}
              
              <Button 
                onClick={() => verifyOTP(otp)}
                disabled={otp.length !== 6 || loading}
                className="w-full"
              >
                {loading ? 'Verifying...' : 'Verify Entry'}
              </Button>
            </TabsContent>
            
            <TabsContent value="scan" className="space-y-4">
              <div className="bg-muted/50 p-8 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  QR Scanner feature requires camera permissions
                </p>
                <p className="text-xs text-muted-foreground">
                  Use manual OTP entry for now
                </p>
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
