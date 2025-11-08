"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // If already signed in, redirect to role dashboard
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
    setFormData((p) => ({ ...p, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Login failed')

      const user = json.user
      // user_type can be 'driver' | 'owner' | 'manager'
      const role = user?.user_type || user?.userType || 'driver'
      if (role === 'owner' || role === 'manager') {
        router.push('/owner/dashboard')
      } else {
        router.push('/driver/dashboard')
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed')
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
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-sm text-muted-foreground text-center">Sign in to access bookings and profile</p>
            <img src="/car.gif" alt="car" className="w-full rounded-lg shadow-lg" />
          </div>

          <div className="p-4 flex items-center">
            <div className="w-full">
              <h1 className="text-3xl font-bold text-foreground mb-2">Sign In</h1>
              <p className="text-muted-foreground mb-6">Sign in with your email and password</p>

              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Email</label>
                  <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" className="w-full" required />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block">Password</label>
                  <Input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full" required />
                </div>

                <Button type="submit" className="w-full py-6" disabled={loading}>{loading ? 'Signing In...' : 'Sign In'}</Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">Don't have an account? <Link href="/driver/signup" className="text-primary font-semibold hover:underline">Sign Up</Link></p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
