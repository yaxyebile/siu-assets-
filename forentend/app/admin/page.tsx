"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/common/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDashboardAnalytics, getUsersByRole, type User } from "@/services/api-service"
import { Users, Package, Shield, DollarSign, AlertTriangle, TrendingUp, Activity, BarChart3, Loader2 } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalAdminOfficers: 0,
    totalAdminOperations: 0,
    totalAssets: 0,
    totalQuantity: 0,
    totalRequests: 0,
    pendingRequests: 0,
    totalValue: 0,
    missingLoss: 0,
  })
  const [adminOfficers, setAdminOfficers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get analytics from backend
      const analytics = await getDashboardAnalytics()
      const officers = await getUsersByRole("adminOfficer")

      // Calculate stats from analytics
      const totalValue = analytics.financials?.totalCurrentValue || 0
      const damageCost = analytics.financials?.totalDamageCost || 0

      setStats({
        totalAdminOfficers: analytics.users?.byRole?.adminOfficer || 0,
        totalAdminOperations: analytics.users?.byRole?.adminOperation || 0,
        totalAssets: analytics.assets?.total || 0,
        totalQuantity: analytics.assets?.total || 0,
        totalRequests: analytics.requests?.total || 0,
        pendingRequests: analytics.requests?.pending || 0,
        totalValue: totalValue,
        missingLoss: damageCost,
      })
      setAdminOfficers(officers)
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout allowedRoles={["admin"]}>
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
      <DashboardLayout allowedRoles={["admin"]}>
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

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <PageHeader title="System Overview" description="Real-time insights into your asset management system" />

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Admin Officers"
          value={stats.totalAdminOfficers}
          icon={<Shield className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Operations Staff"
          value={stats.totalAdminOperations}
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
          icon={<BarChart3 className="h-5 w-5" />}
          variant="default"
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

      {/* Activity & Officers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Stats */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">System Activity</CardTitle>
                <p className="text-sm text-muted-foreground">Current system status</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-medium">Total Requests</span>
              </div>
              <span className="text-2xl font-bold">{stats.totalRequests}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-warning/10 border border-warning/20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-warning animate-pulse" />
                <span className="text-sm font-medium">Pending Approval</span>
              </div>
              <span className="text-2xl font-bold text-warning">{stats.pendingRequests}</span>
            </div>
          </CardContent>
        </Card>

        {/* Officers Table */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Admin Officers</CardTitle>
                <p className="text-sm text-muted-foreground">{adminOfficers.length} registered officers</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {adminOfficers.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No officers registered yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {adminOfficers.slice(0, 5).map((officer) => (
                  <div key={officer.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {officer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{officer.name}</p>
                        <p className="text-xs text-muted-foreground">{officer.email}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      Officer
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
