"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, CameraOff, RefreshCw } from "lucide-react"

interface QRScannerProps {
  onScan: (value: string) => void
  onError?: (error: string) => void
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)

  const [isScanning, setIsScanning] = useState(false)
  const [hasCamera, setHasCamera] = useState(true)
  const [cameraError, setCameraError] = useState("")
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")

  const startCamera = async () => {
    setCameraError("")

    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute("playsinline", "true")
        await videoRef.current.play()
        setIsScanning(true)
        setHasCamera(true)
        startScanning()
      }
    } catch (err: any) {
      console.log("Camera error:", err)
      setHasCamera(false)
      setCameraError(err.message || "Camera ma shaqeyneyso")
      onError?.(err.message || "Camera ma shaqeyneyso")
    }
  }

  const stopCamera = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsScanning(false)
  }

  const switchCamera = () => {
    stopCamera()
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
  }

  useEffect(() => {
    if (facingMode) {
      startCamera()
    }
  }, [facingMode])

  const startScanning = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas) return

    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) return

    const scan = async () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Try BarcodeDetector API (available in Chrome, Edge, Opera)
        if ("BarcodeDetector" in window) {
          try {
            const barcodeDetector = new (window as any).BarcodeDetector({
              formats: ["qr_code"],
            })
            const barcodes = await barcodeDetector.detect(canvas)

            if (barcodes.length > 0) {
              const qrValue = barcodes[0].rawValue
              stopCamera()
              onScan(qrValue)
              return
            }
          } catch (err) {
            // Continue scanning
          }
        }
      }

      animationRef.current = requestAnimationFrame(scan)
    }

    scan()
  }

  useEffect(() => {
    startCamera()

    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanner overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner markers */}
            <div className="absolute inset-[15%] border-2 border-primary rounded-lg">
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
            </div>

            {/* Scanning line animation */}
            <div
              className="absolute left-[15%] right-[15%] top-[15%] h-0.5 bg-primary/80 animate-pulse"
              style={{
                animation: "scanLine 2s ease-in-out infinite",
              }}
            />
          </div>
        )}

        {/* Camera error state */}
        {!hasCamera && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
            <CameraOff className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground text-center px-4">{cameraError || "Camera ma shaqeyneyso"}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        {isScanning ? (
          <>
            <Button onClick={stopCamera} variant="outline" className="gap-2 bg-transparent">
              <CameraOff className="h-4 w-4" />
              Stop
            </Button>
            <Button onClick={switchCamera} variant="outline" className="gap-2 bg-transparent">
              <RefreshCw className="h-4 w-4" />
              Switch Camera
            </Button>
          </>
        ) : (
          <Button onClick={startCamera} className="gap-2">
            <Camera className="h-4 w-4" />
            Start Camera
          </Button>
        )}
      </div>

      {/* Scanning status */}
      {isScanning && (
        <p className="text-center text-sm text-muted-foreground animate-pulse">QR code-ka dhig camera-ga hortiisa...</p>
      )}

      <style jsx>{`
        @keyframes scanLine {
          0%, 100% { top: 15%; }
          50% { top: 80%; }
        }
      `}</style>
    </div>
  )
}
