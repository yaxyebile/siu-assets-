"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { QRCodeGenerator } from "@/components/qr-code-generator"
import { Printer, Download } from "lucide-react"
import type { Asset } from "@/services/api-service"

interface AssetQRCardProps {
  asset: Asset
  onClose?: () => void
}

export function AssetQRCard({ asset, onClose }: AssetQRCardProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const categoryName = (asset.category && typeof asset.category === 'object') ? asset.category.name : String(asset.category || "")
    const departmentName = (asset.department && typeof asset.department === 'object') ? asset.department.name : String(asset.department || "")

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Asset QR Code - ${asset.serialNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .qr-card {
              border: 2px solid #000;
              padding: 20px;
              text-align: center;
              max-width: 300px;
            }
            .serial-number {
              font-size: 24px;
              font-weight: bold;
              margin: 15px 0 5px;
              letter-spacing: 2px;
            }
            .asset-name {
              font-size: 14px;
              color: #666;
              margin-bottom: 10px;
            }
            .category {
              font-size: 12px;
              color: #888;
              margin-bottom: 5px;
            }
            .department {
              font-size: 12px;
              color: #888;
            }
            canvas {
              border: 1px solid #ddd;
            }
            @media print {
              body { padding: 0; }
              .qr-card { border-width: 1px; }
            }
          </style>
        </head>
        <body>
          <div class="qr-card">
            ${printContent.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              }
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownload = () => {
    const canvas = printRef.current?.querySelector("canvas")
    if (!canvas) return

    const link = document.createElement("a")
    link.download = `QR-${asset.serialNumber}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="pt-6">
        <div ref={printRef} className="text-center">
          <QRCodeGenerator value={asset.serialNumber} size={180} />
          <p className="serial-number text-2xl font-bold mt-4 tracking-widest">{asset.serialNumber}</p>
          <p className="asset-name text-sm text-muted-foreground">{asset.name}</p>
          <p className="category text-xs text-muted-foreground mt-1">
            {(asset.category && typeof asset.category === 'object') ? asset.category.name : String(asset.category || "")}
          </p>
          <p className="department text-xs text-muted-foreground">
            {(asset.department && typeof asset.department === 'object') ? asset.department.name : String(asset.department || "")}
          </p>
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={handlePrint} className="flex-1 gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex-1 gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>

        {onClose && (
          <Button onClick={onClose} variant="ghost" className="w-full mt-2">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
