"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from 'next/image'
import { ArrowLeft, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function OwnerLogin() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!formData.email || !formData.password) {
      setError("Please enter both email and password")
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Login failed')
      }

      // Session is now stored in httpOnly cookie
      router.push('/owner/dashboard')
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-secondary via-background to-primary/20">
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="bg-card border border-border rounded-xl p-6 grid md:grid-cols-2 gap-6 items-stretch">
          <div className="hidden md:flex flex-col items-center justify-center gap-6 p-6">
            <Image src="/logo.png" alt="Parko" width={120} height={120} />
            <h2 className="text-2xl font-bold">Owner Portal</h2>
            <p className="text-sm text-muted-foreground text-center">Sign in to manage your parking spaces and earnings</p>
            <img src="/car.gif" alt="car" className="w-full rounded-lg shadow-lg" />
          </div>

          <div className="p-4 flex items-center">
            <div className="w-full">
              <h1 className="text-3xl font-bold text-foreground mb-2">Owner Sign In</h1>
              <p className="text-muted-foreground mb-6">Manage your parking spaces and earnings</p>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Email</label>
                  <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="owner@parkingbiz.com" className="w-full" required />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Password</label>
                  <Input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full" required />
                </div>

                <Button type="submit" className="w-full py-6" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Don't have an account? <Link href="/owner/signup" className="text-secondary font-semibold hover:underline">Sign Up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
