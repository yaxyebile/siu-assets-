"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useAuth } from "@/context/auth-context"
import { getAssets, getRequests, type Asset, type Request } from "@/services/api-service"
import { FinancialReportSkeleton } from "@/components/ui/dashboard-skeleton"
import {
  DollarSign,
  TrendingDown,
  Package,
  Calculator,
  Calendar,
  Percent,
  AlertTriangle,
  Building2,
  Trash2,
  ExternalLink,
  TrendingUp,
  ShieldAlert,
  BarChart3,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const DAILY_DEPRECIATION_RATE = 0.00068

interface AssetWithDepreciation extends Asset {
  daysSincePurchase: number
  totalDepreciationPercent: number
  depreciatedValue: number
  depreciationAmount: number
  originalValue: number
  damageDeduction: number
  damagePercentage: number
}

interface DamageLossDetail {
  assetId: string
  assetName: string
  damageLevel: string
  damagePercentage: number
  originalValue: number
  lossAmount: number
  reportedBy: string
  date: string
}

export default function FinancialReportPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [assetsWithDepreciation, setAssetsWithDepreciation] = useState<AssetWithDepreciation[]>([])
  const [damageLossDetails, setDamageLossDetails] = useState<DamageLossDetail[]>([])
  const [totals, setTotals] = useState({
    totalOriginalValue: 0,
    totalCurrentValue: 0,
    totalDepreciation: 0,
    totalQuantity: 0,
    damageLoss: 0,
  })
  const [disposedAssetsList, setDisposedAssetsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isLoading && !user) { router.push("/"); return }
    if (!isLoading && user && user.role !== "admin" && user.role !== "adminOfficer") {
      router.push("/admin-operation"); return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        const [assetsData, requestsData] = await Promise.all([getAssets(), getRequests()])
        const assetsAll = Array.isArray(assetsData) ? assetsData : []
        const requests = Array.isArray(requestsData) ? requestsData : []
        const today = new Date()

        const activeAssets = assetsAll.filter(a => a.status?.toLowerCase() !== "disposed")
        const disposedAssets = assetsAll.filter(a => a.status?.toLowerCase() === "disposed")

        // Deduplicate disposed assets
        const seenIds = new Set<string>()
        const disposedDetails = disposedAssets
          .filter(asset => {
            if (seenIds.has(asset.id)) return false
            seenIds.add(asset.id)
            return true
          })
          .map(asset => {
            const disposalReq = requests.find(r => {
              const reqAssetId = (r.assetId && typeof r.assetId === "object" && "_id" in (r.assetId as any))
                ? (r.assetId as any)._id : r.assetId
              return reqAssetId === asset.id && r.newStatus === "disposed" && r.status === "approved"
            })
            const purchaseCost = Number.parseFloat(String(asset.purchaseCost)) || 0
            const quantity = Number.parseInt(String(asset.quantity), 10) || 1
            const originalValue = purchaseCost * quantity
            const categoryName = asset.category && typeof asset.category === "object" && "name" in (asset.category as any)
              ? (asset.category as any).name : String(asset.category || "N/A")
            const departmentName = asset.department && typeof asset.department === "object" && "name" in (asset.department as any)
              ? (asset.department as any).name : String(asset.department || "N/A")
            return {
              ...asset, originalValue, categoryName, departmentName,
              disposalDate: disposalReq?.updatedAt || disposalReq?.createdAt || asset.updatedAt,
              disposalBy: disposalReq?.reviewedByName || "Admin",
            }
          })
        setDisposedAssetsList(disposedDetails)

        const approvedDamageRequests = requests.filter(
          r => r.type === "asset-damage" && r.status === "approved" && r.assetDamageData
        )
        const damageDeductionsMap: Record<string, { percentage: number; details: DamageLossDetail[] }> = {}

        approvedDamageRequests.forEach(request => {
          if (!request.assetDamageData) return
          let assetId = request.assetId
          if (assetId && typeof assetId === "object" && "_id" in assetId) assetId = (assetId as any)._id
          if (!assetId) return
          const asset = activeAssets.find(a => a.id === assetId)
          if (!asset) return
          const purchaseCost = Number.parseFloat(String(asset.purchaseCost)) || 0
          const quantity = Number.parseInt(String(asset.quantity), 10) || 1
          const originalValue = purchaseCost * quantity
          const damagePercentage = request.assetDamageData.damagePercentage
          const lossAmount = originalValue * (damagePercentage / 100)
          if (!damageDeductionsMap[assetId]) damageDeductionsMap[assetId] = { percentage: 0, details: [] }
          damageDeductionsMap[assetId].percentage += damagePercentage
          damageDeductionsMap[assetId].details.push({
            assetId, assetName: request.assetName, damageLevel: request.assetDamageData.damageLevel,
            damagePercentage, originalValue, lossAmount,
            reportedBy: request.requestedByName,
            date: request.updatedAt || request.createdAt || new Date().toISOString(),
          })
        })

        const allDamageDetails: DamageLossDetail[] = []
        Object.values(damageDeductionsMap).forEach(({ details }) => allDamageDetails.push(...details))
        setDamageLossDetails(allDamageDetails)

        const calculated = activeAssets.map(asset => {
          const purchaseDate = asset.purchaseDate ? new Date(asset.purchaseDate) : new Date()
          const purchaseCost = Number.parseFloat(String(asset.purchaseCost)) || 0
          const quantity = Number.parseInt(String(asset.quantity), 10) || 1
          const timeDiff = today.getTime() - purchaseDate.getTime()
          const daysSincePurchase = timeDiff > 0 ? Math.floor(timeDiff / (1000 * 60 * 60 * 24)) : 0
          const originalValue = purchaseCost * quantity
          const depreciationMultiplier = Math.pow(1 - DAILY_DEPRECIATION_RATE, daysSincePurchase)
          const totalDepreciationPercent = 1 - depreciationMultiplier
          const depreciationAmount = originalValue * totalDepreciationPercent
          const depreciatedValue = originalValue - depreciationAmount
          const damagePercentage = damageDeductionsMap[asset.id]?.percentage || 0
          const damageDeduction = originalValue * (damagePercentage / 100)
          return { ...asset, daysSincePurchase, totalDepreciationPercent, depreciatedValue, depreciationAmount, originalValue, damageDeduction, damagePercentage }
        })

        setAssetsWithDepreciation(calculated)
        const totalOriginalValue = calculated.reduce((s, a) => s + (a.originalValue || 0), 0)
        const totalCurrentValue = calculated.reduce((s, a) => s + (a.depreciatedValue || 0), 0)
        const totalDepreciation = calculated.reduce((s, a) => s + (a.depreciationAmount || 0), 0)
        const totalQuantity = calculated.reduce((s, a) => s + (Number.parseInt(String(a.quantity), 10) || 0), 0)
        const damageLoss = calculated.reduce((s, a) => s + (a.damageDeduction || 0), 0)
        setTotals({ totalOriginalValue, totalCurrentValue, totalDepreciation, totalQuantity, damageLoss })
      } catch (error) {
        console.error("Error loading financial data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user, isLoading, router])

  if (isLoading || loading) {
    return (
      <DashboardLayout allowedRoles={["admin", "adminOfficer"]}>
        <FinancialReportSkeleton />
      </DashboardLayout>
    )
  }

  const fmt = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(isNaN(v) ? 0 : v)
  const fmtPct = (v: number) => `${((isNaN(v) ? 0 : v) * 100).toFixed(3)}%`
  const netValue = isNaN(totals.totalCurrentValue - totals.damageLoss) ? 0 : totals.totalCurrentValue - totals.damageLoss
  const depreciationPct = totals.totalOriginalValue > 0 ? (totals.totalDepreciation / totals.totalOriginalValue) * 100 : 0

  const getDamageLevelLabel = (level: string) => {
    switch (level) {
      case "saaid": return "Saaid (20%)"
      case "dhex-dhexaad": return "Dhex-dhexaad (10%)"
      case "iska-roon": return "Iska Roon (5%)"
      default: return level
    }
  }

  return (
    <DashboardLayout allowedRoles={["admin", "adminOfficer"]}>
      {/* Hero Header */}
      <div className="relative mb-8 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative px-8 py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <span className="text-white/70 text-sm font-medium uppercase tracking-widest">Financial Overview</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-1">Financial Report</h1>
          <p className="text-white/70">Qiimaha guud ee hantida jaamacadda iyo qiimo-dhaca maalinlaha ah</p>
        </div>
      </div>

      {/* ── SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

        {/* Total Assets */}
        <div className="relative rounded-2xl overflow-hidden group cursor-default">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-700" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/80 text-sm font-medium">Tirada Guud</p>
              <div className="p-2 bg-white/20 rounded-xl">
                <Package className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{totals.totalQuantity}</div>
            <p className="text-white/60 text-xs">Active Assets</p>
          </div>
        </div>

        {/* Original Value */}
        <div className="relative rounded-2xl overflow-hidden group cursor-default">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/80 text-sm font-medium">Qiimaha Asalka</p>
              <div className="p-2 bg-white/20 rounded-xl">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{fmt(totals.totalOriginalValue)}</div>
            <p className="text-white/60 text-xs">Purchase value</p>
          </div>
        </div>

        {/* Depreciation */}
        <div className="relative rounded-2xl overflow-hidden group cursor-default">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/80 text-sm font-medium">Qiimo-dhaca Guud</p>
              <div className="p-2 bg-white/20 rounded-xl">
                <TrendingDown className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">-{fmt(totals.totalDepreciation)}</div>
            <p className="text-white/60 text-xs">{depreciationPct.toFixed(1)}% lost · {(DAILY_DEPRECIATION_RATE * 100).toFixed(3)}%/day</p>
          </div>
        </div>

        {/* Current Value */}
        <div className="relative rounded-2xl overflow-hidden group cursor-default">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/80 text-sm font-medium">Qiimaha Hadda</p>
              <div className="p-2 bg-white/20 rounded-xl">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{fmt(totals.totalCurrentValue)}</div>
            <p className="text-white/60 text-xs">After depreciation</p>
          </div>
        </div>
      </div>

      {/* ── NET VALUE HERO ── */}
      <div className="relative rounded-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.2),transparent_70%)]" />
        <div className="relative px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
              <Building2 className="h-8 w-8 text-indigo-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-1">Qiimaha Guud ee Jaamacadda</p>
              <div className="text-5xl font-bold text-white">{fmt(netValue)}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-center">
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3">
              <p className="text-slate-400 text-xs mb-1">Asal</p>
              <p className="text-white font-semibold">{fmt(totals.totalOriginalValue)}</p>
            </div>
            <div className="text-slate-500 flex items-center text-xl font-bold">−</div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-3">
              <p className="text-amber-400 text-xs mb-1">Qiimo-dhac</p>
              <p className="text-amber-300 font-semibold">{fmt(totals.totalDepreciation)}</p>
            </div>
            <div className="text-slate-500 flex items-center text-xl font-bold">−</div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3">
              <p className="text-red-400 text-xs mb-1">Khasaare</p>
              <p className="text-red-300 font-semibold">{fmt(totals.damageLoss)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── DAMAGE LOSS SECTION ── */}
      {totals.damageLoss > 0 && (
        <div className="mb-8 rounded-2xl overflow-hidden border border-red-500/30 bg-gradient-to-br from-red-950/40 to-rose-950/20">
          <div className="px-6 py-5 border-b border-red-500/20 flex items-center gap-4">
            <div className="p-2 bg-red-500/20 rounded-xl">
              <ShieldAlert className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-red-300 font-semibold text-lg">Khasaaraha Dhaawaca</h2>
              <p className="text-red-400/70 text-sm">{damageLossDetails.length} approved damage report(s) · Total: <span className="font-bold text-red-300">{fmt(totals.damageLoss)}</span></p>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400/70 text-xs uppercase tracking-wider mb-1">Khasaaraha Guud</p>
                <p className="text-3xl font-bold text-red-400">-{fmt(totals.damageLoss)}</p>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                <p className="text-indigo-400/70 text-xs uppercase tracking-wider mb-1">Net Value (Ka dib khasaaraha)</p>
                <p className="text-3xl font-bold text-indigo-300">{fmt(netValue)}</p>
              </div>
            </div>
            {damageLossDetails.length > 0 && (
              <div className="rounded-xl border border-red-500/20 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-red-500/20 bg-red-500/10 hover:bg-red-500/10">
                      <TableHead className="text-red-300/80">Asset</TableHead>
                      <TableHead className="text-red-300/80">Heerka Dhaawaca</TableHead>
                      <TableHead className="text-right text-red-300/80">Qiimaha Asalka</TableHead>
                      <TableHead className="text-right text-red-300/80">Boqolkiiba</TableHead>
                      <TableHead className="text-right text-red-300/80">Khasaaraha</TableHead>
                      <TableHead className="text-red-300/80">Soo Gudbiyay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {damageLossDetails.map((detail, index) => (
                      <TableRow key={index} className="border-red-500/10 hover:bg-red-500/5">
                        <TableCell className="font-medium text-foreground">{detail.assetName}</TableCell>
                        <TableCell>
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30">
                            {getDamageLevelLabel(detail.damageLevel)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{fmt(detail.originalValue)}</TableCell>
                        <TableCell className="text-right">
                          <span className="text-red-400 font-semibold">{detail.damagePercentage}%</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-red-300 font-bold">-{fmt(detail.lossAmount)}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{detail.reportedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DISPOSED ASSETS ── */}
      <div className="mb-8 rounded-2xl overflow-hidden border border-slate-600/40 bg-gradient-to-br from-slate-800/60 to-slate-900/40">
        <div className="px-6 py-5 border-b border-slate-600/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-slate-500/20 rounded-xl border border-slate-500/20">
              <Trash2 className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <h2 className="text-slate-200 font-semibold text-lg">Disposed Assets</h2>
              <p className="text-slate-400 text-sm">
                {disposedAssetsList.length > 0 ? `${disposedAssetsList.length} asset(s) la tuuray` : "Ma jiraan disposed assets"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin-officer/disposed-assets")}
            className="flex items-center gap-2 border-slate-500/40 text-slate-300 hover:bg-slate-700/50 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            Arag Dhammaan
          </Button>
        </div>
        <div className="p-6">
          {disposedAssetsList.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Ma jiraan assets la tuuray/saaray</p>
              <p className="text-xs mt-1 opacity-60">Assets-ka status &quot;Disposed&quot; halkan ku muuqan doonaan</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-600/30 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-600/30 bg-slate-700/30 hover:bg-slate-700/30">
                    <TableHead className="text-slate-400">Asset Name</TableHead>
                    <TableHead className="text-slate-400">Category</TableHead>
                    <TableHead className="text-slate-400">Department</TableHead>
                    <TableHead className="text-slate-400">Disposal Date</TableHead>
                    <TableHead className="text-slate-400">Processed By</TableHead>
                    <TableHead className="text-right text-slate-400">Written Off</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {disposedAssetsList.map((asset) => (
                    <TableRow key={asset.id} className="border-slate-600/20 hover:bg-slate-700/20">
                      <TableCell className="font-semibold text-slate-200">{asset.name}</TableCell>
                      <TableCell className="text-slate-400">{asset.categoryName || "N/A"}</TableCell>
                      <TableCell className="text-slate-400">{asset.departmentName || "N/A"}</TableCell>
                      <TableCell className="text-slate-400">{new Date(asset.disposalDate || new Date()).toLocaleDateString()}</TableCell>
                      <TableCell className="text-slate-400">{asset.disposalBy}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-slate-300">{fmt(asset.originalValue || 0)}</span>
                        <span className="text-slate-500 text-xs ml-1">written off</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* ── DEPRECIATION DETAIL TABLE ── */}
      <div className="rounded-2xl overflow-hidden border border-border bg-card">
        <div className="px-6 py-5 border-b border-border flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Percent className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Faahfaahinta Qiimo-dhaca Asset Kasta</h2>
            <p className="text-muted-foreground text-sm">{assetsWithDepreciation.length} active assets</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Maalmaha
                  </div>
                </TableHead>
                <TableHead className="text-right">Qiimaha Asalka</TableHead>
                <TableHead className="text-right">Qiimo-dhac %</TableHead>
                <TableHead className="text-right">Qiimo-dhac $</TableHead>
                <TableHead className="text-right">Qiimaha Hadda</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assetsWithDepreciation.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>Ma jiraan assets la diiwaangaliyay</p>
                  </TableCell>
                </TableRow>
              ) : (
                assetsWithDepreciation.map((asset) => (
                  <TableRow key={asset.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {(asset.category as any)?.name || asset.category || "N/A"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">{asset.quantity}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">{asset.daysSincePurchase}d</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmt(asset.originalValue)}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-amber-500 font-semibold">{fmtPct(asset.totalDepreciationPercent)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-amber-500">-{fmt(asset.depreciationAmount)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-emerald-400 font-bold">{fmt(asset.depreciatedValue)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          asset.status === "available"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : asset.status === "maintenance"
                              ? "bg-red-500/20 text-red-300 border-red-500/30"
                              : asset.status === "in-use"
                                ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                : "bg-slate-500/20 text-slate-300 border-slate-500/30"
                        }
                      >
                        {asset.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  )
}
