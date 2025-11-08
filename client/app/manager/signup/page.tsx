"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Loader2 } from "lucide-react"
import Image from "next/image"

function ManagerSignupContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const inviteToken = searchParams.get("token")
  const inviteEmail = searchParams.get("email")

  const [formData, setFormData] = useState({
    name: "",
    email: inviteEmail || "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (inviteEmail) {
      setFormData(prev => ({ ...prev, email: inviteEmail }))
    }
  }, [inviteEmail])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError("")
  }

  const validate = () => {
    if (!formData.name.trim()) {
      setError("Full name is required")
      return false
    }
    if (!formData.email.trim()) {
      setError("Email is required")
      return false
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required")
      return false
    }
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

  async function handleComplete() {
    if (!validate()) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.name,
          phone: formData.phone,
          userType: "manager",
          inviteToken,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || "Failed to register")
      }

      setTimeout(() => {
        router.push("/owner/dashboard")
      }, 100)
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.")
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
            <h2 className="text-2xl font-bold">Welcome Manager</h2>
            <p className="text-sm text-muted-foreground text-center">
              Complete your manager account setup to access the dashboard.
            </p>
          </div>

          <div className="p-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">Manager Registration</h1>
            <p className="text-muted-foreground mb-6">Complete your profile</p>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Full Name *</label>
                <Input name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Email *</label>
                <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" disabled={!!inviteEmail} />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Phone Number *</label>
                <Input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+1 555-000-0000" />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Password *</label>
                <Input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
                <p className="text-xs text-muted-foreground mt-1">At least 8 characters</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Confirm Password *</label>
                <Input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" />
              </div>
            </div>

            <Button onClick={handleComplete} disabled={loading} className="w-full mt-6">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Account...</> : "Create Account"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function ManagerSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ManagerSignupContent />
    </Suspense>
  )
}
