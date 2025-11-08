"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Edit2, Save, Camera, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function DriverProfile() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [user, setUser] = useState<any>(null)
  const [driverProfile, setDriverProfile] = useState<any>(null)
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    plateNumber: "",
    panNumber: "",
    joinDate: "",
    verificationStatus: "pending",
    profileCompletion: 0,
    canBook: false,
  })
  const [bookingStats, setBookingStats] = useState({
    totalBookings: 0,
    totalSpent: 0,
  })

  // Fetch current user and driver profile
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // Check session
        const sessionRes = await fetch('/api/auth/session', { credentials: 'include' })
        if (!mounted) return
        if (!sessionRes.ok) {
          router.replace('/login')
          return
        }

        const sessionJson = await sessionRes.json()
        const currentUser = sessionJson?.user
        if (!currentUser || (currentUser.user_type !== 'driver' && currentUser.userType !== 'driver')) {
          router.replace('/login')
          return
        }

        setUser(currentUser)

        // Fetch driver profile
        const userId = currentUser.userId ?? currentUser.user_id
        const profileRes = await fetch(`/api/users/profile?user_id=${encodeURIComponent(userId)}`, { credentials: 'include' })
        if (!mounted) return
        
        if (profileRes.ok) {
          const profileJson = await profileRes.json()
          const dp = profileJson?.data
          setDriverProfile(dp)

          setProfile({
            name: currentUser.fullName ?? currentUser.full_name ?? "",
            email: currentUser.email ?? "",
            phone: currentUser.phone ?? "",
            licenseNumber: dp?.license_number ?? "",
            plateNumber: dp?.plate_number ?? "",
            panNumber: dp?.pan_card_number ?? "",
            joinDate: currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "",
            verificationStatus: dp?.verification_status ?? "pending",
            profileCompletion: dp?.profile_completion_percentage ?? 0,
            canBook: dp?.can_book ?? false,
          })
        }

        // Fetch booking stats
        const bookingsRes = await fetch(`/api/bookings?driver_id=${encodeURIComponent(userId)}`, { credentials: 'include' })
        if (!mounted) return
        if (bookingsRes.ok) {
          const bookingsJson = await bookingsRes.json()
          const bookings = bookingsJson?.data ?? []
          const total = bookings.length
          const spent = bookings.reduce((sum: number, b: any) => sum + (Number(b.final_amount) || Number(b.estimated_amount) || 0), 0)
          setBookingStats({ totalBookings: total, totalSpent: spent })
        }
      } catch (err: any) {
        console.error('Profile load error:', err)
        if (mounted) setError(err.message || 'Failed to load profile')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setError("")
    try {
      const userId = user?.userId ?? user?.user_id
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId,
          full_name: profile.name,
          phone: profile.phone,
        })
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to update profile')
      }

      setIsEditing(false)
      alert('Profile updated successfully')
    } catch (err: any) {
      setError(err.message || 'Update failed')
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/driver/dashboard" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">My Profile</h1>
          {!isEditing && !loading && (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}
          {isEditing && (
            <Button size="sm" onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              Save
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Loading State */}
        {loading ? (
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Verification Alert */}
            {profile.profileCompletion < 100 && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-900 font-semibold mb-1">⚠️ Profile Incomplete ({profile.profileCompletion}%)</p>
                <p className="text-xs text-amber-800">Complete your profile and upload verification documents to start booking.</p>
                <Link href="/driver/verification">
                  <Button size="sm" className="mt-2">Upload Documents</Button>
                </Link>
              </div>
            )}

            {profile.verificationStatus === 'pending' && profile.profileCompletion === 100 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 font-semibold">🕐 Verification Pending</p>
                <p className="text-xs text-blue-800">Your documents are under review. You'll be able to book once verified.</p>
              </div>
            )}

            {profile.verificationStatus === 'verified' && profile.canBook && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-900 font-semibold">✓ Verified Driver</p>
                <p className="text-xs text-green-800">Your account is fully verified and ready to book parking spaces.</p>
              </div>
            )}

            {/* Profile Header */}
            <div className="bg-card border border-border rounded-lg p-8 mb-8">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{profile.name || 'Driver'}</h2>
                  <p className="text-muted-foreground">Member since {profile.joinDate || 'N/A'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${profile.verificationStatus === 'verified' ? 'bg-green-100 text-green-700' : profile.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {profile.verificationStatus === 'verified' ? '✓ Verified' : profile.verificationStatus === 'pending' ? '⏳ Pending' : '✗ Not Verified'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="bg-card border border-border rounded-lg p-8 space-y-6 mb-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Full Name</label>
                  <Input
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Email</label>
                  <Input
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleChange}
                    disabled={true}
                    className="bg-muted"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Phone</label>
                  <Input
                    name="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                  />
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-bold text-foreground mb-4">Verification Documents</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">Driver License Number</label>
                    <div className="flex items-center gap-2">
                      <Input name="licenseNumber" value={profile.licenseNumber || 'Not uploaded'} disabled className="bg-muted" />
                      {profile.licenseNumber && (
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-green-700 font-bold text-sm">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">Car Plate Number</label>
                    <div className="flex items-center gap-2">
                      <Input name="plateNumber" value={profile.plateNumber || 'Not uploaded'} disabled className="bg-muted" />
                      {profile.plateNumber && (
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-green-700 font-bold text-sm">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-foreground mb-2 block">PAN Number</label>
                    <div className="flex items-center gap-2">
                      <Input name="panNumber" value={profile.panNumber || 'Not uploaded'} disabled className="bg-muted" />
                      {profile.panNumber && (
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-green-700 font-bold text-sm">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Stats */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <p className="text-3xl font-bold text-primary mb-1">{bookingStats.totalBookings}</p>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <p className="text-3xl font-bold text-secondary mb-1">₹{bookingStats.totalSpent.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Total Spent</p>
              </div>
            </div>

            {/* Actions */}
            {isEditing && (
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  Save Changes
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
