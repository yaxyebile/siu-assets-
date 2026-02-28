"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/common/stat-card"
import { getUsers, getAssets, getRequests, getDepartments, getCategories } from "@/services/api-service"
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Package, 
  DollarSign, 
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  Tags
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface DepartmentStat {
  name: string
  count: number
  value: number
  percentage: number
}

interface CategoryStat {
  name: string
  count: number
  percentage: number
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAssets: 0,
    totalValue: 0,
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    availableAssets: 0,
    inUseAssets: 0,
    damagedAssets: 0,
    totalQuantity: 0,
    avgAssetValue: 0,
  })
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [requestTrends, setRequestTrends] = useState({
    registrations: 0,
    damages: 0,
    transfers: 0,
  })

  useEffect(() => {
    const users = getUsers()
    const assets = getAssets()
    const requests = getRequests()
    const departments = getDepartments()
    const categories = getCategories()

    // Basic stats
    const totalValue = assets.reduce((sum, a) => {
      const cost = parseFloat(String(a.purchaseCost)) || 0
      const qty = a.quantity || 1
      return sum + cost * qty
    }, 0)

    const totalQuantity = assets.reduce((sum, a) => sum + (a.quantity || 1), 0)

    const pending = requests.filter(r => r.status === "pending").length
    const approved = requests.filter(r => r.status === "approved").length
    const rejected = requests.filter(r => r.status === "rejected").length

    const available = assets.filter(a => a.status === "available").length
    const inUse = assets.filter(a => a.status === "in-use").length
    const damaged = assets.filter(a => a.condition === "Damaged").length

    setStats({
      totalUsers: users.length,
      totalAssets: assets.length,
      totalValue,
      totalRequests: requests.length,
      pendingRequests: pending,
      approvedRequests: approved,
      rejectedRequests: rejected,
      availableAssets: available,
      inUseAssets: inUse,
      damagedAssets: damaged,
      totalQuantity,
      avgAssetValue: assets.length > 0 ? totalValue / assets.length : 0,
    })

    // Department stats
    const deptStats: DepartmentStat[] = departments.map(dept => {
      const deptAssets = assets.filter(a => a.department === dept.name)
      const deptValue = deptAssets.reduce((sum, a) => {
        const cost = parseFloat(String(a.purchaseCost)) || 0
        const qty = a.quantity || 1
        return sum + cost * qty
      }, 0)
      return {
        name: dept.name,
        count: deptAssets.length,
        value: deptValue,
        percentage: assets.length > 0 ? (deptAssets.length / assets.length) * 100 : 0
      }
    }).sort((a, b) => b.count - a.count)
    setDepartmentStats(deptStats)

    // Category stats
    const catStats: CategoryStat[] = categories.map(cat => {
      const catAssets = assets.filter(a => a.category === cat.name)
      return {
        name: cat.name,
        count: catAssets.length,
        percentage: assets.length > 0 ? (catAssets.length / assets.length) * 100 : 0
      }
    }).sort((a, b) => b.count - a.count)
    setCategoryStats(catStats)

    // Request trends
    const registrations = requests.filter(r => r.type === "asset-registration").length
    const damages = requests.filter(r => r.type === "asset-damage").length
    const transfers = requests.filter(r => r.type === "asset-transfer").length
    setRequestTrends({ registrations, damages, transfers })

  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <PageHeader 
        title="System Analytics" 
        description="Comprehensive overview of system performance and data"
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Users" 
          value={stats.totalUsers} 
          icon={<Users className="h-5 w-5" />} 
          variant="primary"
        />
        <StatCard 
          title="Total Assets" 
          value={stats.totalAssets} 
          icon={<Package className="h-5 w-5" />} 
          variant="info"
        />
        <StatCard 
          title="Total Value" 
          value={formatCurrency(stats.totalValue)} 
          icon={<DollarSign className="h-5 w-5" />} 
          variant="success"
        />
        <StatCard 
          title="Avg Asset Value" 
          value={formatCurrency(stats.avgAssetValue)} 
          icon={<BarChart3 className="h-5 w-5" />} 
          variant="default"
        />
      </div>

      {/* Request Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Request Statistics</CardTitle>
                <p className="text-sm text-muted-foreground">Overview of all requests</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-center">
                <Clock className="h-6 w-6 text-warning mx-auto mb-2" />
                <p className="text-2xl font-bold text-warning">{stats.pendingRequests}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center">
                <CheckCircle className="h-6 w-6 text-success mx-auto mb-2" />
                <p className="text-2xl font-bold text-success">{stats.approvedRequests}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
                <XCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                <p className="text-2xl font-bold text-destructive">{stats.rejectedRequests}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Approval Rate</span>
                <span className="text-sm font-medium">
                  {stats.totalRequests > 0 
                    ? ((stats.approvedRequests / stats.totalRequests) * 100).toFixed(1) 
                    : 0}%
                </span>
              </div>
              <Progress 
                value={stats.totalRequests > 0 ? (stats.approvedRequests / stats.totalRequests) * 100 : 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center">
                <PieChart className="h-5 w-5 text-info" />
              </div>
              <div>
                <CardTitle>Request Types</CardTitle>
                <p className="text-sm text-muted-foreground">Breakdown by request type</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-sm">Asset Registrations</span>
                </div>
                <span className="font-bold">{requestTrends.registrations}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <span className="text-sm">Damage Reports</span>
                </div>
                <span className="font-bold">{requestTrends.damages}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-info" />
                  <span className="text-sm">Transfers</span>
                </div>
                <span className="font-bold">{requestTrends.transfers}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <Package className="h-5 w-5 text-success" />
              </div>
              <div>
                <CardTitle>Asset Status</CardTitle>
                <p className="text-sm text-muted-foreground">Current asset states</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Available</span>
                <span className="font-medium text-success">{stats.availableAssets}</span>
              </div>
              <Progress value={stats.totalAssets > 0 ? (stats.availableAssets / stats.totalAssets) * 100 : 0} className="h-2 bg-muted [&>div]:bg-success" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">In Use</span>
                <span className="font-medium text-info">{stats.inUseAssets}</span>
              </div>
              <Progress value={stats.totalAssets > 0 ? (stats.inUseAssets / stats.totalAssets) * 100 : 0} className="h-2 bg-muted [&>div]:bg-info" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Damaged</span>
                <span className="font-medium text-destructive">{stats.damagedAssets}</span>
              </div>
              <Progress value={stats.totalAssets > 0 ? (stats.damagedAssets / stats.totalAssets) * 100 : 0} className="h-2 bg-muted [&>div]:bg-destructive" />
            </div>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>By Department</CardTitle>
                <p className="text-sm text-muted-foreground">Asset distribution</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {departmentStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No departments yet</p>
            ) : (
              <div className="space-y-3">
                {departmentStats.slice(0, 5).map((dept, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">{dept.name}</span>
                      <span className="font-medium">{dept.count}</span>
                    </div>
                    <Progress value={dept.percentage} className="h-1.5" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                <Tags className="h-5 w-5 text-warning" />
              </div>
              <div>
                <CardTitle>By Category</CardTitle>
                <p className="text-sm text-muted-foreground">Asset categories</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {categoryStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No categories yet</p>
            ) : (
              <div className="space-y-3">
                {categoryStats.slice(0, 5).map((cat, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">{cat.name}</span>
                      <span className="font-medium">{cat.count}</span>
                    </div>
                    <Progress value={cat.percentage} className="h-1.5" />
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
