"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface User {
  userId: string
  email: string
  userType: 'driver' | 'owner' | 'manager'
  fullName: string
}

export default function Header() {
  const [open, setOpen] = useState(false)
  const [drop, setDrop] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  async function fetchSession() {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' })
      if (res.ok) {
        const json = await res.json()
        setUser(json?.user ?? null)
      } else {
        setUser(null)
      }
    } catch (e) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSession()
    const onVis = () => { if (document.visibilityState === 'visible') fetchSession() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!loading) fetchSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      setUser(null)
      router.push('/')
      setTimeout(() => fetchSession(), 50)
    } catch (e) {
      console.error('Logout failed', e)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/60 dark:bg-black/60 backdrop-blur-sm border-b border-border">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image src="/logo.png" alt="Parko" width={40} height={40} priority />
            <span className="text-lg font-semibold text-foreground">Parko</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm text-foreground/80 hover:text-foreground">Home</Link>
          <Link href="/driver/map" className="text-sm text-foreground/80 hover:text-foreground">Map</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="w-24 h-8 bg-muted animate-pulse rounded" />
          ) : !user ? (
            <div className="flex items-center gap-3">
              <Link href="/driver/login" className="text-sm text-foreground/80 hover:text-foreground">Sign in</Link>

              <div className="relative">
                <button onMouseEnter={() => setDrop(true)} onMouseLeave={() => setDrop(false)} className="inline-flex items-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95">
                  Get started
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                {drop && (
                  <div onMouseEnter={() => setDrop(true)} onMouseLeave={() => setDrop(false)} className="absolute right-0 mt-2 w-44 bg-card border border-border rounded shadow-lg">
                    <Link href="/owner/signup" className="block px-3 py-2 text-sm hover:bg-muted">As Owner</Link>
                    <Link href="/driver/signup" className="block px-3 py-2 text-sm hover:bg-muted">As Driver</Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <div className="text-sm text-foreground/90">{user.fullName || user.email}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
            </div>
          )}
        </div>

        <div className="md:hidden">
          <button onClick={() => setOpen((s) => !s)} className="p-2 rounded-md hover:bg-muted">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95">
          <div className="px-4 py-3 space-y-3">
            <Link href="/" className="block px-2 py-2 rounded hover:bg-muted">Home</Link>
            <Link href="/driver/map" className="block px-2 py-2 rounded hover:bg-muted">Map</Link>
            <Link href="/owner/dashboard" className="block px-2 py-2 rounded hover:bg-muted">For Owners</Link>
            <Link href="/driver/dashboard" className="block px-2 py-2 rounded hover:bg-muted">For Drivers</Link>

            <div className="pt-2 border-t border-border space-y-2">
              {loading ? (
                <div className="w-full h-8 bg-muted animate-pulse rounded" />
              ) : !user ? (
                <>
                  <Link href="/driver/login" className="block px-2 py-2 rounded hover:bg-muted">Sign in</Link>
                  <Link href="/owner/signup" className="block px-2 py-2 rounded bg-[var(--primary)] text-white">Get started as Owner</Link>
                  <Link href="/driver/signup" className="block px-2 py-2 rounded bg-[var(--primary)] text-white">Get started as Driver</Link>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{user.fullName || user.email}</div>
                    <div className="text-xs text-muted-foreground">{user.userType}</div>
                  </div>
                  <Button variant="ghost" onClick={handleLogout}>Logout</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
