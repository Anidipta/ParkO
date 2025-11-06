"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Edit2, Save, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function DriverProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "+1 555-0000",
    licenseNumber: "DL1234567890",
    plateNumber: "MH02AB1234",
    panNumber: "ABCDE1234F",
    joinDate: "01 Oct, 2025",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/driver/dashboard" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">My Profile</h1>
          {!isEditing && (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{profile.name}</h2>
              <p className="text-muted-foreground">Member since {profile.joinDate}</p>
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
                disabled={!isEditing}
                className={!isEditing ? "bg-muted" : ""}
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
            <h3 className="font-bold text-foreground mb-4">Verified Documents</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Driver License Number</label>
                <div className="flex items-center gap-2">
                  <Input name="licenseNumber" value={profile.licenseNumber} disabled className="bg-muted" />
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-700 font-bold text-sm">✓</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Car Plate Number</label>
                <div className="flex items-center gap-2">
                  <Input name="plateNumber" value={profile.plateNumber} disabled className="bg-muted" />
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-700 font-bold text-sm">✓</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">PAN Number</label>
                <div className="flex items-center gap-2">
                  <Input name="panNumber" value={profile.panNumber} disabled className="bg-muted" />
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-700 font-bold text-sm">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-primary mb-1">42</p>
            <p className="text-sm text-muted-foreground">Total Bookings</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-secondary mb-1">₹4,200</p>
            <p className="text-sm text-muted-foreground">Total Spent</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-green-600 mb-1">99%</p>
            <p className="text-sm text-muted-foreground">Rating</p>
          </div>
        </div>

        {/* Actions */}
        {isEditing && (
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={() => setIsEditing(false)} className="flex-1 gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        )}

        {/* Danger Zone */}
        <div className="mt-12 p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-bold text-red-900 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-800 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent">
            Delete Account
          </Button>
        </div>
      </div>
    </main>
  )
}
