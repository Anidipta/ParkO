import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Image from "next/image"
import Link from "next/link"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Parko - Smart Parking Management",
  description: "Find, book, and manage parking spaces with Parko",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <header className="sticky top-0 z-50 w-full bg-white/60 dark:bg-black/60 backdrop-blur-sm border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="Parko" width={44} height={44} priority />
              <span className="text-lg font-semibold text-foreground">Parko</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm text-foreground/80 hover:text-foreground">Home</Link>
              <Link href="/map" className="text-sm text-foreground/80 hover:text-foreground">Map</Link>
              <Link href="/owner/dashboard" className="text-sm text-foreground/80 hover:text-foreground">For Owners</Link>
              <Link href="/driver/dashboard" className="text-sm text-foreground/80 hover:text-foreground">For Drivers</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/driver/login" className="text-sm text-foreground/80 hover:text-foreground">Sign in</Link>
              <Link href="/driver/signup" className="ml-2 inline-flex items-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95">Get started</Link>
            </div>
          </div>
        </header>

        <main className="running-gradient" style={{ minHeight: "calc(100vh - 72px)" }}>
          {children}
        </main>

        <footer className="w-full border-t border-border bg-background/80">
          <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Parko" width={36} height={36} />
              <div>
                <div className="text-sm font-semibold text-foreground">Parko</div>
                <div className="text-xs text-muted-foreground">Smart parking management</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} Parko — Built with care</div>
          </div>
        </footer>

        <Analytics />
      </body>
    </html>
  )
}
