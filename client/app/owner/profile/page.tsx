"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Edit2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function OwnerProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    businessName: "Premium Parking Solutions",
    ownerName: "Rajesh Kumar",
    email: "rajesh@parkingbiz.com",
    phone: "+1 555-0001",
    businessLicense: "BP123456",
    gstNumber: "GST123ABC",
    totalSpaces: "225",
    monthlyRevenue: "₹2,25,000",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/owner/dashboard" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-foreground">Business Profile</h1>
          {!isEditing && (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Business Header */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 bg-secondary rounded-lg flex items-center justify-center text-3xl">🏢</div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">{profile.businessName}</h2>
              <p className="text-muted-foreground">Owner: {profile.ownerName}</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-card border border-border rounded-lg p-8 space-y-6 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Business Name</label>
              <Input
                name="businessName"
                value={profile.businessName}
                onChange={handleChange}
                disabled={!isEditing}
                className={!isEditing ? "bg-muted" : ""}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Owner Name</label>
              <Input
                name="ownerName"
                value={profile.ownerName}
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
            <h3 className="font-bold text-foreground mb-4">Business Documentation</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Business License</label>
                <div className="flex items-center gap-2">
                  <Input name="businessLicense" value={profile.businessLicense} disabled className="bg-muted" />
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-700 font-bold text-sm">✓</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">GST Number</label>
                <div className="flex items-center gap-2">
                  <Input name="gstNumber" value={profile.gstNumber} disabled className="bg-muted" />
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-green-700 font-bold text-sm">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Parking Spaces</p>
            <p className="text-3xl font-bold text-secondary">{profile.totalSpaces}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground mb-1">Monthly Revenue</p>
            <p className="text-3xl font-bold text-secondary">{profile.monthlyRevenue}</p>
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
      </div>
    </main>
  )
}
