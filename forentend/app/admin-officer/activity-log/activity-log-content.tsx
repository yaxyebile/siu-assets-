"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/common/page-header"
import { getRequests, getAssets, type Request, type Asset } from "@/services/api-service"
import {
  Search,
  Eye,
  Package,
  AlertTriangle,
  ArrowRightLeft,
  ClipboardList,
  Calendar,
  User,
  MapPin,
  History,
} from "lucide-react"

export function ActivityLogContent() {
  const { user, isLoading } = useAuth()
  const [requests, setRequests] = useState<Request[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [requestsData, assetsData] = await Promise.all([
          getRequests(),
          getAssets()
        ])
        setRequests(Array.isArray(requestsData) ? requestsData : [])
        setAssets(Array.isArray(assetsData) ? assetsData : [])
      } catch (error) {
        console.error("Error loading activity log:", error)
        setRequests([])
        setAssets([])
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    let filtered = [...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.requestedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.assetRegistrationData?.serialNumber || "").toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterType !== "all") {
      filtered = filtered.filter((r) => r.type === filterType)
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((r) => r.status === filterStatus)
    }

    setFilteredRequests(filtered)
  }, [requests, searchTerm, filterType, filterStatus])

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "asset-registration":
        return "Diiwaan Gelin"
      case "asset-damage":
        return "Damage Report"
      case "asset-transfer":
        return "Wareejin"
      case "usage":
        return "Isticmaal"
      case "status-change":
        return "Status Change"
      case "maintenance":
        return "Dayactir"
      default:
        return type
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "asset-registration":
        return <Package className="h-4 w-4" />
      case "asset-damage":
        return <AlertTriangle className="h-4 w-4" />
      case "asset-transfer":
        return <ArrowRightLeft className="h-4 w-4" />
      default:
        return <ClipboardList className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getAssetByRequestId = (request: Request): Asset | undefined => {
    if (request.type === "asset-registration" && request.assetRegistrationData) {
      return assets.find((a) => a.serialNumber === request.assetRegistrationData?.serialNumber)
    }
    return assets.find((a) => a.id === request.assetId)
  }

  const viewDetails = (request: Request) => {
    setSelectedRequest(request)
    setShowDetailModal(true)
  }

  // Statistics
  const totalRequests = requests.length
  const approvedRequests = requests.filter((r) => r.status === "approved").length
  const pendingRequests = requests.filter((r) => r.status === "pending").length
  const damageReports = requests.filter((r) => r.type === "asset-damage").length
  const transfers = requests.filter((r) => r.type === "asset-transfer").length

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <DashboardLayout allowedRoles={["admin", "adminOfficer"]}>
      <PageHeader title="Activity Log" description="Dhammaan wixii assets-ka ku dhacay ee system-ka" />

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{totalRequests}</div>
            <p className="text-sm text-muted-foreground">Total Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{approvedRequests}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{pendingRequests}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{damageReports}</div>
            <p className="text-sm text-muted-foreground">Damage Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{transfers}</div>
            <p className="text-sm text-muted-foreground">Transfers</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Asset name, Serial, Operation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="asset-registration">Diiwaan Gelin</SelectItem>
                  <SelectItem value="asset-damage">Damage Report</SelectItem>
                  <SelectItem value="asset-transfer">Wareejin</SelectItem>
                  <SelectItem value="usage">Isticmaal</SelectItem>
                  <SelectItem value="maintenance">Dayactir</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Activity Log ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Taariikhda</TableHead>
                  <TableHead>Nooca</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Soo Gudbiyay</TableHead>
                  <TableHead>Faahfaahin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Ma jiraan activities la helay
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm">{new Date(request.createdAt).toLocaleDateString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(request.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(request.type)}
                          <span className="text-sm">{getTypeLabel(request.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.assetName}</div>
                          {request.assetRegistrationData?.serialNumber && (
                            <div className="text-xs text-muted-foreground">
                              SN: {request.assetRegistrationData.serialNumber}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{request.requestedByName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {request.type === "asset-damage" && request.assetDamageData
                            ? `${request.assetDamageData.damageLevel} - ${request.assetDamageData.damageLocation}`
                            : request.type === "asset-transfer" && request.assetTransferData
                              ? `${request.assetTransferData.fromDepartment} → ${request.assetTransferData.toDepartment}`
                              : request.type === "asset-registration" && request.assetRegistrationData
                                ? `${request.assetRegistrationData.department} - $${request.assetRegistrationData.purchaseCost}`
                                : request.details || "-"}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => viewDetails(request)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRequest && getTypeIcon(selectedRequest.type)}
              Activity Details
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Taariikhda</Label>
                  <p className="font-medium">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Nooca Request-ka</Label>
                  <p className="font-medium">{getTypeLabel(selectedRequest.type)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Soo Gudbiyay (Admin Operation)</Label>
                  <p className="font-medium">{selectedRequest.requestedByName}</p>
                </div>
              </div>

              {/* Asset Info */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Asset Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Magaca Asset-ka</Label>
                    <p className="font-medium">{selectedRequest.assetName}</p>
                  </div>
                  {(() => {
                    const asset = getAssetByRequestId(selectedRequest)
                    if (asset) {
                      return (
                        <>
                          <div>
                            <Label className="text-muted-foreground">Serial Number</Label>
                            <p className="font-medium">{asset.serialNumber}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Department</Label>
                            <p className="font-medium">{asset.department}</p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground">Location</Label>
                            <p className="font-medium">{asset.location}</p>
                          </div>
                        </>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>

              {/* Type-specific details */}
              {selectedRequest.type === "asset-registration" && selectedRequest.assetRegistrationData && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Registration Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Category</Label>
                      <p className="font-medium">{selectedRequest.assetRegistrationData.category}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Department</Label>
                      <p className="font-medium">{selectedRequest.assetRegistrationData.department}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Supplier (Meesha laga soo iibsaday)</Label>
                      <p className="font-medium">{selectedRequest.assetRegistrationData.supplier}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Purchase Date</Label>
                      <p className="font-medium">{selectedRequest.assetRegistrationData.purchaseDate}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Purchase Cost</Label>
                      <p className="font-medium text-green-600">
                        ${selectedRequest.assetRegistrationData.purchaseCost}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Quantity</Label>
                      <p className="font-medium">{selectedRequest.assetRegistrationData.quantity}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Serial Number</Label>
                      <p className="font-medium">{selectedRequest.assetRegistrationData.serialNumber}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Location</Label>
                      <p className="font-medium">{selectedRequest.assetRegistrationData.location}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.type === "asset-damage" && selectedRequest.assetDamageData && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    Damage Report Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Heerka Dhaawaca</Label>
                      <p className="font-medium capitalize">
                        {selectedRequest.assetDamageData.damageLevel === "saaid"
                          ? "Saaid (20%)"
                          : selectedRequest.assetDamageData.damageLevel === "dhex-dhexaad"
                            ? "Dhex-dhexaad (10%)"
                            : "Iska Roon (5%)"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Boqolkiiba laga jaray</Label>
                      <p className="font-medium text-red-600">{selectedRequest.assetDamageData.damagePercentage}%</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Meesha uu ka haloobay</Label>
                      <p className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {selectedRequest.assetDamageData.damageLocation}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Sharaxaadda</Label>
                      <p className="font-medium">{selectedRequest.assetDamageData.damageDescription}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.type === "asset-transfer" && selectedRequest.assetTransferData && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-600">
                    <ArrowRightLeft className="h-4 w-4" />
                    Transfer Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Department-kii Hore</Label>
                      <p className="font-medium">{selectedRequest.assetTransferData.fromDepartment}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Department-ka Cusub</Label>
                      <p className="font-medium text-blue-600">{selectedRequest.assetTransferData.toDepartment}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Sababta Wareejinta</Label>
                      <p className="font-medium">{selectedRequest.assetTransferData.transferReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Update Info */}
              {selectedRequest.status !== "pending" && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Update Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Updated At</Label>
                      <p className="font-medium">{new Date(selectedRequest.updatedAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Final Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
