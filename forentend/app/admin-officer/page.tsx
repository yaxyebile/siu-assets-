"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/common/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardAnalytics, getRequests, type Request } from "@/services/api-service"
import { Users, Package, Clock, DollarSign, AlertTriangle, TrendingUp, CheckCircle, FileText, Loader2 } from "lucide-react"

export default function OfficerDashboard() {
  const [stats, setStats] = useState({
    totalOperations: 0,
    totalAssets: 0,
    totalQuantity: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    totalValue: 0,
    missingLoss: 0,
  })
  const [recentRequests, setRecentRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const analytics = await getDashboardAnalytics()
      const requests = await getRequests()

      const totalValue = analytics.financials?.totalCurrentValue || 0
      const damageCost = analytics.financials?.totalDamageCost || 0

      setStats({
        totalOperations: analytics.users?.byRole?.adminOperation || 0,
        totalAssets: analytics.assets?.total || 0,
        totalQuantity: analytics.assets?.total || 0,
        pendingRequests: analytics.requests?.pending || 0,
        approvedRequests: analytics.requests?.approved || 0,
        totalValue: totalValue,
        missingLoss: damageCost,
      })

      setRecentRequests(requests.slice(-5).reverse())
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout allowedRoles={["adminOfficer"]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout allowedRoles={["adminOfficer"]}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">Error loading dashboard</p>
            <p className="text-muted-foreground text-sm mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getRequestTypeIcon = (type?: string) => {
    if (!type) return <FileText className="h-4 w-4 text-muted-foreground" />

    switch (type) {
      case "asset-damage": return <AlertTriangle className="h-4 w-4 text-destructive" />
      case "asset-transfer": return <TrendingUp className="h-4 w-4 text-info" />
      case "asset-registration": return <Package className="h-4 w-4 text-success" />
      default: return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <DashboardLayout allowedRoles={["adminOfficer"]}>
      <PageHeader title="Officer Dashboard" description="Monitor operations and manage asset requests" />

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Operations Staff"
          value={stats.totalOperations}
          icon={<Users className="h-5 w-5" />}
          variant="info"
        />
        <StatCard
          title="Asset Types"
          value={stats.totalAssets}
          icon={<Package className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Total Items"
          value={stats.totalQuantity.toLocaleString()}
          icon={<Package className="h-5 w-5" />}
          variant="default"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={<Clock className="h-5 w-5" />}
          variant={stats.pendingRequests > 0 ? "warning" : "default"}
        />
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Total Asset Value"
          value={formatCurrency(stats.totalValue)}
          icon={<DollarSign className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Potential Loss"
          value={formatCurrency(stats.missingLoss)}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="danger"
        />
        <StatCard
          title="Net Value"
          value={formatCurrency(stats.totalValue - stats.missingLoss)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="primary"
        />
      </div>

      {/* Recent Requests */}
      <Card className="border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Recent Requests</CardTitle>
                <p className="text-sm text-muted-foreground">Latest activity from operations</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {stats.approvedRequests} Approved
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center">
                      {getRequestTypeIcon(request.type)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{request.assetName || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {request.type?.replace("-", " ") || 'Unknown'} by {request.requestedByName || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
