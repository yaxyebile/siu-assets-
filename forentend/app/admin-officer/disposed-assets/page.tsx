"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getAssets,
  getRequests,
  type Asset,
  type Request,
} from "@/services/api-service"
import {
  Trash2,
  Search,
  Eye,
  DollarSign,
  Package,
  Calendar,
  User,
  FileText,
  History
} from "lucide-react"

interface DisposedAssetInfo {
  asset: Asset
  disposalDate: string
  disposalBy: string
  originalValue: number
  reason?: string
  history: any[]
}

export default function DisposedAssetsPage() {
  const [disposedAssets, setDisposedAssets] = useState<DisposedAssetInfo[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAsset, setSelectedAsset] = useState<DisposedAssetInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getPropName = (prop: any) => {
    if (!prop) return "N/A"
    return prop.name || prop || "N/A"
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsData, requestsData] = await Promise.all([
          getAssets(),
          getRequests()
        ])

        const assets = Array.isArray(assetsData) ? assetsData : []
        const requests = Array.isArray(requestsData) ? requestsData : []

        // Filter for Status = 'disposed'
        const disposedList = assets.filter(a => a.status?.toLowerCase() === 'disposed')

        const mapped: DisposedAssetInfo[] = disposedList.map(asset => {
          // Find disposal request (status-change to disposed)
          // Handle populated vs string ID
          const assetId = asset.id || (asset as any)._id

          const disposalReq = requests.find(r => {
            const rAssetId = typeof r.assetId === 'object' ? (r.assetId as any)._id : r.assetId
            return rAssetId === assetId && r.newStatus === 'disposed' && r.status === 'approved'
          })

          // Find all history for this asset
          const historyRequests = requests.filter(r => {
            const rAssetId = typeof r.assetId === 'object' ? (r.assetId as any)._id : r.assetId
            return rAssetId === assetId
          })

          const damageHistory = (asset.damageReports || []).map((report: any) => ({
            type: 'damage-report',
            createdAt: report.date || new Date().toISOString(),
            details: `Damage Report: ${report.description || 'No description'} (${report.damageLevel})`,
            status: 'logged',
            newStatus: 'damaged'
          }))

          const fullHistory = [...historyRequests, ...damageHistory].sort((a: any, b: any) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime())

          const purchaseCost = Number(asset.purchaseCost) || 0
          const quantity = Number(asset.quantity) || 1
          const originalValue = purchaseCost * quantity

          return {
            asset,
            disposalDate: disposalReq?.updatedAt || disposalReq?.createdAt || asset.updatedAt || new Date().toISOString(),
            disposalBy: disposalReq?.reviewedByName || "Admin",
            originalValue,
            reason: disposalReq?.details || "Disposed via manual update or legacy",
            history: fullHistory
          }
        })

        // Sort by disposal date desc
        mapped.sort((a, b) => new Date(b.disposalDate).getTime() - new Date(a.disposalDate).getTime())

        setDisposedAssets(mapped)
      } catch (error) {
        console.error("Error loading disposed assets:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredAssets = disposedAssets.filter(
    (item) =>
      item.asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getPropName(item.asset.department).toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalLoss = disposedAssets.reduce((sum, item) => sum + item.originalValue, 0)

  return (
    <DashboardLayout allowedRoles={["admin", "adminOfficer"]}>
      <PageHeader
        title="Disposed Assets"
        description="Maamulka iyo warbixinta hantida la tuuray (Written Off Assets)"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Total Disposed Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalLoss)}</div>
            <p className="text-xs text-muted-foreground">Original purchase value written off</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{disposedAssets.length}</div>
            <p className="text-xs text-muted-foreground">Assets permanently removed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Disposed Assets List
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Info</TableHead>
                <TableHead>Category / Dept</TableHead>
                <TableHead>Disposal Date</TableHead>
                <TableHead>Disposed By</TableHead>
                <TableHead className="text-right">Original Value</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No disposed assets found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((item) => (
                  <TableRow key={item.asset.id}>
                    <TableCell>
                      <div className="font-medium">{item.asset.name}</div>
                      <div className="text-xs text-muted-foreground">{item.asset.serialNumber || "No SN"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{getPropName(item.asset.category)}</div>
                      <div className="text-xs text-muted-foreground">{getPropName(item.asset.department)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {new Date(item.disposalDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-muted-foreground" />
                        {item.disposalBy}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-destructive">
                      {formatCurrency(item.originalValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedAsset(item)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={(open) => !open && setSelectedAsset(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Asset Disposal Record
            </DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg bg-gray-50">
                <div>
                  <span className="text-xs text-muted-foreground block">Asset Name</span>
                  <span className="font-medium">{selectedAsset.asset.name}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Category</span>
                  <span className="font-medium">{getPropName(selectedAsset.asset.category)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Original Cost</span>
                  <span className="font-medium">{formatCurrency(selectedAsset.originalValue)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Disposal Date</span>
                  <span className="font-medium">{new Date(selectedAsset.disposalDate).toLocaleDateString()}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground block">Disposal Reason/Details</span>
                  <p className="text-sm mt-1">{selectedAsset.reason}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  History Log
                </h4>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {selectedAsset.history.map((req, idx) => (
                    <div key={idx} className="border-l-2 border-gray-200 pl-4 py-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-semibold text-gray-700">{req.type?.toUpperCase()}</span>
                        <span className="text-muted-foreground">{new Date(req.createdAt || "").toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600">{req.details || (req as any).reason || "No details"}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        Status: {req.status} {req.newStatus ? `-> ${req.newStatus}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
