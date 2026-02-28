"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/common/page-header"
import { StatusBadge } from "@/components/common/status-badge"
import { AssetQRCard } from "@/components/asset-qr-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  getAssets,
  updateAsset,
  deleteAsset,
  getCategories,
  getDepartments,
  getRequests,
  getUsers,
  createRequest,
  type Asset,
  type Request,
} from "@/services/api-service"
import { Plus, Pencil, Trash2, Search, QrCode, Eye, FileText, ArrowRight, AlertTriangle, RefreshCw } from "lucide-react"

export function AssetListContent() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [qrAsset, setQrAsset] = useState<Asset | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [reportDamageOpen, setReportDamageOpen] = useState(false)
  const [damageAsset, setDamageAsset] = useState<Asset | null>(null)
  const [damageData, setDamageData] = useState({
    damageLevel: "dhex-dhexaad",
    description: "",
    location: "",
  })
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    department: "",
    status: "available" as Asset["status"],
  })

  const [viewAsset, setViewAsset] = useState<Asset | null>(null)
  const [assetHistory, setAssetHistory] = useState<Request[]>([])
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([])

  // Add loading state
  const [loading, setLoading] = useState(true)

  const loadAssets = async () => {
    try {
      setLoading(true)
      const [assetsData, categoriesData, departmentsData, usersData] = await Promise.all([
        getAssets(),
        getCategories(),
        getDepartments(),
        getUsers()
      ])

      setAssets(Array.isArray(assetsData) ? assetsData : [])
      setCategories(Array.isArray(categoriesData) ? categoriesData.map((c) => c.name) : [])
      setDepartments(Array.isArray(departmentsData) ? departmentsData.map((d) => d.name) : [])
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (error) {
      console.error("Error loading assets data:", error)
      setAssets([])
      setCategories([])
      setDepartments([])
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAssets()
  }, [])

  useEffect(() => {
    let filtered = assets

    if (searchTerm) {
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (a.department && typeof a.department === 'object' ? a.department.name : String(a.department || "")).toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (filterCategory && filterCategory !== "all") {
      filtered = filtered.filter((a) => {
        const catName = (a.category && typeof a.category === 'object') ? a.category.name : String(a.category || "")
        return catName === filterCategory
      })
    }

    if (filterStatus && filterStatus !== "all") {
      filtered = filtered.filter((a) => a.status === filterStatus)
    }

    setFilteredAssets(filtered)
  }, [assets, searchTerm, filterCategory, filterStatus])

  const openReportDamage = (asset: Asset) => {
    setDamageAsset(asset)
    setDamageData({
      damageLevel: "dhex-dhexaad",
      description: "",
      location: asset.location || "",
    })
    setReportDamageOpen(true)
  }

  const handleReportDamage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!damageAsset) return

    let percentage = 10 // Default moderate
    if (damageData.damageLevel === "saaid") percentage = 20
    if (damageData.damageLevel === "iska-roon") percentage = 5

    try {
      await createRequest({
        type: "asset-damage",
        assetId: damageAsset.id,
        assetName: damageAsset.name,
        details: damageData.description || "Damage reported by Admin Officer",
        assetDamageData: {
          damageLevel: damageData.damageLevel as "saaid" | "dhex-dhexaad" | "iska-roon",
          damagePercentage: percentage,
          location: damageData.location,
          description: damageData.description,
        },
      })
      setReportDamageOpen(false)
      setDamageAsset(null)
      // Refresh assets to reflect any status change if applicable
      await loadAssets()
    } catch (error) {
      console.error("Error reporting damage:", error)
    }
  }

  const openAssetHistory = async (asset: Asset) => {
    setViewAsset(asset)
    try {
      // Get all requests related to this asset
      const allRequests = await getRequests()
      if (Array.isArray(allRequests)) {
        const relatedRequests = allRequests.filter((r) => r.assetId === asset.id || r.data?.assetId === asset.id)
        // Sort by date, newest first
        relatedRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setAssetHistory(relatedRequests)
      } else {
        setAssetHistory([])
      }
    } catch (error) {
      console.error("Error loading asset history:", error)
      setAssetHistory([])
    }
  }

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user ? user.name : "Unknown"
  }

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case "asset-damage":
        return "Dhaawac Report"
      case "asset-transfer":
        return "Wareejin"
      case "asset-registration":
        return "Diiwaan Gelin"
      case "usage":
        return "Isticmaal"
      case "status-change":
        return "Isbeddel Status"
      case "maintenance":
        return "Dayactir"
      case "transfer":
        return "Wareejin"
      default:
        return type
    }
  }

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case "asset-damage":
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case "asset-transfer":
      case "transfer":
        return <ArrowRight className="h-4 w-4 text-blue-500" />
      case "asset-registration":
        return <FileText className="h-4 w-4 text-green-500" />
      case "maintenance":
        return <RefreshCw className="h-4 w-4 text-orange-500" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  const openEdit = (asset: Asset) => {
    setSelectedAsset(asset)
    setFormData({
      name: asset.name,
      category: (asset.category && typeof asset.category === 'object') ? asset.category.name : String(asset.category || ""),
      department: (asset.department && typeof asset.department === 'object') ? asset.department.name : String(asset.department || ""),
      status: asset.status,
    })
    setIsEditOpen(true)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAsset) return

    try {
      await updateAsset(selectedAsset.id, formData)
      setIsEditOpen(false)
      setSelectedAsset(null)
      await loadAssets()
    } catch (error) {
      console.error("Error updating asset:", error)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteAsset(deleteId)
      setDeleteId(null)
      await loadAssets()
    } catch (error) {
      console.error("Error deleting asset:", error)
    }
  }

  return (
    <DashboardLayout allowedRoles={["admin", "adminOfficer"]}>
      <PageHeader
        title="Asset List"
        description="View and manage all registered assets"
        action={
          <Link href="/admin-officer/register-asset">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Register Asset
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, dept, serial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="in-use">In Use</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setFilterCategory("all")
                setFilterStatus("all")
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredAssets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {assets.length === 0 ? "No assets registered yet." : "No assets match your filters."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Serial #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Department</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-4 text-sm font-mono font-bold text-primary">{asset.serialNumber}</td>
                      <td className="py-3 px-4 text-sm font-medium">{asset.name}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {(asset.category && typeof asset.category === 'object') ? asset.category.name : String(asset.category || "-")}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {(asset.department && typeof asset.department === 'object') ? asset.department.name : String(asset.department || "-")}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={asset.status} variant="asset" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => openReportDamage(asset)}
                            title="Report Damage"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openAssetHistory(asset)}
                            title="View Report"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setQrAsset(asset)} title="QR Code">
                            <QrCode className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(asset)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(asset.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewAsset} onOpenChange={() => setViewAsset(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Asset Report - {viewAsset?.name}
            </DialogTitle>
            <DialogDescription>Taariikhda iyo dhammaan wixii asset-kan ku dhacay</DialogDescription>
          </DialogHeader>

          {viewAsset && (
            <div className="space-y-6">
              {/* Asset Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Serial Number</p>
                  <p className="font-mono font-bold text-primary">{viewAsset.serialNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium">
                    {(viewAsset.category && typeof viewAsset.category === 'object') ? viewAsset.category.name : String(viewAsset.category || "-")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="font-medium">
                    {(viewAsset.department && typeof viewAsset.department === 'object') ? viewAsset.department.name : String(viewAsset.department || "-")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <StatusBadge status={viewAsset.status} variant="asset" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Purchase Date</p>
                  <p className="font-medium">
                    {viewAsset.purchaseDate ? new Date(viewAsset.purchaseDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Purchase Cost</p>
                  <p className="font-medium">${Number.parseFloat(String(viewAsset.purchaseCost || 0)).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="font-medium">{viewAsset.quantity || 1}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Condition</p>
                  <p className="font-medium">{viewAsset.condition || "N/A"}</p>
                </div>
              </div>

              {/* Activity History */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Taariikhda Dhaqdhaqaaqa ({assetHistory.length})
                </h3>

                {assetHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 bg-muted/30 rounded-lg">
                    Wax dhaqdhaqaaq ah lama diiwaan gelin asset-kan.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {assetHistory.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 border rounded-lg bg-background hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">{getRequestTypeIcon(request.type)}</div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{getRequestTypeLabel(request.type)}</Badge>
                                <Badge
                                  variant={
                                    request.status === "approved"
                                      ? "default"
                                      : request.status === "rejected"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                  className={request.status === "approved" ? "bg-green-500" : ""}
                                >
                                  {request.status === "approved"
                                    ? "Approved"
                                    : request.status === "rejected"
                                      ? "Rejected"
                                      : "Pending"}
                                </Badge>
                              </div>

                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">Soo gudbiyay:</span>{" "}
                                {getUserName(request.requestedBy)}
                              </p>

                              {/* Request specific details */}
                              {request.type === "asset-damage" && request.data && (
                                <div className="text-sm space-y-1 mt-2 p-2 bg-destructive/10 rounded">
                                  <p>
                                    <span className="font-medium">Heerka Dhaawaca:</span>{" "}
                                    {request.data.damageLevel === "severe"
                                      ? "Saaid (20%)"
                                      : request.data.damageLevel === "moderate"
                                        ? "Dhex-dhexaad (10%)"
                                        : "Iska Roon (5%)"}
                                  </p>
                                  <p>
                                    <span className="font-medium">Meesha:</span> {request.data.damageLocation}
                                  </p>
                                  {request.data.description && (
                                    <p>
                                      <span className="font-medium">Sharaxaad:</span> {request.data.description}
                                    </p>
                                  )}
                                </div>
                              )}

                              {(request.type === "asset-transfer" || request.type === "transfer") && request.data && (
                                <div className="text-sm space-y-1 mt-2 p-2 bg-blue-500/10 rounded">
                                  <p>
                                    <span className="font-medium">Department Hore:</span> {request.data.fromDepartment}
                                  </p>
                                  <p>
                                    <span className="font-medium">Department Cusub:</span> {request.data.toDepartment}
                                  </p>
                                  {request.data.reason && (
                                    <p>
                                      <span className="font-medium">Sababta:</span> {request.data.reason}
                                    </p>
                                  )}
                                </div>
                              )}

                              {request.type === "asset-registration" && request.data && (
                                <div className="text-sm space-y-1 mt-2 p-2 bg-green-500/10 rounded">
                                  <p>
                                    <span className="font-medium">Supplier:</span> {request.data.supplier}
                                  </p>
                                  <p>
                                    <span className="font-medium">Qiimaha:</span> $
                                    {Number.parseFloat(String(request.data.purchaseCost || 0)).toFixed(2)}
                                  </p>
                                </div>
                              )}

                              {request.reason && !request.data && (
                                <p className="text-sm">
                                  <span className="font-medium">Sababta:</span> {request.reason}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(request.createdAt).toLocaleDateString()}
                            <br />
                            {new Date(request.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewAsset(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!qrAsset} onOpenChange={() => setQrAsset(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asset QR Code</DialogTitle>
            <DialogDescription>Print ama download QR code-ka asset-kan</DialogDescription>
          </DialogHeader>
          {qrAsset && <AssetQRCard asset={qrAsset} onClose={() => setQrAsset(null)} />}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>Update the asset information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Asset["status"]) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in-use">In Use</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the asset from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Damage Dialog */}
      <Dialog open={reportDamageOpen} onOpenChange={setReportDamageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Report Damaged Asset
            </DialogTitle>
            <DialogDescription>
              Submit a damage report for {damageAsset?.name}. This will be auto-approved for processing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReportDamage} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="damage-level">Heerka Dhaawaca</Label>
              <Select
                value={damageData.damageLevel}
                onValueChange={(val) => setDamageData({ ...damageData, damageLevel: val })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="saaid">Saaid (Severe - 20%)</SelectItem>
                  <SelectItem value="dhex-dhexaad">Dhex-dhexaad (Moderate - 10%)</SelectItem>
                  <SelectItem value="iska-roon">Iska Roon (Minor - 5%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="damage-location">Location</Label>
              <Input
                id="damage-location"
                value={damageData.location}
                onChange={(e) => setDamageData({ ...damageData, location: e.target.value })}
                placeholder="Where did the damage occur?"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="damage-desc">Description</Label>
              <Textarea
                id="damage-desc"
                value={damageData.description}
                onChange={(e) => setDamageData({ ...damageData, description: e.target.value })}
                placeholder="Describe the damage details..."
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReportDamageOpen(false)}>Cancel</Button>
              <Button type="submit" variant="destructive">Submit Report</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
