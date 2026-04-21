'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { QrCode, Camera, X, Check } from 'lucide-react'

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanned, setScanned] = useState(false)
  const [loading, setLoading] = useState(true)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setLoading(false)

        // Start scanning loop
        requestAnimationFrame(scanFrame)
      }
    } catch (err) {
      setError(
        'Camera access denied. Please allow camera permissions or use file import instead.'
      )
      setLoading(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current || scanned) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanFrame)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    // QR code detection would go here
    // For now, this is a placeholder
    // In production, use a library like jsQR

    requestAnimationFrame(scanFrame)
  }

  const handleSimulatedScan = () => {
    // Simulate a scan for demo purposes
    const sampleData = btoa(JSON.stringify({
      type: 'signed_transaction',
      data: 'sample_signed_transaction_data'
    }))
    onScan(sampleData)
    setScanned(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg border-purple-500/20 bg-black/40 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-purple-400" />
              <CardTitle className="text-white">Scan QR Code</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-gray-400">
            Point your camera at a QR code to scan a signed transaction
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Camera className="h-12 w-12 text-purple-400 animate-pulse" />
              <p className="mt-4 text-sm text-gray-400">Starting camera...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/20 p-4 text-center">
              <p className="text-sm text-red-300">{error}</p>
              <p className="mt-2 text-xs text-gray-400">
                Try using the file import option instead
              </p>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-black/50">
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-48 w-48 rounded-lg border-2 border-purple-400/50" />
                </div>
              </div>

              <div className="text-center text-sm text-gray-400">
                <p>Position the QR code within the frame</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSimulatedScan} className="flex-1">
                  Simulate Scan (Demo)
                </Button>
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {scanned && (
            <div className="rounded-lg bg-green-500/20 p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <Check className="h-5 w-5 text-green-400" />
                <p className="text-sm text-green-300">QR code scanned successfully!</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
