"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ArrowLeft, AlertCircle, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DriverSignup() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    // Document fields
    documentType: "", // 'license' | 'plate' | 'pan'
    licenseNumber: "",
    plateNumber: "",
    panNumber: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  // If user already signed in, redirect to their dashboard
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' })
        if (!mounted) return
        if (!res.ok) return
        const j = await res.json()
        const user = j?.user
        const role = user?.user_type ?? user?.userType ?? null
        if (role === 'owner' || role === 'manager') {
          router.replace('/owner/dashboard')
        } else if (role === 'driver') {
          router.replace('/driver/dashboard')
        }
      } catch (e) {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("") // Clear error on input change
  }

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError("Full name is required")
      return false
    }
    if (formData.name.trim().length < 2) {
      setError("Full name must be at least 2 characters")
      return false
    }
    if (!formData.email.trim()) {
      setError("Email is required")
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required")
      return false
    }
    const phoneRegex = /^[+]?[0-9]{10,15}$/
    if (!phoneRegex.test(formData.phone.replace(/[\s()-]/g, ''))) {
      setError("Please enter a valid phone number (10-15 digits)")
      return false
    }
    return true
  }

  const validateStep2 = () => {
    // All 3 documents are required
    if (!formData.licenseNumber.trim()) {
      setError("License number is required")
      return false
    }
    if (!formData.plateNumber.trim()) {
      setError("Car plate number is required")
      return false
    }
    if (!formData.panNumber.trim()) {
      setError("PAN ID is required")
      return false
    }
    // Basic validation
    if (formData.licenseNumber.trim().length < 5) {
      setError("License number must be at least 5 characters")
      return false
    }
    if (formData.plateNumber.trim().length < 4) {
      setError("Plate number must be at least 4 characters")
      return false
    }
    if (formData.panNumber.trim().length < 10) {
      setError("PAN ID must be at least 10 characters")
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!formData.password) {
      setError("Password is required")
      return false
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }
    return true
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      setError("")
    }
  }

  async function handleComplete() {
    if (!validateStep3()) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.name,
          phone: formData.phone,
          userType: 'driver',
          // Document fields
          licenseNumber: formData.licenseNumber,
          plateNumber: formData.plateNumber,
          panNumber: formData.panNumber,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to register')
      }

      // Navigate to driver dashboard (session is now in cookie)
      // Small delay to ensure session cookie is set
      setTimeout(() => {
        router.push('/driver/dashboard')
      }, 100)
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary via-background to-secondary/20">

      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="bg-card border border-border rounded-xl p-6 grid md:grid-cols-2 gap-6 items-stretch">
          <div className="hidden md:flex flex-col items-center justify-center gap-6 p-6">
            <Image src="/logo.png" alt="Parko" width={120} height={120} />
            <h2 className="text-2xl font-bold">Welcome to Parko</h2>
            <p className="text-sm text-muted-foreground text-center">Fast parking, easy booking. Create a driver account and verify documents to start booking.</p>
            <img src="/car.gif" alt="car" className="w-full rounded-lg shadow-lg" />
          </div>

          <div className="p-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">Driver Registration</h1>
            <p className="text-muted-foreground mb-6">Step {step} of 3</p>

            {/* Progress Bar */}
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-border'}`} />
              ))}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Form content */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Full Name *</label>
                  <Input name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" className="w-full" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Email *</label>
                  <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" className="w-full" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Phone Number *</label>
                  <Input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+1 555-000-0000" className="w-full" />
                  <p className="text-xs text-muted-foreground mt-1">10-15 digits, may start with +</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">Please provide all 3 documents to complete verification</p>
                
                {/* License Number */}
                <div className="border border-border rounded-lg p-4 bg-card">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-primary" />
                    </div>
                    <label className="text-sm font-semibold text-foreground">License Number *</label>
                  </div>
                  <Input 
                    name="licenseNumber" 
                    value={formData.licenseNumber} 
                    onChange={handleChange} 
                    placeholder="Enter license number" 
                    className="w-full" 
                  />
                </div>

                {/* Plate Number */}
                <div className="border border-border rounded-lg p-4 bg-card">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-primary" />
                    </div>
                    <label className="text-sm font-semibold text-foreground">Car Plate Number *</label>
                  </div>
                  <Input 
                    name="plateNumber" 
                    value={formData.plateNumber} 
                    onChange={handleChange} 
                    placeholder="Enter plate number" 
                    className="w-full" 
                  />
                </div>

                {/* PAN Number */}
                <div className="border border-border rounded-lg p-4 bg-card">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-primary" />
                    </div>
                    <label className="text-sm font-semibold text-foreground">PAN ID *</label>
                  </div>
                  <Input 
                    name="panNumber" 
                    value={formData.panNumber} 
                    onChange={handleChange} 
                    placeholder="Enter PAN number" 
                    className="w-full" 
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Password *</label>
                  <Input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full" />
                  <p className="text-xs text-muted-foreground mt-1">At least 8 characters</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Confirm Password *</label>
                  <Input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="w-full" />
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              {step > 1 ? (
                <>
                  <Button variant="outline" onClick={handleBack} disabled={loading} className="px-6">Previous</Button>
                  <div className="flex-1">
                    {step < 3 ? (
                      <Button onClick={handleNext} disabled={loading} className="w-full">Next</Button>
                    ) : (
                      <Button onClick={handleComplete} disabled={loading} className="w-full">{loading ? 'Creating Account...' : 'Create Account'}</Button>
                    )}
                  </div>
                </>
              ) : (
                <>{step < 3 ? (
                  <Button onClick={handleNext} disabled={loading} className="w-full">Next</Button>
                ) : (
                  <Button onClick={handleComplete} disabled={loading} className="w-full">{loading ? 'Creating Account...' : 'Create Account'}</Button>
                )}</>
              )}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">Already have an account? <Link href="/login" className="text-primary font-semibold hover:underline">Sign In</Link></p>
          </div>
        </div>
      </div>
    </main>
  )
}
