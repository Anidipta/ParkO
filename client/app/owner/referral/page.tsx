"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Copy, Share2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ReferralPage() {
  const [copied, setCopied] = useState(false)
  const [managers, setManagers] = useState<any[]>([])
  const [loadingManagers, setLoadingManagers] = useState(true)

  const referralLink = "https://parko.app/join/mgr_xyz789abc"

  // fetch all managers for this owner
  useEffect(() => {
    const loadManagers = async () => {
      try {
        // First get owner's spaces, then get managers for each space
        const spacesRes = await fetch('/api/auth/session')
        if (!spacesRes.ok) return
        
        const sessionJson = await spacesRes.json()
        const userId = sessionJson?.user?.userId ?? sessionJson?.user?.user_id
        if (!userId) return

        const ownersSpacesRes = await fetch(`/api/parking?owner_id=${encodeURIComponent(userId)}`)
        if (!ownersSpacesRes.ok) return
        
        const spacesJson = await ownersSpacesRes.json()
        const spaces = spacesJson.data || []
        
        const allManagers: any[] = []
        for (const space of spaces) {
          const managersRes = await fetch(`/api/owners/managers?space_id=${space.space_id}`)
          if (managersRes.ok) {
            const managersJson = await managersRes.json()
            const spaceManagers = (managersJson.data || []).map((mgr: any) => ({
              id: mgr.manager_id,
              name: mgr.users?.full_name || 'Unknown',
              email: mgr.users?.email || 'No email',
              space: space.space_name,
              status: mgr.invite_status === 'accepted' ? 'Active' : 'Pending',
              joinDate: mgr.assigned_at ? new Date(mgr.assigned_at).toLocaleDateString() : 'Unknown',
            }))
            allManagers.push(...spaceManagers)
          }
        }
        
        setManagers(allManagers)
      } catch (err) {
        console.warn('Failed to load managers:', err)
      } finally {
        setLoadingManagers(false)
      }
    }
    loadManagers()
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/owner/dashboard">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Manager Referrals</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Referral Card */}
        <div className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-2">Invite Managers</h2>
          <p className="opacity-90 mb-6">
            Share your unique referral link to invite sub-managers to handle your parking spaces.
          </p>

          <div className="bg-secondary-foreground/20 rounded-lg p-4 flex items-center justify-between mb-4">
            <code className="font-mono text-sm font-semibold break-all">{referralLink}</code>
            <button
              onClick={handleCopy}
              className="ml-2 p-2 hover:bg-secondary-foreground/30 rounded transition-colors flex-shrink-0"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {copied && <p className="text-sm font-semibold">Link copied to clipboard!</p>}

          <div className="flex gap-2 mt-4">
            <Button variant="secondary" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Managers List */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Active Managers ({managers.length})
          </h3>

          <div className="space-y-3">
            {loadingManagers ? (
              // Loading state
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-card border border-border rounded-lg p-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : managers.length === 0 ? (
              // Empty state
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <p className="text-muted-foreground">No managers assigned yet. Share your referral link to invite managers!</p>
              </div>
            ) : (
              // Managers list
              managers.map((mgr) => (
              <div key={mgr.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-foreground">{mgr.name}</h4>
                    <p className="text-xs text-muted-foreground">{mgr.email}</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                    {mgr.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-muted-foreground">Managing: {mgr.space}</p>
                  <p className="text-muted-foreground">Joined {mgr.joinDate}</p>
                </div>
              </div>
              ))
            )}
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-4">How It Works</h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li className="flex gap-3">
              <span className="flex-shrink-0 font-bold">1.</span>
              <span>Share your unique referral link with potential managers</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 font-bold">2.</span>
              <span>They sign up using the link and verify their identity</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 font-bold">3.</span>
              <span>Assign them to specific parking spaces to manage</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 font-bold">4.</span>
              <span>They receive OTP verification notifications for their assigned spaces</span>
            </li>
          </ol>
        </div>
      </div>
    </main>
  )
}
