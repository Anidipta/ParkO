"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import HeaderAuth from './header-auth'

export default function Header() {
  const [open, setOpen] = useState(false)

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
          <Link href="/owner/dashboard" className="text-sm text-foreground/80 hover:text-foreground">For Owners</Link>
          <Link href="/driver/dashboard" className="text-sm text-foreground/80 hover:text-foreground">For Drivers</Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <HeaderAuth />
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
            <div className="pt-2 border-t border-border">
              <HeaderAuth />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
