"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatusBadge } from "@/components/common/status-badge"
import { getDashboardAnalytics, getRequests, type Request } from "@/services/api-service"
import { OfficerDashboardSkeleton } from "@/components/ui/dashboard-skeleton"
import {
  Users, Package, Clock, DollarSign, AlertTriangle,
  TrendingUp, CheckCircle, FileText, ShieldCheck,
  LayoutDashboard, Activity
} from "lucide-react"
import Link from "next/link"

export default function OfficerDashboard() {
  const [stats, setStats] = useState({
    totalOperations: 0,
    totalAssets: 0,
    totalQuantity: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    totalValue: 0,
    currentValue: 0,
    missingLoss: 0,
  })
  const [recentRequests, setRecentRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadDashboardData() }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [analytics, requests] = await Promise.all([getDashboardAnalytics(), getRequests()])
      // byRole is now a keyed object: { adminOperation: N, adminOfficer: M, admin: K }
      const byRole = analytics.users?.byRole || {}
      const originalValue = analytics.financials?.totalPurchaseCost || 0
      const currentValue = analytics.financials?.totalCurrentValue || 0
      const damageCost = analytics.financials?.totalDamageCost || 0
      const totalQty = analytics.financials?.totalQuantity || analytics.assets?.total || 0

      setStats({
        totalOperations: byRole["adminOperation"] || 0,
        totalAssets: analytics.assets?.total || 0,
        totalQuantity: totalQty,
        pendingRequests: analytics.requests?.pending || 0,
        approvedRequests: analytics.requests?.approved || 0,
        totalValue: originalValue,
        currentValue,
        missingLoss: damageCost,
      })
      setRecentRequests(Array.isArray(requests) ? requests.slice(-6).reverse() : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const fmt = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)

  const typeLabel = (type?: string) => {
    switch (type) {
      case "asset-damage": return "Dhaawac"
      case "asset-transfer": return "Wareejin"
      case "asset-registration": return "Diiwaan Gelin"
      case "maintenance": return "Dayactir"
      default: return (type || "").replace(/-/g, " ")
    }
  }

  const typeColor = (type?: string) => {
    switch (type) {
      case "asset-damage": return "bg-red-500/10 border-red-500/20 text-red-300"
      case "asset-registration": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
      case "asset-transfer": return "bg-blue-500/10 border-blue-500/20 text-blue-300"
      default: return "bg-slate-500/10 border-slate-500/20 text-slate-300"
    }
  }

  if (loading) {
    return (
      <DashboardLayout allowedRoles={["adminOfficer"]}>
        <OfficerDashboardSkeleton />
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout allowedRoles={["adminOfficer"]}>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="p-4 bg-red-500/10 rounded-2xl"><AlertTriangle className="h-10 w-10 text-red-400" /></div>
          <p className="text-red-300 font-medium">{error}</p>
          <button onClick={loadDashboardData} className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            Retry
          </button>
        </div>
      </DashboardLayout>
    )
  }

  const depreciation = stats.totalValue - stats.currentValue
  const netValue = stats.currentValue - stats.missingLoss

  return (
    <DashboardLayout allowedRoles={["adminOfficer"]}>

      {/* ── Hero Header ── */}
      <div className="relative mb-8 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative px-8 py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <span className="text-white/70 text-sm font-medium uppercase tracking-widest">Admin Officer</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-1">Officer Dashboard</h1>
          <p className="text-white/70">Monitor operations and manage asset requests</p>
        </div>
      </div>

      {/* ── Operations Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {/* Operations Staff */}
        <div className="relative rounded-2xl overflow-hidden cursor-default">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-700" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/80 text-sm font-medium">Shaqaalaha</p>
              <div className="p-2 bg-white/20 rounded-xl"><Users className="h-5 w-5 text-white" /></div>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{stats.totalOperations}</div>
            <p className="text-white/60 text-xs">Operations Staff</p>
          </div>
        </div>

        {/* Asset Types */}
        <div className="relative rounded-2xl overflow-hidden cursor-default">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-600" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/80 text-sm font-medium">Asset Types</p>
              <div className="p-2 bg-white/20 rounded-xl"><Package className="h-5 w-5 text-white" /></div>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{stats.totalAssets}</div>
            <p className="text-white/60 text-xs">Noocyada Assets</p>
          </div>
        </div>

        {/* Pending */}
        <div className="relative rounded-2xl overflow-hidden cursor-default">
          <div className={`absolute inset-0 bg-gradient-to-br ${stats.pendingRequests > 0 ? "from-amber-500 to-orange-600" : "from-slate-500 to-slate-700"}`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/80 text-sm font-medium">Sugaya</p>
              <div className="p-2 bg-white/20 rounded-xl"><Clock className="h-5 w-5 text-white" /></div>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{stats.pendingRequests}</div>
            <p className="text-white/60 text-xs">Pending Requests</p>
          </div>
        </div>

        {/* Approved */}
        <div className="relative rounded-2xl overflow-hidden cursor-default">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/80 text-sm font-medium">La Ansixiyay</p>
              <div className="p-2 bg-white/20 rounded-xl"><CheckCircle className="h-5 w-5 text-white" /></div>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{stats.approvedRequests}</div>
            <p className="text-white/60 text-xs">Approved Requests</p>
          </div>
        </div>
      </div>

      {/* ── Financial Summary ── */}
      <div className="relative rounded-2xl overflow-hidden mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_70%)]" />
        <div className="relative px-8 py-7 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
              <DollarSign className="h-7 w-7 text-indigo-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Net Asset Value</p>
              <div className="text-4xl font-bold text-white">{fmt(netValue)}</div>
              <p className="text-slate-500 text-xs mt-1">Qiimaha Jaamacadda (ka dib dhammaan xididdada)</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            {/* Original */}
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center">
              <p className="text-slate-400 text-xs mb-1">Qiimaha Asalka</p>
              <p className="text-white font-bold">{fmt(stats.totalValue)}</p>
            </div>
            <div className="text-slate-500 text-lg font-bold">−</div>
            {/* Depreciation */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-center">
              <p className="text-amber-400 text-xs mb-1">Qiimo-dhac</p>
              <p className="text-amber-300 font-bold">{fmt(depreciation)}</p>
            </div>
            <div className="text-slate-500 text-lg font-bold">−</div>
            {/* Damage */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-center">
              <p className="text-red-400 text-xs mb-1">Khasaare</p>
              <p className="text-red-300 font-bold">{fmt(stats.missingLoss)}</p>
            </div>
            <Link href="/financial-report">
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 cursor-pointer hover:bg-indigo-500/20 transition-colors text-center">
                <p className="text-indigo-400 text-xs mb-1">Full Report</p>
                <p className="text-indigo-300 font-bold text-sm">Arag →</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Recent Requests ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Recent Requests</h2>
              <p className="text-muted-foreground text-sm">Latest activity from operations</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            {stats.approvedRequests} Approved
          </span>
        </div>
        <div className="p-6">
          {recentRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${typeColor(req.type)}`}>
                      {typeLabel(req.type)}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{req.assetName || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">By {req.requestedByName || "Unknown"}</p>
                    </div>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
