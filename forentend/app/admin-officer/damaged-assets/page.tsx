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
import { StatCard } from "@/components/common/stat-card"
import {
  getAssets,
  getRequests,
  getDamagedAssets,
  updateAsset,
  type Asset,
  type Request,
} from "@/services/api-service"
import {
  AlertTriangle,
  Search,
  Eye,
  DollarSign,
  Package,
  Calendar,
  MapPin,
  User,
  FileText,
  Wrench,
  CheckCircle,
} from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import Loading from "./loading"

interface DamagedAssetInfo {
  asset: Asset
  damageReports: NonNullable<Asset['damageReports']>
  totalDamagePercentage: number
  totalLoss: number
  originalValue: number
}

export default function DamagedAssetsPage() {
  const [damagedAssets, setDamagedAssets] = useState<DamagedAssetInfo[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAsset, setSelectedAsset] = useState<DamagedAssetInfo | null>(null)
  const [totals, setTotals] = useState({
    totalDamagedAssets: 0,
    totalLoss: 0,
    totalDamageReports: 0,
  })
  const [requestHistory, setRequestHistory] = useState<Request[]>([])
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isRepairing, setIsRepairing] = useState(false)

  const getPropName = (prop: string | { name: string } | undefined) => {
    if (!prop) return ""
    return typeof prop === 'object' ? prop.name : prop
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const assets = await getDamagedAssets() // Use dedicated endpoint directly

        // Build damaged asset info
        const damagedAssetsList: DamagedAssetInfo[] = assets.map((asset) => {
          const purchaseCost = Number.parseFloat(String(asset.purchaseCost)) || 0
          const quantity = Number.parseInt(String(asset.quantity || 1), 10) || 1 // Handle legacy quantity
          const originalValue = purchaseCost * quantity

          const reports = asset.damageReports || []
          const totalDamagePercentage = reports.reduce(
            (sum, r) => sum + (r.damagePercentage || 0),
            0
          )
          const totalLoss = originalValue * (totalDamagePercentage / 100)

          return {
            asset,
            damageReports: reports,
            totalDamagePercentage,
            totalLoss,
            originalValue,
          }
        })

        // Sort by total loss (highest first)
        damagedAssetsList.sort((a, b) => b.totalLoss - a.totalLoss)

        setDamagedAssets(damagedAssetsList)
        setTotals({
          totalDamagedAssets: damagedAssetsList.length,
          totalLoss: damagedAssetsList.reduce((sum, a) => sum + a.totalLoss, 0),
          totalDamageReports: damagedAssetsList.reduce((sum, a) => sum + a.damageReports.length, 0),
        })
      } catch (error) {
        console.error("Error loading damaged assets:", error)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedAsset?.asset?.id) {
      getRequests({ assetId: selectedAsset.asset.id, type: 'status-change' })
        .then(res => setRequestHistory(res))
        .catch(console.error)
    } else {
      setRequestHistory([])
    }
  }, [selectedAsset])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getDamageLevelLabel = (level: string) => {
    switch (level) {
      case "saaid":
        return { label: "Saaid (20%)", color: "destructive" as const }
      case "dhex-dhexaad":
        return { label: "Dhex-dhexaad (10%)", color: "secondary" as const }
      case "iska-roon":
        return { label: "Iska Roon (5%)", color: "secondary" as const }
      default:
        return { label: level, color: "secondary" as const }
    }
  }

  const filteredAssets = damagedAssets.filter(
    (item) =>
      item.asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getPropName(item.asset.department)?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRepairAsset = async (assetId: string) => {
    if (!window.confirm("Ma hubtaa in asset-kan la sameeyay oo uu hadda shaqaynayo?")) {
      return
    }

    try {
      setIsRepairing(true)
      await updateAsset(assetId, {
        status: 'available',
        condition: 'Good'
      })

      // Reload page to reflect changes
      window.location.reload()
    } catch (error) {
      console.error('Failed to repair asset:', error)
      alert("Khalad ayaa dhacay markii la update-garaynayay asset-ka")
    } finally {
      setIsRepairing(false)
    }
  }

  return (
    <DashboardLayout allowedRoles={["admin", "adminOfficer"]}>
      {/* ... (omitted) */}

      {/* Table */}
      <Card>
        {/* ... (omitted) */}
        <CardContent>
          {filteredAssets.length === 0 ? (
            // ... (omitted)
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Ma jiraan assets-ka la raadiyay"
                  : "Ma jiraan assets-ka haloobay"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                {/* ... (omitted) */}
                <TableBody>
                  {filteredAssets.map((item) => (
                    <TableRow key={item.asset.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                          </div>
                          <div>
                            <p className="font-medium">{item.asset.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {getPropName(item.asset.category)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="px-2 py-1 rounded bg-muted text-xs">
                          {item.asset.serialNumber || "N/A"}
                        </code>
                      </TableCell>
                      <TableCell>{getPropName(item.asset.department) || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.originalValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">
                          {item.totalDamagePercentage}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-destructive">
                        -{formatCurrency(item.totalLoss)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {item.damageReports.length} report(s)
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAsset(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Suspense fallback={<Loading />}>
        <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                {selectedAsset?.asset.name}
              </DialogTitle>
            </DialogHeader>

            {selectedAsset && (
              <div className="space-y-6">
                {/* Asset Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Serial Number</p>
                      <p className="font-medium">
                        {selectedAsset.asset.serialNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="font-medium">
                        {getPropName(selectedAsset.asset.department) || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Qiimaha Asalka</p>
                      <p className="font-medium">
                        {formatCurrency(selectedAsset.originalValue)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <div>
                      <p className="text-xs text-muted-foreground">Khasaaraha Guud</p>
                      <p className="font-semibold text-destructive">
                        -{formatCurrency(selectedAsset.totalLoss)} (
                        {selectedAsset.totalDamagePercentage}%)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Unified Asset History */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Asset History (Taariikhda & Xaalada)
                  </h3>
                  <div className="space-y-4">
                    {(() => {
                      // Merge and Sort Events Descending
                      const events = [
                        ...selectedAsset.damageReports.map(r => ({ type: 'damage', date: r.date || new Date().toISOString(), data: r })),
                        ...requestHistory.map(r => ({ type: 'repair', date: r.reviewedAt || r.submittedAt || r.createdAt || new Date().toISOString(), data: r }))
                      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                      const mergedEvents = [];
                      let activeRepair = null;

                      for (const event of events) {
                        if (event.type === 'repair') {
                          if (activeRepair) {
                            // Flush previous repair as standalone maintenance
                            mergedEvents.push({ type: 'maintenance', repair: activeRepair });
                          }
                          activeRepair = event.data;
                        } else {
                          // Damage Event
                          if (activeRepair) {
                            // Match this damage with the active repair (which occurred after it)
                            mergedEvents.push({ type: 'resolved_issue', damage: event.data, repair: activeRepair });
                            activeRepair = null;
                          } else {
                            mergedEvents.push({ type: 'active_issue', damage: event.data });
                          }
                        }
                      }
                      // Flush any remaining repair
                      if (activeRepair) mergedEvents.push({ type: 'maintenance', repair: activeRepair });

                      return mergedEvents.map((item: any, idx) => {
                        if (item.type === 'resolved_issue' || item.type === 'active_issue') {
                          const report = item.damage;
                          const repair = item.repair; // undefined if active_issue
                          const isResolved = !!repair && repair.newStatus === 'available';
                          const levelInfo = getDamageLevelLabel(report.damageLevel || "");
                          const borderClass = isResolved ? 'border-l-green-500' : (repair ? 'border-l-red-500' : 'border-l-orange-500');

                          return (
                            <div key={idx} className={`p-4 rounded-xl border bg-card shadow-sm border-l-4 ${borderClass}`}>
                              {/* Status Header */}
                              <div className="flex justify-between items-start mb-3 border-b pb-2 border-border/50">
                                <div className="flex items-center gap-2">
                                  <Badge variant={levelInfo.color} className="mr-1">{levelInfo.label}</Badge>
                                  {repair ? (
                                    <Badge className={isResolved ? 'bg-green-600' : 'bg-destructive'}>
                                      {isResolved ? 'Repaired (La Habeeyay)' : 'Failed (Lama Habeen)'}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-orange-600 border-orange-300">Pending Repair</Badge>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-semibold">{new Date(report.date || "").toLocaleDateString()}</div>
                                </div>
                              </div>

                              {/* Damage Details */}
                              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                <div>
                                  <span className="text-muted-foreground block text-xs">Khasaaraha:</span>
                                  <span className="font-medium text-destructive">-{report.damagePercentage}%</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground block text-xs">Goobta:</span>
                                  <span className="font-medium">{report.location || "N/A"}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-muted-foreground block text-xs">Sharaxaad:</span>
                                  <p className="text-sm">{report.description}</p>
                                </div>
                              </div>

                              {/* Repair Details (if exists) */}
                              {repair && (
                                <div className="mt-3 pt-3 border-t border-border/50">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                                      Repair Outcome
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(repair.reviewedAt || repair.submittedAt || "").toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm italic opacity-90">{repair.details}</p>
                                  <div className="mt-1 text-xs text-muted-foreground text-right">
                                    By: {repair.requestedByName}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        } else {
                          // Maintenance (orphan repair)
                          const repair = item.repair;
                          const isResolved = repair.newStatus === 'available';
                          return (
                            <div key={idx} className="p-4 rounded-xl border bg-card shadow-sm border-l-4 border-l-gray-400">
                              <div className="flex justify-between mb-2">
                                <Badge variant="secondary">Maintenance Check</Badge>
                                <span className="text-xs text-muted-foreground">{new Date(repair.reviewedAt || "").toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm">{repair.details}</p>
                              <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-right">
                                Outcome: <span className={isResolved ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                  {isResolved ? 'Available' : 'Disposed'}
                                </span>
                              </div>
                            </div>
                          );
                        }
                      });
                    })()}
                  </div>
                </div>

                {/* Repair Action */}
                {selectedAsset.asset.status === 'maintenance' && (
                  <div className="pt-4 border-t flex justify-end">
                    <Button
                      onClick={() => handleRepairAsset(selectedAsset.asset.id)}
                      disabled={isRepairing}
                      className="bg-green-600 hover:bg-green-700 text-white gap-2"
                    >
                      {isRepairing ? (
                        <span className="animate-spin">⌛</span>
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Mark as Repaired & Available
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Suspense>
    </DashboardLayout >
  )
}
