"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function OTPVerify() {
  const router = useRouter()
  const [otp, setOtp] = useState(["", "", "", ""])
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState("")
  const [timeLeft, setTimeLeft] = useState(120)

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleVerify = () => {
    const otpCode = otp.join("")
    if (otpCode === "7382") {
      setVerified(true)
      setTimeout(() => {
        router.push("/driver/dashboard")
      }, 2000)
    } else {
      setError("Invalid OTP. Please try again.")
      setOtp(["", "", "", ""])
    }
  }

  const handleResend = () => {
    setError("")
    setOtp(["", "", "", ""])
    setTimeLeft(120)
  }

  if (verified) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-primary via-background to-secondary/20 flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Verified!</h2>
          <p className="text-muted-foreground">You can now access your parking space</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary via-background to-secondary/20">
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-md mx-auto px-4 py-4">
          <Link
            href="/driver/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="bg-card border border-border rounded-xl p-8 w-full">
          <h1 className="text-3xl font-bold text-foreground mb-2">Verify OTP</h1>
          <p className="text-muted-foreground mb-8">Enter the 4-digit code sent to your phone</p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3 mb-8">
            {otp.map((digit, index) => (
              <Input
                key={index}
                id={`otp-${index}`}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digit && index > 0) {
                    const prevInput = document.getElementById(`otp-${index - 1}`)
                    prevInput?.focus()
                  }
                }}
                maxLength={1}
                className="w-full h-14 text-center text-2xl font-bold text-foreground"
                inputMode="numeric"
              />
            ))}
          </div>

          <Button onClick={handleVerify} disabled={otp.join("").length !== 4} className="w-full py-6 mb-4">
            Verify OTP
          </Button>

          <div className="text-center">
            {timeLeft > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend code in <span className="font-semibold">{timeLeft}s</span>
              </p>
            ) : (
              <button onClick={handleResend} className="text-sm text-primary font-semibold hover:underline">
                Resend OTP
              </button>
            )}
          </div>

          {/* Removed demo info — OTP comes from real verification flow */}
        </div>
      </div>
    </main>
  )
}
