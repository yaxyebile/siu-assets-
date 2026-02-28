"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/common/page-header"
import { StatusBadge } from "@/components/common/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/context/auth-context"
import {
  getAssets,
  createRequest,
  getDepartments,
  getCategories,
  type Asset,
  type Department,
  type Category,
} from "@/services/api-service"
import { Upload, FileText, X, Plus, Package, AlertTriangle, ArrowRightLeft, MapPin, Copy } from "lucide-react"
import { notifyNewRequest } from "@/services/sms-notification-service"

const requestTypes = [
  { value: "asset-registration", label: "Register New Asset", description: "Request to register a new asset" },
  { value: "asset-damage", label: "Report Asset Damage", description: "Report a damaged or lost asset" },
  { value: "asset-transfer", label: "Transfer Asset", description: "Request to transfer asset to another department" },
  { value: "usage", label: "Asset Usage", description: "Request to use an asset" },
  { value: "status-change", label: "Status Change", description: "Request to change asset status" },
  { value: "maintenance", label: "Maintenance", description: "Request maintenance for an asset" },
  { value: "repair-complete", label: "Repair Complete", description: "Return asset from maintenance to available" },
  { value: "transfer", label: "Transfer", description: "Request to transfer an asset" },
]

const damageLevels = [
  { value: "saaid", label: "Saaid (Xun)", percentage: 20, description: "Dhaawac aad u xun - 20% laga jarayo" },
  {
    value: "dhex-dhexaad",
    label: "Dhex-dhexaad",
    percentage: 10,
    description: "Dhaawac dhexdhexaad - 10% laga jarayo",
  },
  { value: "iska-roon", label: "Iska Roon (Yar)", percentage: 5, description: "Dhaawac yar - 5% laga jarayo" },
]

