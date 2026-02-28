"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/common/page-header"
import { StatusBadge } from "@/components/common/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  getRequests,
  approveRequest,
  rejectRequest,
  getAssetById,
  type Request,
  type Asset,
} from "@/services/api-service"
import { notifyRequestApproved, notifyRequestRejected } from "@/services/sms-notification-service"
import {
  Check,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Eye,
  FileText,
  DollarSign,
  AlertTriangle,
  MapPin,
  ArrowRightLeft,
  Building,
  Loader2,
} from "lucide-react"

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [pendingRequests, setPendingRequests] = useState<Request[]>([])
  const [processedRequests, setProcessedRequests] = useState<Request[]>([])
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: "approve" | "reject" } | null>(null)
  const [viewRequest, setViewRequest] = useState<Request | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  const [loading, setLoading] = useState(true)
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null)
  const [assetLoading, setAssetLoading] = useState(false)

  const loadRequests = async () => {
    try {
      setLoading(true)
      const allRequestsData = await getRequests()
      const allRequests = Array.isArray(allRequestsData) ? allRequestsData : []
      setRequests(allRequests)
      setPendingRequests(allRequests.filter((r) => r.status === "pending"))
      setProcessedRequests(allRequests.filter((r) => r.status !== "pending"))
    } catch (error) {
      console.error("Error loading requests:", error)
      setRequests([])
      setPendingRequests([])
      setProcessedRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const handleConfirmAction = async () => {
    if (!confirmAction) return

    setIsProcessing(true)

    // Find the request before processing to get requester info
    const targetRequest = requests.find((r) => r.id === confirmAction.id)

    try {
      let result
      if (confirmAction.action === "approve") {
        result = await approveRequest(confirmAction.id)
        // Send SMS to the requester (Admin Operation)
        if (result.success && targetRequest) {
          notifyRequestApproved(targetRequest.requestedBy, targetRequest.type, targetRequest.assetName)
        }
      } else {
        result = await rejectRequest(confirmAction.id, rejectReason)
        // Send SMS to the requester (Admin Operation) with reject reason
        if (result.success && targetRequest) {
          notifyRequestRejected(targetRequest.requestedBy, targetRequest.type, targetRequest.assetName, rejectReason)
        }
      }

      setConfirmAction(null)
      setViewRequest(null)
      setRejectReason("")

      await loadRequests()
    } catch (error) {
      console.error("Error processing request:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const handleViewRequest = async (request: Request) => {
    setViewRequest(request)

    if (request.type !== "asset-registration" && request.assetId) {
      setAssetLoading(true)
      try {
        const assetId = (request.assetId && typeof request.assetId === 'object' && '_id' in request.assetId)
          ? (request.assetId as any)._id
          : request.assetId;

        const asset = await getAssetById(assetId)
        setCurrentAsset(asset || null)
      } catch (error) {
        console.error("Error fetching asset:", error)
        setCurrentAsset(null)
      } finally {
        setAssetLoading(false)
      }
    } else {
      setCurrentAsset(null)
    }
  }

  const RequestTable = ({ items, showActions }: { items: Request[]; showActions: boolean }) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Asset</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Requested By</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Details</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
            {showActions && <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((request) => (
            <tr key={request.id} className="border-b border-border last:border-0">
              <td className="py-3 px-4 text-sm font-medium">
                <div className="flex items-center gap-2">
                  {request.type === "asset-registration" && <Package className="h-4 w-4 text-primary" />}
                  {request.type === "asset-damage" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  {request.type === "asset-transfer" && <ArrowRightLeft className="h-4 w-4 text-blue-500" />}
                  {request.assetName}
                </div>
              </td>
              <td className="py-3 px-4 text-sm">
                {request.type === "asset-registration" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    <Package className="h-3 w-3" />
                    New Asset
                  </span>
                ) : request.type === "asset-damage" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-medium">
                    <AlertTriangle className="h-3 w-3" />
                    Damage Report
                  </span>
                ) : request.type === "asset-transfer" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-600 rounded-full text-xs font-medium">
                    <ArrowRightLeft className="h-3 w-3" />
                    Transfer
                  </span>
                ) : (
                  <span className="text-muted-foreground capitalize">{request.type.replace("-", " ")}</span>
                )}
              </td>
              <td className="py-3 px-4 text-sm text-muted-foreground">{request.requestedByName}</td>
              <td className="py-3 px-4 text-sm text-muted-foreground max-w-[200px] truncate">
                {request.type === "asset-registration" && request.assetRegistrationData
                  ? `From: ${request.assetRegistrationData.supplier} | ${formatCurrency(request.assetRegistrationData.purchaseCost)}`
                  : request.type === "asset-damage" && request.assetDamageData
                    ? `${request.assetDamageData.damageLevel} (${request.assetDamageData.damagePercentage}%) | ${request.assetDamageData.location}`
                    : request.type === "asset-transfer" && request.assetTransferData

                      ? `${request.assetTransferData.fromDepartment} → ${request.assetTransferData.toDepartment}`
                      : request.details || "-"}
              </td>
              <td className="py-3 px-4 text-sm text-muted-foreground">{formatDate(request.createdAt)}</td>
              <td className="py-3 px-4">
                <StatusBadge status={request.status} />
              </td>
              {showActions && (
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    {(request.type === "asset-registration" ||
                      request.type === "asset-damage" ||
                      request.type === "asset-transfer") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 bg-transparent"
                          onClick={() => handleViewRequest(request)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      )}
                    <Button
                      size="sm"
                      className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground"
                      onClick={() => setConfirmAction({ id: request.id, action: "approve" })}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      onClick={() => setConfirmAction({ id: request.id, action: "reject" })}
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <DashboardLayout allowedRoles={["admin", "adminOfficer"]}>
      <PageHeader title="Approval Requests" description="Review and manage requests from admin operations" />

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({processedRequests.filter((r) => r.status === "approved").length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({processedRequests.filter((r) => r.status === "rejected").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardContent className="pt-6">
              {pendingRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending requests.</p>
              ) : (
                <RequestTable items={pendingRequests} showActions={true} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardContent className="pt-6">
              {processedRequests.filter((r) => r.status === "approved").length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No approved requests yet.</p>
              ) : (
                <RequestTable items={processedRequests.filter((r) => r.status === "approved")} showActions={false} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardContent className="pt-6">
              {processedRequests.filter((r) => r.status === "rejected").length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No rejected requests yet.</p>
              ) : (
                <RequestTable items={processedRequests.filter((r) => r.status === "rejected")} showActions={false} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Request Dialog */}
      <Dialog open={!!viewRequest} onOpenChange={() => setViewRequest(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewRequest?.type === "asset-registration" ? (
                <>
                  <Package className="h-5 w-5 text-primary" />
                  Asset Registration Request
                </>
              ) : viewRequest?.type === "asset-transfer" ? (
                <>
                  <ArrowRightLeft className="h-5 w-5 text-blue-500" />
                  Asset Transfer Request
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Damage Report
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {viewRequest?.type === "asset-transfer" && viewRequest.assetTransferData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Asset Name</p>
                  <p className="font-medium">{viewRequest.assetName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requested By</p>
                  <p className="font-medium">{viewRequest.requestedByName}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-600">
                  <ArrowRightLeft className="h-4 w-4" />
                  Transfer Details
                </h4>
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">From Department</p>
                      <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg border">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{viewRequest.assetTransferData.fromDepartment}</span>
                      </div>
                    </div>
                    <ArrowRightLeft className="h-6 w-6 text-blue-500" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">To Department</p>
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/30">
                        <Building className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-primary">{viewRequest.assetTransferData.toDepartment}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-1">Reason for Transfer</p>
                <p className="font-medium p-3 bg-muted/50 rounded-lg">{viewRequest.assetTransferData.transferReason}</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Asset Information
                </h4>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Asset Value</p>
                    <p className="font-medium text-lg text-primary">
                      {assetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatCurrency(currentAsset?.purchaseCost || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Request Date</p>
                    <p className="font-medium">{formatDate(viewRequest.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  className="flex-1 gap-2 bg-success hover:bg-success/90"
                  onClick={() => setConfirmAction({ id: viewRequest.id, action: "approve" })}
                >
                  <Check className="h-4 w-4" />
                  Approve Transfer
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={() => setConfirmAction({ id: viewRequest.id, action: "reject" })}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          )}

          {viewRequest?.type === "asset-damage" && viewRequest.assetDamageData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Asset Name</p>
                  <p className="font-medium">{viewRequest.assetName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reported By</p>
                  <p className="font-medium">{viewRequest.requestedByName}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Damage Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Damage Level</p>
                    <p
                      className={`font-medium ${viewRequest.assetDamageData.damagePercentage === 20
                        ? "text-destructive"
                        : viewRequest.assetDamageData.damagePercentage === 10
                          ? "text-orange-500"
                          : "text-yellow-500"
                        }`}
                    >
                      {viewRequest.assetDamageData.damageLevel === "saaid"
                        ? "Saaid (Xun)"
                        : viewRequest.assetDamageData.damageLevel === "dhex-dhexaad"
                          ? "Dhex-dhexaad"
                          : "Iska Roon (Yar)"}{" "}
                      ({viewRequest.assetDamageData.damagePercentage}%)
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Damage Location
                    </p>
                    <p className="font-medium">{viewRequest.assetDamageData.location}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{viewRequest.assetDamageData.description}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial Impact
                </h4>
                <div className="grid grid-cols-2 gap-4 p-4 bg-destructive/10 rounded-lg border border-destructive/30">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Asset Value</p>
                    <p className="font-medium text-lg">
                      {assetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatCurrency(currentAsset?.currentValue ?? currentAsset?.purchaseCost ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Deduction ({viewRequest.assetDamageData.damagePercentage}%)
                    </p>
                    <p className="font-medium text-lg text-destructive">
                      -
                      {assetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatCurrency(
                        (currentAsset?.purchaseCost || 0) * (viewRequest.assetDamageData.damagePercentage / 100),
                      )}
                    </p>
                  </div>
                  <div className="col-span-2 border-t pt-2">
                    <p className="text-sm text-muted-foreground">New Value After Approval</p>
                    <p className="font-bold text-xl text-primary">
                      {assetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : formatCurrency(
                        (currentAsset?.currentValue ?? currentAsset?.purchaseCost ?? 0) -
                        ((currentAsset?.purchaseCost || 0) * (viewRequest.assetDamageData.damagePercentage / 100))
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  className="flex-1 gap-2 bg-success hover:bg-success/90"
                  onClick={() => setConfirmAction({ id: viewRequest.id, action: "approve" })}
                >
                  <Check className="h-4 w-4" />
                  Approve (Deduct {viewRequest.assetDamageData.damagePercentage}%)
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={() => setConfirmAction({ id: viewRequest.id, action: "reject" })}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          )}

          {/* Asset Registration View */}
          {viewRequest?.type === "asset-registration" && viewRequest.assetRegistrationData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Asset Name</p>
                  <p className="font-medium">{viewRequest.assetRegistrationData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requested By</p>
                  <p className="font-medium">{viewRequest.requestedByName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{viewRequest.assetRegistrationData.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{viewRequest.assetRegistrationData.assetType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{viewRequest.assetRegistrationData.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Condition</p>
                  <p className="font-medium">{viewRequest.assetRegistrationData.condition}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{viewRequest.assetRegistrationData.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{viewRequest.assetRegistrationData.location || "-"}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Purchase Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier / Location</p>
                    <p className="font-medium">{viewRequest.assetRegistrationData.supplier}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Date</p>
                    <p className="font-medium">{viewRequest.assetRegistrationData.purchaseDate || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Cost</p>
                    <p className="font-medium text-primary">
                      {formatCurrency(viewRequest.assetRegistrationData.purchaseCost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Number</p>
                    <p className="font-medium">{viewRequest.assetRegistrationData.invoiceNumber || "-"}</p>
                  </div>
                  {viewRequest.assetRegistrationData.invoiceFile && (
                    <div>
                      <p className="text-sm text-muted-foreground">Invoice Document</p>
                      <a
                        href={viewRequest.assetRegistrationData.invoiceFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        View Invoice
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {viewRequest.assetRegistrationData.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{viewRequest.assetRegistrationData.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button
                  className="flex-1 gap-2 bg-success hover:bg-success/90"
                  onClick={() => setConfirmAction({ id: viewRequest.id, action: "approve" })}
                >
                  <Check className="h-4 w-4" />
                  Approve & Register Asset
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 gap-2"
                  onClick={() => setConfirmAction({ id: viewRequest.id, action: "reject" })}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => { setConfirmAction(null); setRejectReason("") }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "approve" ? "Approve Request?" : "Reject Request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "approve"
                ? "This will approve the request and apply the changes to the asset."
                : "This will reject the request. The requester will be notified via SMS."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {confirmAction?.action === "reject" && (
            <div className="space-y-2 py-2">
              <Label htmlFor="reject-reason" className="text-sm font-medium">
                Sababta Diidmada (SMS-ka lagu diri doono)
              </Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Qor sababta aad u diidaysid request-kan..."
                className="min-h-[100px]"
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmAction?.action === "approve" ? "bg-success hover:bg-success/90" : "bg-destructive"}
            >
              {confirmAction?.action === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
