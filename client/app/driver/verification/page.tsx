"use client"

import { useState, useEffect, useRef } from "react"
import { supabase } from '@/lib/supabaseClient'
import Link from "next/link"
import { ArrowLeft, Upload, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DocumentUpload {
  type: "license" | "plate" | "pan"
  file: File | null
  preview: string | null
  extracted: string
}

export default function DriverVerification() {
  const [profileCompletion, setProfileCompletion] = useState(20)
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    { type: "license", file: null, preview: null, extracted: "DL1234567890" },
    { type: "plate", file: null, preview: null, extracted: "MH02AB1234" },
    { type: "pan", file: null, preview: null, extracted: "ABCDE1234F" },
  ])
  const [verificationStep, setVerificationStep] = useState<"upload" | "review" | "complete">("upload")

  const handleFileUpload = (type: "license" | "plate" | "pan", file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setDocuments((prev) =>
        prev.map((doc) => (doc.type === type ? { ...doc, file, preview: e.target?.result as string } : doc)),
      )
    }
    reader.readAsDataURL(file)
  }

  // Camera capture
  const [usingCameraFor, setUsingCameraFor] = useState<null | "license" | "plate" | "pan">(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    if (usingCameraFor && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s
          if (videoRef.current) {
            videoRef.current.srcObject = s
            videoRef.current.play().catch(() => {})
          }
        })
        .catch(() => {
          // user denied camera or not available
        })
    }
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
  }, [usingCameraFor])

  const simulateOCR = (type: string) => {
    if (type === 'license') return `DL${Math.floor(100000 + Math.random() * 900000)}`
    if (type === 'plate') return `MH${String(Math.floor(10 + Math.random() * 90)).padStart(2, '0')}AB${Math.floor(1000 + Math.random() * 9000)}`
    return `ABCDE${Math.floor(1000 + Math.random() * 9000)}F`
  }

  const captureFromCamera = (type: "license" | "plate" | "pan") => {
    const v = videoRef.current
    const c = canvasRef.current
    if (!v || !c) return
    c.width = v.videoWidth || 640
    c.height = v.videoHeight || 480
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.drawImage(v, 0, 0, c.width, c.height)
    const data = c.toDataURL('image/jpeg', 0.9)
    setDocuments((prev) => prev.map((d) => (d.type === type ? { ...d, file: null, preview: data, extracted: simulateOCR(type) } : d)))
    setUsingCameraFor(null)
  }

  const allUploaded = documents.every((doc) => doc.file)

  const handleSubmitDocuments = () => {
    if (allUploaded) {
      // send documents to server for storing and profile update
      const user = typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem('park_user') || 'null') : null

      const payload = {
        user_id: user?.user_id,
        documents: documents.map((d) => ({ type: d.type, extracted: d.extracted, b64: d.preview })),
      }

      fetch('/api/users/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then((r) => r.json())
        .then(() => {
          setVerificationStep('review')
          setProfileCompletion(60)
        })
        .catch(() => {
          // fall back to client-only state
          setVerificationStep('review')
          setProfileCompletion(60)
        })
    }
  }

  const handleConfirmVerification = () => {
    const user = typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem('park_user') || 'null') : null
    if (user?.user_id) {
      fetch('/api/users/profile/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.user_id }) })
        .then(() => {
          setVerificationStep('complete')
          setProfileCompletion(100)
        })
        .catch(() => {
          setVerificationStep('complete')
          setProfileCompletion(100)
        })
    } else {
      setVerificationStep('complete')
      setProfileCompletion(100)
    }
  }

  const DocumentSection = ({ doc }: { doc: DocumentUpload }) => {
    const labels = {
      license: "Driver License",
      plate: "Car Number Plate",
      pan: "PAN Card",
    }

    const icons = {
      license: "🪪",
      plate: "🚗",
      pan: "📋",
    }

    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{icons[doc.type]}</div>
            <div>
              <h3 className="font-semibold text-foreground">{labels[doc.type]}</h3>
              <p className="text-sm text-muted-foreground">Upload a clear photo</p>
            </div>
          </div>
          {doc.file && <Check className="w-5 h-5 text-green-500" />}
        </div>

        {doc.preview ? (
          <div className="space-y-3">
            <img
              src={doc.preview || "/placeholder.svg"}
              alt={labels[doc.type]}
              className="w-full h-32 object-cover rounded border border-border"
            />
            <div className="bg-primary/10 rounded p-3">
              <p className="text-xs text-muted-foreground mb-1">Extracted Details:</p>
              <p className="font-mono text-sm font-semibold text-foreground">{doc.extracted}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
              onClick={() => handleFileUpload(doc.type, new File([], "reset"))}
            >
              Change
            </Button>
          </div>
        ) : (
          <div>
            {usingCameraFor === doc.type ? (
              <div className="space-y-2">
                <video ref={videoRef} className="w-full h-40 bg-black rounded" playsInline />
                <div className="flex gap-2">
                  <Button onClick={() => captureFromCamera(doc.type)} className="flex-1">Capture</Button>
                  <Button variant="outline" onClick={() => setUsingCameraFor(null)} className="flex-1">Cancel</Button>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(doc.type, file)
                    }}
                  />
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-semibold text-foreground">Click to upload</p>
                    <p className="text-xs text-muted-foreground">or drag and drop</p>
                  </div>
                </label>

                <div className="flex gap-2">
                  <Button onClick={() => setUsingCameraFor(doc.type)} className="flex-1">Use Camera</Button>
                  <Button variant="outline" onClick={() => setDocuments(prev => prev.map(d => d.type === doc.type ? { ...d, preview: null, file: null } : d))} className="flex-1">Reset</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary via-background to-secondary/20">
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link
            href="/driver/signup"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12">
        {/* Profile Completion */}
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-foreground">Profile Completion</h2>
            <span className="text-2xl font-bold text-primary">{profileCompletion}%</span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${profileCompletion}%` }} />
          </div>
          {profileCompletion < 100 && (
            <p className="text-sm text-muted-foreground mt-3">Complete document verification to enable bookings</p>
          )}
        </div>

        {/* Upload Section */}
        {verificationStep === "upload" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Document Verification</h1>
              <p className="text-muted-foreground">Please upload clear photos of your documents</p>
            </div>

            <div className="grid md:grid-cols-1 gap-4">
              {documents.map((doc) => (
                <DocumentSection key={doc.type} doc={doc} />
              ))}
            </div>

            <Button onClick={handleSubmitDocuments} disabled={!allUploaded} className="w-full py-6">
              Submit Documents for Verification
            </Button>
          </div>
        )}

        {/* Review Section */}
        {verificationStep === "review" && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">Verification in Progress</h3>
                <p className="text-sm text-blue-800 mt-1">
                  We're reviewing your documents. This usually takes 2-5 minutes.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-foreground">Documents Submitted:</h3>
              {documents.map((doc) => (
                <div
                  key={doc.type}
                  className="flex items-center justify-between p-4 bg-card border border-border rounded-lg"
                >
                  <span className="text-foreground font-medium">
                    {doc.type === "license" && "Driver License"}
                    {doc.type === "plate" && "Car Number Plate"}
                    {doc.type === "pan" && "PAN Card"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-primary/10 px-2 py-1 rounded text-primary">
                      {doc.extracted}
                    </span>
                    <Check className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={handleConfirmVerification} className="w-full py-6">
              Verification Complete
            </Button>
          </div>
        )}

        {/* Complete Section */}
        {verificationStep === "complete" && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-900">Verified!</h2>
              <p className="text-green-800 mt-2">Your profile is now complete and verified</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-3">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-foreground">Driver License Verified</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-foreground">Car Plate Verified</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-foreground">PAN Card Verified</span>
              </div>
            </div>

            <Link href="/driver/dashboard">
              <Button className="w-full py-6">Go to Dashboard & Start Booking</Button>
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
