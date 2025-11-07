"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ManagerSignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const email = searchParams.get('email')
    const password = searchParams.get('password')
    const token = searchParams.get('token')

    if (!email || !password || !token) {
      setStatus('error')
      setMessage('Invalid invitation link. Missing credentials.')
      return
    }

    // Auto-login the manager
    const autoLogin = async () => {
      try {
        setStatus('loading')
        setMessage('Setting up your manager account...')

        // Login with the provided credentials
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          credentials: 'include',
        })

        if (!loginRes.ok) {
          const errorData = await loginRes.json()
          throw new Error(errorData.error || 'Failed to login')
        }

        const loginData = await loginRes.json()
        const user = loginData.user

        if (user?.user_type !== 'manager') {
          throw new Error('Invalid account type')
        }

        setStatus('success')
        setMessage('Welcome to Parko! Redirecting to your manager dashboard...')

        // Redirect to manager dashboard after a short delay
        setTimeout(() => {
          router.push('/owner/dashboard') // Managers use the owner dashboard interface
        }, 2000)

      } catch (err: any) {
        setStatus('error')
        setMessage(err.message || 'Failed to set up your account')
      }
    }

    autoLogin()
  }, [searchParams, router])

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-green-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center shadow-lg">
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" alt="Parko" width={80} height={80} />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Manager Invitation</h1>
        <p className="text-muted-foreground mb-6">Setting up your Parko manager account</p>

        <div className="flex justify-center mb-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <p className="text-sm text-green-700 font-medium">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <p className="text-sm text-destructive font-medium">{message}</p>
            </div>
          )}
        </div>

        {status === 'error' && (
          <div className="space-y-4">
            <Button 
              onClick={() => router.push('/login')} 
              variant="outline" 
              className="w-full"
            >
              Go to Login
            </Button>
            <Button 
              onClick={() => router.push('/')} 
              className="w-full"
            >
              Go to Home
            </Button>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              🎉 Your manager account is ready! You can now manage parking spaces and view analytics.
            </p>
          </div>
        )}

        {status === 'loading' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Please wait while we set up your account and log you in automatically.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}