import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Image from "next/image"
import "./globals.css"
import Header from '@/components/header'

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
        <Header />

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
