"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'

interface User {
  userId: string
  email: string
  userType: 'driver' | 'owner' | 'manager'
  fullName: string
}

export default function HeaderAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  async function fetchSession() {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        setUser(json?.user ?? null)
      } else {
        setUser(null)
      }
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchSession()
    // also refetch when tab becomes visible
    const onVis = () => { if (document.visibilityState === 'visible') fetchSession() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  // Refetch on route change
  useEffect(() => {
    // only refetch after initial mount transition
    if (!loading) fetchSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      
      // Clear user state and redirect to home
      setUser(null)
      router.push('/')
      // force a revalidation of header state
      setTimeout(() => fetchSession(), 50)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-20 h-8 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/driver/login" className="text-sm text-foreground/80 hover:text-foreground">Sign in</Link>
        <Link href="/driver/signup" className="ml-2 inline-flex items-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95">Get started</Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2">
        <div className="text-sm text-foreground/90">{user.fullName || user.email}</div>
      </div>
      <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
    </div>
  )
}