export default function CreateRequestPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [assets, setAssets] = useState<Asset[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    assetId: "",
    type: "" as
      | "usage"
      | "status-change"
      | "maintenance"
      | "transfer"
      | "asset-registration"
      | "asset-damage"
      | "asset-damage"
      | "asset-transfer"
      | "repair-complete"
      | "",
    details: "",
    newStatus: "" as Asset["status"] | "",
  })

  const [damageFormData, setDamageFormData] = useState({
    damageLevel: "" as "saaid" | "dhex-dhexaad" | "iska-roon" | "",
    damageLocation: "",
    damageDescription: "",
  })

  const [transferFormData, setTransferFormData] = useState({
    toDepartment: "",
    transferReason: "",
  })

  const [assetFormData, setAssetFormData] = useState({
    name: "",
    category: "",
    assetType: "Fixed" as "Fixed" | "Movable",
    quantity: 1,
    condition: "Excellent" as "Excellent" | "Good" | "Fair" | "Poor" | "Damaged",
    department: "",
    location: "",
    purchaseDate: "",
    purchaseCost: 0,
    supplier: "",
    invoiceNumber: "",
    invoiceFile: "",
    serialNumber: "",
    warrantyExpiry: "",
    notes: "",
  })

  // Per-unit location details
  const [unitDetails, setUnitDetails] = useState<Array<{ unitNumber: number; location: string }>>([{ unitNumber: 1, location: "" }])

  const handleQtyChange = (qty: number) => {
    const newQty = Math.max(1, qty)
    setAssetFormData(prev => ({ ...prev, quantity: newQty }))
    setUnitDetails(prev => {
      const updated: Array<{ unitNumber: number; location: string }> = []
      for (let i = 1; i <= newQty; i++) {
        const existing = prev.find(u => u.unitNumber === i)
        updated.push(existing ?? { unitNumber: i, location: "" })
      }
      return updated
    })
  }

  const copyLocationToAll = () => {
    const first = unitDetails[0]?.location || ""
    if (!first) return
    setUnitDetails(prev => prev.map(u => ({ ...u, location: first })))
  }

  const updateUnitLocation = (unitNumber: number, location: string) => {
    setUnitDetails(prev => prev.map(u => u.unitNumber === unitNumber ? { ...u, location } : u))
  }

  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Helper to safely get property name irrespective of whether it's an object or string
  const getPropName = (prop: string | { name: string } | undefined | null) => {
    if (!prop) return ""
    return typeof prop === 'object' ? prop.name : prop
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [assetsData, departmentsData, categoriesData] = await Promise.all([
          getAssets(),
          getDepartments(),
          getCategories(),
        ])
        setAssets(Array.isArray(assetsData) ? assetsData : [])
        setDepartments(Array.isArray(departmentsData) ? departmentsData : [])
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }
    loadData()
  }, [])

  const selectedAsset = assets.find((a) => a.id === formData.assetId)
  const selectedDamageLevel = damageLevels.find((d) => d.value === damageFormData.damageLevel)

  const handleInvoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError("Invoice file must be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setAssetFormData({ ...assetFormData, invoiceFile: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!user) {
      setError("You must be logged in to submit a request")
      return
    }

    if (!formData.type) {
      setError("Please select a request type")
      return
    }

    if (formData.type === "asset-transfer") {
      if (!formData.assetId) {
        setError("Please select an asset")
        return
      }
      if (!transferFormData.toDepartment) {
        setError("Please select the destination department")
        return
      }
      if (!transferFormData.transferReason) {
        setError("Please enter the reason for transfer")
        return
      }

      const asset = assets.find((a) => a.id === formData.assetId)
      if (!asset) {
        setError("Selected asset not found")
        return
      }

      if (getPropName(asset.department) === transferFormData.toDepartment) {
        setError("Asset is already in this department")
        return
      }

      try {
        const result = await createRequest({
          assetId: formData.assetId,
          assetName: asset.name,
          type: "asset-transfer",
          details: `Transfer from ${getPropName(asset.department)} to ${transferFormData.toDepartment}`,
          assetTransferData: {
            fromDepartment: getPropName(asset.department) || "",
            toDepartment: transferFormData.toDepartment,
            reason: transferFormData.transferReason,
          },
        })

        if (result.success) {
          setSuccess(true)
          notifyNewRequest("asset-transfer", asset.name, user.name)
          setTimeout(() => router.push("/admin-operation/my-requests"), 1500)
        } else {
          setError(result.message)
        }
      } catch (err) {
        console.error("Error creating request:", err)
        setError("Failed to create request")
      }
      return
    }

    if (formData.type === "asset-damage") {
      if (!formData.assetId) {
        setError("Please select an asset")
        return
      }
      if (!damageFormData.damageLevel) {
        setError("Please select damage level")
        return
      }
      if (!damageFormData.damageLocation) {
        setError("Please enter the location where damage occurred")
        return
      }
      if (!damageFormData.damageDescription) {
        setError("Please describe the damage")
        return
      }

      const asset = assets.find((a) => a.id === formData.assetId)
      if (!asset) {
        setError("Selected asset not found")
        return
      }

      const damagePercentage = damageLevels.find((d) => d.value === damageFormData.damageLevel)?.percentage || 0

      try {
        const result = await createRequest({
          assetId: formData.assetId,
          assetName: asset.name,
          type: "asset-damage",
          details: `Damage Level: ${damageFormData.damageLevel} (${damagePercentage}%) | Location: ${damageFormData.damageLocation}`,
          assetDamageData: {
            damageLevel: damageFormData.damageLevel as "saaid" | "dhex-dhexaad" | "iska-roon",
            location: damageFormData.damageLocation,
            description: damageFormData.damageDescription,
            damagePercentage: damagePercentage,
          },
        })

        if (result.success) {
          setSuccess(true)
          notifyNewRequest("asset-damage", asset.name, user.name)
          setTimeout(() => router.push("/admin-operation/my-requests"), 1500)
        } else {
          setError(result.message)
        }
      } catch (err) {
        console.error("Error creating request:", err)
        setError("Failed to create request")
      }
      return
    }

    if (formData.type === "asset-registration") {
      const missingFields = []
      if (!assetFormData.name) missingFields.push("Asset Name")
      if (!assetFormData.category) missingFields.push("Category")
      if (!assetFormData.department) missingFields.push("Department")
      if (!assetFormData.purchaseDate) missingFields.push("Purchase Date")
      if (!assetFormData.purchaseCost) missingFields.push("Purchase Cost")

      // Check all unit locations are filled
      const unitsWithoutLocation = unitDetails.filter(u => !u.location.trim())
      if (unitsWithoutLocation.length > 0) {
        missingFields.push(`Location unit(s): ${unitsWithoutLocation.map(u => `#${u.unitNumber}`).join(", ")}`)
      }

      if (missingFields.length > 0) {
        setError(`Fadlan buuxi meelahan muhiimka ah (*): ${missingFields.join(", ")}`)
        return
      }

      // Build location summary string for details
      const locationSummary = unitDetails.length === 1
        ? unitDetails[0].location
        : unitDetails.map(u => `Unit#${u.unitNumber}: ${u.location}`).join(" | ")

      try {
        const result = await createRequest({
          assetId: "new-asset",
          assetName: assetFormData.name,
          type: "asset-registration",
          details: `New asset request: ${assetFormData.name} x${assetFormData.quantity} | Locations: ${locationSummary}`,
          assetRegistrationData: {
            ...assetFormData,
            location: locationSummary,
          },
        })

        if (result.success) {
          setSuccess(true)
          notifyNewRequest("asset-registration", assetFormData.name, user.name)
          setTimeout(() => router.push("/admin-operation/my-requests"), 1500)
        } else {
          setError(result.message)
        }
      } catch (err) {
        console.error("Error creating request:", err)
        setError("Failed to create request")
      }
      return
    }

    if (formData.type === "repair-complete") {
      if (!formData.assetId) {
        setError("Please select an asset")
        return
      }

      const asset = assets.find((a) => a.id === formData.assetId)
      if (!asset) {
        setError("Selected asset not found")
        return
      }

      try {
        const result = await createRequest({
          assetId: formData.assetId,
          assetName: asset.name,
          type: "status-change",
          details: `Repair Complete: ${formData.details || "Asset returned from maintenance"}`,
          newStatus: formData.newStatus || "available",
        })

        if (result.success) {
          setSuccess(true)
          notifyNewRequest("status-change", asset.name, user.name)
          setFormData({ ...formData, assetId: "", type: "", details: "", newStatus: "" })
          setTimeout(() => router.push("/admin-operation/my-requests"), 1500)
        } else {
          setError(result.message)
        }
      } catch (err) {
        console.error("Error creating request:", err)
        setError("Failed to create request")
      }
      return
    }

    // Handle other request types
    if (!formData.assetId) {
      setError("Please select an asset")
      return
    }

    const asset = assets.find((a) => a.id === formData.assetId)
    if (!asset) {
      setError("Selected asset not found")
      return
    }

    try {
      const result = await createRequest({
        assetId: formData.assetId,
        assetName: asset.name,
        type: formData.type as "usage" | "status-change" | "maintenance" | "transfer",
        details: formData.details,
        newStatus: formData.newStatus as Asset["status"] | undefined,
      })

      if (result.success) {
        setSuccess(true)
        notifyNewRequest(formData.type, asset.name, user.name)
        setFormData({ ...formData, assetId: "", type: "", details: "", newStatus: "" })
        setTimeout(() => router.push("/admin-operation/my-requests"), 1500)
      } else {
        setError(result.message)
      }
    } catch (err) {
      console.error("Error creating request:", err)
      setError("Failed to create request")
    }
  }

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <DashboardLayout allowedRoles={["adminOperation"]}>
      <PageHeader title="Create Request" description="Submit a new request for an asset" />

      <Card className="max-w-3xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">Request Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  setFormData({ ...formData, type: value as typeof formData.type, assetId: "" })
                  setDamageFormData({ damageLevel: "", damageLocation: "", damageDescription: "" })
                  setTransferFormData({ toDepartment: "", transferReason: "" })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select request type" />
                </SelectTrigger>
                <SelectContent>
                  {requestTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.value === "asset-registration" && <Plus className="h-4 w-4 text-primary" />}
                        {type.value === "asset-damage" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                        {type.value === "asset-transfer" && <ArrowRightLeft className="h-4 w-4 text-blue-500" />}
                        <span>{type.label}</span>
                        <span className="text-muted-foreground text-xs ml-2">- {type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.type === "asset-transfer" && (
              <div className="space-y-6 border border-blue-500/30 rounded-lg p-4 bg-blue-500/5">
                <div className="flex items-center gap-2 text-blue-600">
                  <ArrowRightLeft className="h-5 w-5" />
                  <h3 className="font-semibold">Transfer Asset to Another Department</h3>
                </div>

                {/* Select Asset */}
                <div className="space-y-2">
                  <Label>Select Asset *</Label>
                  <Select
                    value={formData.assetId}
                    onValueChange={(value) => setFormData({ ...formData, assetId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an asset to transfer" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No assets available
                        </SelectItem>
                      ) : (
                        assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            <div className="flex items-center gap-2">
                              <span>{asset.name}</span>
                              <span className="text-muted-foreground text-xs">
                                ({asset.serialNumber}) - {getPropName(asset.department)}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedAsset && (
                    <div className="flex items-center gap-4 mt-2 text-sm p-3 bg-background rounded border">
                      <div>
                        <span className="text-muted-foreground">Serial:</span>{" "}
                        <strong>{selectedAsset.serialNumber}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Current Dept:</span>{" "}
                        <strong className="text-primary">{getPropName(selectedAsset.department)}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Value:</span>{" "}
                        <strong>{formatCurrency(selectedAsset.purchaseCost)}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Select Destination Department */}
                <div className="space-y-2">
                  <Label>Transfer To Department *</Label>
                  <Select
                    value={transferFormData.toDepartment}
                    onValueChange={(value) => setTransferFormData({ ...transferFormData, toDepartment: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments
                        .filter((dept) => !selectedAsset || dept.name !== getPropName(selectedAsset.department))
                        .map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {selectedAsset && transferFormData.toDepartment && (
                    <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-sm font-medium text-blue-600 flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4" />
                        {getPropName(selectedAsset.department)} → {transferFormData.toDepartment}
                      </p>
                    </div>
                  )}
                </div>

                {/* Transfer Reason */}
                <div className="space-y-2">
                  <Label>Reason for Transfer *</Label>
                  <Textarea
                    value={transferFormData.transferReason}
                    onChange={(e) => setTransferFormData({ ...transferFormData, transferReason: e.target.value })}
                    placeholder="Explain why this asset needs to be transferred..."
                    rows={3}
                    required
                  />
                </div>
              </div>
            )}

            {formData.type === "asset-damage" && (
              <div className="space-y-6 border border-destructive/30 rounded-lg p-4 bg-destructive/5">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="font-semibold">Report Asset Damage</h3>
                </div>

                {/* Select Asset */}
                <div className="space-y-2">
                  <Label>Select Asset *</Label>
                  <Select
                    value={formData.assetId}
                    onValueChange={(value) => setFormData({ ...formData, assetId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No assets available
                        </SelectItem>
                      ) : (
                        assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            <div className="flex items-center gap-2">
                              <span>{asset.name}</span>
                              <span className="text-muted-foreground text-xs">
                                ({getPropName(asset.category)}) - {formatCurrency(asset.purchaseCost)}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedAsset && (
                    <div className="flex items-center gap-4 mt-2 text-sm p-2 bg-background rounded border">
                      <span>
                        Current Value:{" "}
                        <strong className="text-primary">{formatCurrency(selectedAsset.purchaseCost)}</strong>
                      </span>
                      <span>
                        Condition:{" "}
                        <StatusBadge
                          status={
                            selectedAsset.condition === "Excellent"
                              ? "approved"
                              : selectedAsset.condition === "Good"
                                ? "pending"
                                : "rejected"
                          }
                        />
                      </span>
                    </div>
                  )}
                </div>

                {/* Damage Level */}
                <div className="space-y-2">
                  <Label>Damage Level (Heerka Dhaawaca) *</Label>
                  <Select
                    value={damageFormData.damageLevel}
                    onValueChange={(value) =>
                      setDamageFormData({ ...damageFormData, damageLevel: value as typeof damageFormData.damageLevel })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select damage level" />
                    </SelectTrigger>
                    <SelectContent>
                      {damageLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${level.percentage === 20 ? "text-destructive" : level.percentage === 10 ? "text-orange-500" : "text-yellow-500"}`}
                            >
                              {level.label}
                            </span>
                            <span className="text-muted-foreground text-xs">- {level.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedAsset && selectedDamageLevel && (
                    <div className="mt-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                      <p className="text-sm font-medium text-destructive">
                        Qiimaha laga jari doono:{" "}
                        {formatCurrency(selectedAsset.purchaseCost * (selectedDamageLevel.percentage / 100))} (
                        {selectedDamageLevel.percentage}%)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Qiimaha cusub:{" "}
                        {formatCurrency(selectedAsset.purchaseCost * (1 - selectedDamageLevel.percentage / 100))}
                      </p>
                    </div>
                  )}
                </div>

                {/* Damage Location */}
                <div className="space-y-2">
                  <Label>Meesha uu ka haloobay (Damage Location) *</Label>
                  <Input
                    value={damageFormData.damageLocation}
                    onChange={(e) => setDamageFormData({ ...damageFormData, damageLocation: e.target.value })}
                    placeholder="e.g., Lab A, Office 101, Warehouse..."
                    required
                  />
                </div>

                {/* Damage Description */}
                <div className="space-y-2">
                  <Label>Description (Sharaxaad) *</Label>
                  <Textarea
                    value={damageFormData.damageDescription}
                    onChange={(e) => setDamageFormData({ ...damageFormData, damageDescription: e.target.value })}
                    placeholder="Describe what happened and how the damage occurred..."
                    rows={4}
                    required
                  />
                </div>
              </div>
            )}
            {formData.type === "repair-complete" && (
              <div className="space-y-6 border border-green-500/30 rounded-lg p-4 bg-green-500/5">
                <div className="flex items-center gap-2 text-green-600">
                  <Package className="h-5 w-5" />
                  <h3 className="font-semibold">Return Asset from Maintenance</h3>
                </div>

                <div className="space-y-2">
                  <Label>Select Maintenance Asset *</Label>
                  <Select
                    value={formData.assetId}
                    onValueChange={(value) => setFormData({ ...formData, assetId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an asset in maintenance" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.filter(a => a.status === 'maintenance').length === 0 ? (
                        <SelectItem value="none" disabled>
                          No assets currently in maintenance
                        </SelectItem>
                      ) : (
                        assets
                          .filter(a => a.status === 'maintenance')
                          .map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                              <div className="flex items-center gap-2">
                                <span>{asset.name}</span>
                                <span className="text-muted-foreground text-xs">
                                  ({asset.serialNumber})
                                </span>
                              </div>
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Proposed New Status (Status-ka Cusub) *</Label>
                  <Select
                    value={formData.newStatus || "available"}
                    onValueChange={(value) => setFormData({ ...formData, newStatus: value as Asset["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available (Diyaar)</SelectItem>
                      <SelectItem value="disposed">Disposed (Lama hagaajin karo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Notes / Remarks</Label>
                  <Textarea
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    placeholder="Enter details about the repair..."
                    rows={3}
                  />
                </div>
              </div>
            )}


            {formData.type === "asset-registration" && (
              <div className="space-y-6 border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-2 text-primary">
                  <Package className="h-5 w-5" />
                  <h3 className="font-semibold">New Asset Information</h3>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Asset Name *</Label>
                    <Input
                      value={assetFormData.name}
                      onChange={(e) => setAssetFormData({ ...assetFormData, name: e.target.value })}
                      placeholder="Enter asset name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={assetFormData.category}
                      onValueChange={(value) => setAssetFormData({ ...assetFormData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Asset Type *</Label>
                    <Select
                      value={assetFormData.assetType}
                      onValueChange={(value) =>
                        setAssetFormData({ ...assetFormData, assetType: value as "Fixed" | "Movable" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fixed">Fixed</SelectItem>
                        <SelectItem value="Movable">Movable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={assetFormData.quantity}
                      onChange={(e) => handleQtyChange(Number.parseInt(e.target.value) || 1)}
                    />
                    {assetFormData.quantity > 1 && (
                      <p className="text-xs text-primary font-medium">
                        ✓ {assetFormData.quantity} units — location kasta gaar ahaan buuxi
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Condition *</Label>
                    <Select
                      value={assetFormData.condition}
                      onValueChange={(value) =>
                        setAssetFormData({ ...assetFormData, condition: value as "Excellent" | "Good" | "Fair" | "Poor" | "Damaged" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                        <SelectItem value="Damaged">Damaged</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department *</Label>
                    <Select
                      value={assetFormData.department}
                      onValueChange={(value) => setAssetFormData({ ...assetFormData, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Purchase Details */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-4">Purchase Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Supplier / Meesha laga soo iibsaday *</Label>
                      <Input
                        value={assetFormData.supplier}
                        onChange={(e) => setAssetFormData({ ...assetFormData, supplier: e.target.value })}
                        placeholder="e.g., Dubai, China, Local..."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Purchase Cost *</Label>
                      <Input
                        type="number"
                        min="1"
                        step="0.01"
                        value={assetFormData.purchaseCost || ""}
                        onChange={(e) =>
                          setAssetFormData({ ...assetFormData, purchaseCost: Number.parseFloat(e.target.value) || 0 })
                        }
                        placeholder="Geli qiimaha..."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Purchase Date *</Label>
                      <Input
                        type="date"
                        value={assetFormData.purchaseDate}
                        onChange={(e) => setAssetFormData({ ...assetFormData, purchaseDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Invoice Number</Label>
                      <Input
                        value={assetFormData.invoiceNumber}
                        onChange={(e) => setAssetFormData({ ...assetFormData, invoiceNumber: e.target.value })}
                        placeholder="INV-001"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Invoice Document</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleInvoiceUpload}
                          className="hidden"
                          id="invoice-upload"
                        />
                        <label
                          htmlFor="invoice-upload"
                          className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted"
                        >
                          <Upload className="h-4 w-4" />
                          Upload Invoice
                        </label>
                        {assetFormData.invoiceFile && (
                          <div className="flex items-center gap-2 text-sm text-primary">
                            <FileText className="h-4 w-4" />
                            <span>File uploaded</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setAssetFormData({ ...assetFormData, invoiceFile: "" })}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Per-Unit Location Table */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      Meesha Assets ({assetFormData.quantity} unit) *
                    </h4>
                    {assetFormData.quantity > 1 && (
                      <button
                        type="button"
                        onClick={copyLocationToAll}
                        className="flex items-center gap-1 text-xs text-primary border border-primary/30 rounded px-2 py-1 hover:bg-primary/5"
                      >
                        <Copy className="h-3 w-3" />
                        Koobi #1 oo dhan
                      </button>
                    )}
                  </div>
                  {assetFormData.quantity === 1 ? (
                    <div className="space-y-2">
                      <Input
                        value={unitDetails[0]?.location || ""}
                        onChange={(e) => updateUnitLocation(1, e.target.value)}
                        placeholder="Dhismaha / Qolka / Office"
                        required
                      />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40">
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground w-12">Unit</th>
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Location / Meesha *</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unitDetails.map((unit) => (
                            <tr key={unit.unitNumber} className="border-b last:border-0">
                              <td className="py-2 px-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                  {unit.unitNumber}
                                </span>
                              </td>
                              <td className="py-2 px-2">
                                <Input
                                  value={unit.location}
                                  onChange={(e) => updateUnitLocation(unit.unitNumber, e.target.value)}
                                  placeholder={`Meesha unit #${unit.unitNumber}`}
                                  className={!unit.location.trim() ? "border-destructive/50" : ""}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                {/* Additional Info */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-4">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Warranty Expiry</Label>
                      <Input
                        type="date"
                        value={assetFormData.warrantyExpiry}
                        onChange={(e) => setAssetFormData({ ...assetFormData, warrantyExpiry: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={assetFormData.notes}
                        onChange={(e) => setAssetFormData({ ...assetFormData, notes: e.target.value })}
                        placeholder="Additional notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other request types (usage, status-change, maintenance, transfer) */}
            {formData.type && !["asset-registration", "asset-damage", "asset-transfer"].includes(formData.type) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="asset">Select Asset</Label>
                  <Select
                    value={formData.assetId}
                    onValueChange={(value) => setFormData({ ...formData, assetId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name} ({getPropName(asset.category)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === "status-change" && (
                  <div className="space-y-2">
                    <Label htmlFor="newStatus">New Status</Label>
                    <Select
                      value={formData.newStatus}
                      onValueChange={(value) => setFormData({ ...formData, newStatus: value as Asset["status"] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="in-use">In Use</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="transferred">Transferred</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="details">Details</Label>
                  <Textarea
                    id="details"
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    placeholder="Provide additional details for your request..."
                    rows={4}
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-success/10 border border-success/30 rounded-md text-success text-sm">
                Request submitted successfully! Redirecting...
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!formData.type}>
              Submit Request
            </Button>
          </form>
        </CardContent>
      </Card >
    </DashboardLayout >
  )
}
