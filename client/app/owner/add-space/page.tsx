"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function AddParkingSpace() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    spaceName: "",
    capacity: "50",
    type: "standard",
    ratePerHour: "60",
    specialSlots: "",
    location: "Current Location",
    address: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-secondary via-background to-primary/20">
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link
            href="/owner/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="bg-card border border-border rounded-xl p-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Add Parking Space</h1>
          <p className="text-muted-foreground mb-8">Step {step} of 3</p>

          {/* Progress */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-secondary" : "bg-border"}`}
              />
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Parking Space Name</label>
                <Input
                  name="spaceName"
                  value={formData.spaceName}
                  onChange={handleChange}
                  placeholder="e.g., Downtown Plaza Level 2"
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Total Capacity</label>
                <Input
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="50"
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Parking Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="standard">Standard</option>
                  <option value="compact">Compact</option>
                  <option value="premium">Premium</option>
                  <option value="covered">Covered</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Pricing */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Rate per Hour (₹)</label>
                <Input
                  name="ratePerHour"
                  type="number"
                  value={formData.ratePerHour}
                  onChange={handleChange}
                  placeholder="60"
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Special Slots (Optional)</label>
                <Input
                  name="specialSlots"
                  value={formData.specialSlots}
                  onChange={handleChange}
                  placeholder="e.g., Disabled, Women-only, Electric vehicle charging"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated</p>
              </div>
              <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4">
                <p className="text-sm text-foreground font-semibold mb-2">Estimated Monthly Revenue</p>
                <p className="text-2xl font-bold text-secondary">
                  ₹
                  {(
                    Number.parseInt(formData.capacity) *
                    Number.parseInt(formData.ratePerHour) *
                    24 *
                    30
                  ).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Based on 100% occupancy</p>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-900 text-sm">Set Your Location</p>
                  <p className="text-xs text-blue-800 mt-1">
                    Next step will show an interactive map to pinpoint your parking location
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Full Address</label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main Street, Downtown District"
                  className="w-full"
                />
              </div>
              <div className="bg-muted rounded-lg p-6 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Map preview will appear on confirmation</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                Previous
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={handleNext} className="flex-1">
                Next
              </Button>
            ) : (
              <Link href="/owner/dashboard" className="flex-1">
                <Button className="w-full">Create Parking Space</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
