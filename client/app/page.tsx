"use client"

import { useState } from "react"
import Link from "next/link"
import { Car, MapPin, Users, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [userType, setUserType] = useState<"driver" | "owner" | null>(null)

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary via-background to-secondary/20">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Parko</h1>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
            <Button size="sm">Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-foreground mb-4 text-balance">
            Smart Parking, <span className="text-secondary">Simplified</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Find, book, and manage parking spaces in real-time. For drivers seeking convenience and parking owners
            maximizing revenue.
          </p>
        </div>

        {/* User Type Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link href="/driver/signup" className="group">
            <div className="bg-card border border-border rounded-xl p-8 hover:border-primary transition-all hover:shadow-lg cursor-pointer">
              <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Car className="w-7 h-7 text-primary group-hover:text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">For Drivers</h3>
              <p className="text-muted-foreground mb-4">
                Find nearby parking, book instantly, and enjoy seamless entry with OTP verification.
              </p>
              <div className="flex items-center text-primary font-semibold group-hover:gap-2 transition-all">
                Get Started <span className="ml-2">→</span>
              </div>
            </div>
          </Link>

          <Link href="/owner/signup" className="group">
            <div className="bg-card border border-border rounded-xl p-8 hover:border-secondary transition-all hover:shadow-lg cursor-pointer">
              <div className="w-14 h-14 bg-secondary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                <Users className="w-7 h-7 text-secondary group-hover:text-secondary-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">For Parking Owners</h3>
              <p className="text-muted-foreground mb-4">
                List your spaces, manage availability in real-time, and track earnings with analytics.
              </p>
              <div className="flex items-center text-secondary font-semibold group-hover:gap-2 transition-all">
                Get Started <span className="ml-2">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="bg-card border border-border rounded-lg p-6">
            <MapPin className="w-8 h-8 text-primary mb-3" />
            <h4 className="font-bold text-foreground mb-2">Live Map View</h4>
            <p className="text-sm text-muted-foreground">Discover parking spaces within 200m of your location</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <TrendingUp className="w-8 h-8 text-secondary mb-3" />
            <h4 className="font-bold text-foreground mb-2">Real-time Analytics</h4>
            <p className="text-sm text-muted-foreground">Track usage, earnings, and performance metrics</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <Users className="w-8 h-8 text-primary mb-3" />
            <h4 className="font-bold text-foreground mb-2">Secure Verification</h4>
            <p className="text-sm text-muted-foreground">License and identity verification for trust</p>
          </div>
        </div>
      </section>
    </main>
  )
}
