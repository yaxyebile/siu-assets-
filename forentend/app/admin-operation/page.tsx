"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatusBadge } from "@/components/common/status-badge"
import { useAuth } from "@/context/auth-context"
import { getRequestsByUser, type Request } from "@/services/api-service"
import { OperationDashboardSkeleton } from "@/components/ui/dashboard-skeleton"
import {
  FileText, Clock, CheckCircle, XCircle, Plus,
  AlertTriangle, TrendingUp, Package, Activity,
  ClipboardList, ArrowRight
} from "lucide-react"
import Link from "next/link"

export default function OperationDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
  })
  const [recentRequests, setRecentRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const loadData = async () => {
      try {
        setLoading(true)
        const requestsData = await getRequestsByUser(user.id)
        const requests = Array.isArray(requestsData) ? requestsData : []
        setStats({
          totalRequests: requests.length,
          pendingRequests: requests.filter(r => r.status === "pending").length,
          approvedRequests: requests.filter(r => r.status === "approved").length,
          rejectedRequests: requests.filter(r => r.status === "rejected").length,
        })
        setRecentRequests(requests.slice(-5).reverse())
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [user])

  const typeLabel = (type: string) => {
    switch (type) {
      case "asset-damage": return "Dhaawac"
      case "asset-transfer": return "Wareejin"
      case "asset-registration": return "Diiwaan Gelin"
      case "maintenance": return "Dayactir"
      default: return type.replace(/-/g, " ")
    }
  }

  const typeColor = (type: string) => {
    switch (type) {
      case "asset-damage": return "bg-red-500/10 border-red-500/20 text-red-300"
      case "asset-registration": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
      case "asset-transfer": return "bg-blue-500/10 border-blue-500/20 text-blue-300"
      default: return "bg-slate-500/10 border-slate-500/20 text-slate-300"
    }
  }

  if (loading) {
    return (
      <DashboardLayout allowedRoles={["adminOperation"]}>
        <OperationDashboardSkeleton />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout allowedRoles={["adminOperation"]}>

      {/* ── Hero Header ── */}
      <div className="relative mb-8 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-700 opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative px-8 py-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <span className="text-white/70 text-sm font-medium uppercase tracking-widest">Admin Operation</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-1">My Dashboard</h1>
            <p className="text-white/70">Submit and track your asset requests</p>
          </div>
          <Link href="/admin-operation/create-request">
            <div className="flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 transition-colors rounded-xl text-white font-medium backdrop-blur-sm cursor-pointer">
              <Plus className="h-5 w-5" />
              New Request
            </div>
          </Link>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {/* Total */}
        <div className="relative rounded-2xl overflow-hidden cursor-default">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-700" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/80 text-sm font-medium">Guud Ahaan</p>
              <div className="p-2 bg-white/20 rounded-xl"><FileText className="h-5 w-5 text-white" /></div>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{stats.totalRequests}</div>
            <p className="text-white/60 text-xs">Total Requests</p>
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
            <p className="text-white/60 text-xs">Approved</p>
          </div>
        </div>

        {/* Rejected */}
        <div className="relative rounded-2xl overflow-hidden cursor-default">
          <div className={`absolute inset-0 bg-gradient-to-br ${stats.rejectedRequests > 0 ? "from-red-500 to-rose-700" : "from-slate-500 to-slate-700"}`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/80 text-sm font-medium">La Diiday</p>
              <div className="p-2 bg-white/20 rounded-xl"><XCircle className="h-5 w-5 text-white" /></div>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{stats.rejectedRequests}</div>
            <p className="text-white/60 text-xs">Rejected</p>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link href="/admin-operation/create-request" className="block">
          <div className="group relative rounded-2xl overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 to-teal-950/20 hover:from-emerald-900/50 hover:to-teal-900/30 transition-all cursor-pointer p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/20">
                  <Package className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-200">Register Asset</p>
                  <p className="text-xs text-emerald-400/70">Submit new asset request</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-emerald-400/50 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>

        <Link href="/admin-operation/create-request" className="block">
          <div className="group relative rounded-2xl overflow-hidden border border-red-500/20 bg-gradient-to-br from-red-950/40 to-rose-950/20 hover:from-red-900/50 hover:to-rose-900/30 transition-all cursor-pointer p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/20">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="font-semibold text-red-200">Report Damage</p>
                  <p className="text-xs text-red-400/70">Report damaged asset</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-red-400/50 group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>

        <Link href="/admin-operation/create-request" className="block">
          <div className="group relative rounded-2xl overflow-hidden border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-cyan-950/20 hover:from-blue-900/50 hover:to-cyan-900/30 transition-all cursor-pointer p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/20">
                  <TrendingUp className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-blue-200">Transfer Asset</p>
                  <p className="text-xs text-blue-400/70">Move to another dept</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-blue-400/50 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>
      </div>

      {/* ── Recent Requests ── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">My Requests</h2>
              <p className="text-muted-foreground text-sm">Track your submission status</p>
            </div>
          </div>
          <Link href="/admin-operation/my-requests">
            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
        <div className="p-6">
          {recentRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="mb-4">No requests submitted yet</p>
              <Link href="/admin-operation/create-request">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer">
                  <Plus className="h-4 w-4" />
                  Create Your First Request
                </div>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${typeColor(req.type)}`}>
                      {typeLabel(req.type)}
                    </span>
                    <p className="font-medium text-sm">{req.assetName}</p>
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
