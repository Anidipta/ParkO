"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function InviteAcceptPage() {
  const params = useSearchParams()
  const router = useRouter()
  const [token, setToken] = useState<string>('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const t = params.get('token') || ''
    const e = params.get('email') || ''
    setToken(t)
    if (e) setEmail(e)
  }, [params])

  const onSubmit = async () => {
    setError('')
    if (!fullName || !email || !password) { setError('All fields are required'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/owners/invite/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, full_name: fullName, email, password }) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error || `Failed (${res.status})`)
      setSuccess(true)
    } catch (e: any) {
      setError(e.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-2 text-foreground">Accept Manager Invitation</h1>
        <p className="text-sm text-muted-foreground mb-6">Create your manager account to access the owner's space.</p>
        {success ? (
          <div className="space-y-4">
            <div className="p-4 border border-green-200 bg-green-50 rounded text-green-800">Invitation accepted. You can now log in.</div>
            <Link href="/owner/login"><Button className="w-full">Go to Login</Button></Link>
          </div>
        ) : (
        <div className="space-y-4">
          {!!error && <div className="p-3 border border-red-200 bg-red-50 rounded text-red-800 text-sm">{error}</div>}
          <div>
            <label className="text-sm text-foreground font-medium mb-1 block">Full Name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div>
            <label className="text-sm text-foreground font-medium mb-1 block">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
          </div>
          <div>
            <label className="text-sm text-foreground font-medium mb-1 block">Password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a strong password" />
          </div>
          <div>
            <label className="text-sm text-foreground font-medium mb-1 block">Confirm Password</label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" />
          </div>
          <Button onClick={onSubmit} disabled={loading} className="w-full">{loading ? 'Submitting...' : 'Create Account & Accept'}</Button>
        </div>
        )}
      </div>
    </main>
  )
}
