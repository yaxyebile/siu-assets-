"use client"

import { useEffect, useRef, useState } from "react"

interface QRCodeGeneratorProps {
  value: string
  size?: number
}

export function QRCodeGenerator({ value, size = 150 }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageUrl, setImageUrl] = useState<string>("")

  useEffect(() => {
    if (!value) return

    // Use Google Charts API to generate QR code
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`
    setImageUrl(qrUrl)
  }, [value, size])

  if (!value) {
    return (
      <div
        className="border border-border rounded bg-muted flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-muted-foreground text-xs">No Data</span>
      </div>
    )
  }

  return (
    <img
      src={imageUrl || "/placeholder.svg"}
      alt={`QR Code for ${value}`}
      width={size}
      height={size}
      className="border border-border rounded"
      crossOrigin="anonymous"
    />
  )
}
