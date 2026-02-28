"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/common/page-header"
import { StatusBadge } from "@/components/common/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { getRequestsByUser, type Request } from "@/services/api-service"
import Link from "next/link"
import { Plus, Clock, CheckCircle, XCircle, FileText } from "lucide-react"

export default function MyRequestsPage() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<Request[]>([])

  useEffect(() => {
    const loadRequests = async () => {
      if (user) {
        try {
          const data = await getRequestsByUser(user.id)
          setRequests(Array.isArray(data) ? data : [])
        } catch (error) {
          console.error("Error loading requests:", error)
          setRequests([])
        }
      }
    }
    loadRequests()
  }, [user])

  const pendingRequests = requests.filter((r) => r.status === "pending")
  const approvedRequests = requests.filter((r) => r.status === "approved")
  const rejectedRequests = requests.filter((r) => r.status === "rejected")

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const RequestTable = ({ items }: { items: Request[] }) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Asset</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Details</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Submitted</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((request) => (
            <tr key={request.id} className="border-b border-border last:border-0">
              <td className="py-3 px-4 text-sm font-medium">{request.assetName}</td>
              <td className="py-3 px-4 text-sm text-muted-foreground capitalize">{(request.type || "").replace("-", " ")}</td>
              <td className="py-3 px-4 text-sm text-muted-foreground max-w-[200px] truncate">
                {request.details || "-"}
              </td>
              <td className="py-3 px-4 text-sm text-muted-foreground">{formatDate(request.createdAt)}</td>
              <td className="py-3 px-4">
                <StatusBadge status={request.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <DashboardLayout allowedRoles={["adminOperation"]}>
      <PageHeader
        title="My Requests"
        description="Track all your asset requests"
        action={
          <Link href="/admin-operation/create-request">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Request
            </Button>
          </Link>
        }
      />

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <FileText className="h-4 w-4" />
            All ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardContent className="pt-6">
              {requests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">You haven&apos;t submitted any requests yet.</p>
                  <Link href="/admin-operation/create-request">
                    <Button>Create Your First Request</Button>
                  </Link>
                </div>
              ) : (
                <RequestTable items={requests.slice().reverse()} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardContent className="pt-6">
              {pendingRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending requests.</p>
              ) : (
                <RequestTable items={pendingRequests.slice().reverse()} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardContent className="pt-6">
              {approvedRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No approved requests yet.</p>
              ) : (
                <RequestTable items={approvedRequests.slice().reverse()} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardContent className="pt-6">
              {rejectedRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No rejected requests.</p>
              ) : (
                <RequestTable items={rejectedRequests.slice().reverse()} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
