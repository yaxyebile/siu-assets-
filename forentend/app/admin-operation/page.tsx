"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/common/stat-card"
import { StatusBadge } from "@/components/common/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { getRequestsByUser, type Request } from "@/services/api-service"
import { FileText, Clock, CheckCircle, XCircle, Plus, AlertTriangle, TrendingUp, Package } from "lucide-react"
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

  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      try {
        const requestsData = await getRequestsByUser(user.id)
        const requests = Array.isArray(requestsData) ? requestsData : []

        const pending = requests.filter((r) => r.status === "pending")
        const approved = requests.filter((r) => r.status === "approved")
        const rejected = requests.filter((r) => r.status === "rejected")

        setStats({
          totalRequests: requests.length,
          pendingRequests: pending.length,
          approvedRequests: approved.length,
          rejectedRequests: rejected.length,
        })

        setRecentRequests(requests.slice(-5).reverse())
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      }
    }

    loadData()
  }, [user])

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case "asset-damage": return <AlertTriangle className="h-4 w-4 text-destructive" />
      case "asset-transfer": return <TrendingUp className="h-4 w-4 text-info" />
      case "asset-registration": return <Package className="h-4 w-4 text-success" />
      default: return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <DashboardLayout allowedRoles={["adminOperation"]}>
      <PageHeader
        title="My Dashboard"
        description="Submit and track your asset requests"
        action={
          <Link href="/admin-operation/create-request">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Request
            </Button>
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Requests"
          value={stats.totalRequests}
          icon={<FileText className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Pending"
          value={stats.pendingRequests}
          icon={<Clock className="h-5 w-5" />}
          variant={stats.pendingRequests > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Approved"
          value={stats.approvedRequests}
          icon={<CheckCircle className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Rejected"
          value={stats.rejectedRequests}
          icon={<XCircle className="h-5 w-5" />}
          variant={stats.rejectedRequests > 0 ? "danger" : "default"}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Link href="/admin-operation/create-request" className="block">
          <Card className="border-border hover:border-primary/50 transition-all cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Register Asset</p>
                <p className="text-sm text-muted-foreground">Submit new asset request</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/assets/search" className="block">
          <Card className="border-border hover:border-destructive/50 transition-all cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center group-hover:bg-destructive/30 transition-colors">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="font-medium">Report Damage</p>
                <p className="text-sm text-muted-foreground">Scan QR and report</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/assets/search" className="block">
          <Card className="border-border hover:border-info/50 transition-all cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-info/20 flex items-center justify-center group-hover:bg-info/30 transition-colors">
                <TrendingUp className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="font-medium">Transfer Asset</p>
                <p className="text-sm text-muted-foreground">Move to another dept</p>
              </div>
            </CardContent>
          </Card>
        </Link>
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
                <CardTitle className="text-lg">My Requests</CardTitle>
                <p className="text-sm text-muted-foreground">Track your submission status</p>
              </div>
            </div>
            <Link href="/admin-operation/my-requests">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">No requests submitted yet</p>
              <Link href="/admin-operation/create-request">
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Plus className="h-4 w-4" />
                  Create Your First Request
                </Button>
              </Link>
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
                      <p className="font-medium text-sm">{request.assetName}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {(request.type || "").replace("-", " ")}
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
