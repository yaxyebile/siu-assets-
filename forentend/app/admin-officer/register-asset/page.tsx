"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Upload, X, FileText, MapPin, Copy } from "lucide-react"
import {
  createAsset,
  getDepartments,
  getCategories,
  type Asset,
  type Department,
  type Category,
} from "@/services/api-service"
import { notifyNewAssetRegistered } from "@/services/sms-notification-service"
import { useAuth } from "@/context/auth-context"

const assetTypes: Asset["assetType"][] = ["Fixed", "Movable"]
const conditions: Asset["condition"][] = ["Excellent", "Good", "Fair", "Poor", "Damaged"]

// Represents the location/serial for each individual unit
interface UnitDetail {
  unitNumber: number
  location: string
  serialNumber: string
}

export default function RegisterAssetPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [departments, setDepartments] = useState<Department[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [serialPreview, setSerialPreview] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Per-unit details (location + optional serial per unit)
  const [unitDetails, setUnitDetails] = useState<UnitDetail[]>([{ unitNumber: 1, location: "", serialNumber: "" }])

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    assetType: "Fixed" as Asset["assetType"],
    quantity: 1,
    condition: "Excellent" as Asset["condition"],
    status: "available" as Asset["status"],
    department: "",
    assignedTo: "",
    custodian: "",
    purchaseDate: "",
    purchaseCost: 0,
    supplier: "",
    invoiceNumber: "",
    warrantyExpiry: "",
    maintenanceRequired: false,
    notes: "",
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [depts, cats] = await Promise.all([getDepartments(), getCategories()])
        setDepartments(Array.isArray(depts) ? depts : [])
        setCategories(Array.isArray(cats) ? cats : [])
      } catch (err) {
        console.error("Error loading data", err)
      }
    }
    loadData()
  }, [])

  // Sync unitDetails array length when quantity changes
  const handleQuantityChange = (qty: number) => {
    const newQty = Math.max(1, qty)
    updateField("quantity", newQty)
    setUnitDetails(prev => {
      const updated: UnitDetail[] = []
      for (let i = 1; i <= newQty; i++) {
        const existing = prev.find(u => u.unitNumber === i)
        updated.push(existing ?? { unitNumber: i, location: "", serialNumber: "" })
      }
      return updated
    })
  }

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }))
    const catCode = value.substring(0, 2).toUpperCase()
    setSerialPreview(`${catCode}000X`)
  }

  // Copy first unit location to all units
  const copyLocationToAll = () => {
    const firstLocation = unitDetails[0]?.location || ""
    if (!firstLocation) return
    setUnitDetails(prev => prev.map(u => ({ ...u, location: firstLocation })))
  }

  const updateUnit = (unitNumber: number, field: "location" | "serialNumber", value: string) => {
    setUnitDetails(prev =>
      prev.map(u => u.unitNumber === unitNumber ? { ...u, [field]: value } : u)
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size too large (max 5MB)")
        return
      }
      setInvoiceFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setInvoicePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeFile = () => {
    setInvoiceFile(null)
    setInvoicePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    // Validate required base fields
    const missing = []
    if (!formData.name) missing.push("Asset Name")
    if (!formData.category) missing.push("Category")
    if (!formData.department) missing.push("Department")
    if (!formData.purchaseDate) missing.push("Purchase Date")
    if (!formData.purchaseCost) missing.push("Purchase Cost")

    // Validate that every unit has a location
    const unitsWithoutLocation = unitDetails.filter(u => !u.location.trim())
    if (unitsWithoutLocation.length > 0) {
      missing.push(`Location for unit(s): ${unitsWithoutLocation.map(u => `#${u.unitNumber}`).join(", ")}`)
    }

    if (missing.length > 0) {
      setError(`Fadlan buuxi meelaha muhiimka ah (*): ${missing.join(", ")}`)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    let invoiceFileData: string | undefined = undefined
    if (invoicePreview) {
      invoiceFileData = invoicePreview
    }

    setIsSubmitting(true)
    let successCount = 0
    const errors: string[] = []

    try {
      // Register each unit as a separate asset with its own location
      for (const unit of unitDetails) {
        try {
          const result = await createAsset({
            ...formData,
            location: unit.location,
            serialNumber: unit.serialNumber || undefined,
            currentValue: formData.purchaseCost,
            invoiceFile: invoiceFileData,
          })

          if (result.success) {
            successCount++
            if (result.asset && successCount === 1) {
              const department = result.asset.department
              const deptName = department && typeof department === 'object' && 'name' in department
                ? (department as any).name
                : String(department || "Unassigned")
              notifyNewAssetRegistered(
                result.asset.name,
                result.asset.serialNumber,
                deptName,
                user?.name || "Unknown"
              )
            }
          } else {
            errors.push(`Unit #${unit.unitNumber}: ${result.message}`)
          }
        } catch (unitErr: any) {
          errors.push(`Unit #${unit.unitNumber}: ${unitErr.message || "Unknown error"}`)
        }
      }

      if (successCount === unitDetails.length) {
        setSuccess(true)
        window.scrollTo({ top: 0, behavior: "smooth" })
        setTimeout(() => router.push("/admin-officer/assets"), 1800)
      } else if (successCount > 0) {
        setError(`${successCount} asset(s) registered. Errors: ${errors.join(" | ")}`)
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        setError(errors.join(" | ") || "Error creating assets")
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateField = (field: string, value: string | number | boolean) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <DashboardLayout allowedRoles={["admin", "adminOfficer"]}>
      <PageHeader title="Diiwaan Geli Asset Cusub" description="Ku dar asset cusub nidaamka" />

      {(departments.length === 0 || categories.length === 0) && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-amber-800 text-sm">
            {departments.length === 0 && categories.length === 0
              ? "Fadlan marka hore ku dar Departments iyo Categories ka hor intaadan diiwaan gelin assets."
              : departments.length === 0
                ? "Fadlan marka hore ku dar Departments ka hor intaadan diiwaan gelin assets."
                : "Fadlan marka hore ku dar Categories ka hor intaadan diiwaan gelin assets."}
          </p>
          <div className="flex gap-2 mt-2">
            {departments.length === 0 && (
              <Button size="sm" variant="outline" onClick={() => router.push("/admin-officer/departments")}>
                Ku Dar Departments
              </Button>
            )}
            {categories.length === 0 && (
              <Button size="sm" variant="outline" onClick={() => router.push("/admin-officer/categories")}>
                Ku Dar Categories
              </Button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Error/Success Messages */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-600 px-4 py-3 rounded-lg">
            <p className="font-medium">✅ Guul!</p>
            <p className="text-sm">
              {formData.quantity} asset(s) si guul leh ayaa loo diiwaan galiyay! Waa la kuu wareejinayaa...
            </p>
          </div>
        )}

        {/* 1. ASSET BASIC INFORMATION */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1. Macluumaadka Aasaasiga ah</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="tusaale: Laptop, Printer, Desk"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Asset Category *</Label>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dooro category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {serialPreview && (
                  <p className="text-xs text-muted-foreground">
                    Serial Preview: <span className="font-mono font-bold text-primary">{serialPreview}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetType">Asset Type</Label>
                <Select value={formData.assetType} onValueChange={(value) => updateField("assetType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dooro type" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (Tirada Assets)</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.quantity}
                  onChange={(e) => handleQuantityChange(Number.parseInt(e.target.value) || 1)}
                />
                {formData.quantity > 1 && (
                  <p className="text-xs text-primary font-medium">
                    ✓ {formData.quantity} units — meesha (location) kasta waa in gaar ahaan lagu geliyaa
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Asset Condition</Label>
                <Select value={formData.condition} onValueChange={(value) => updateField("condition", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {conditions.map((cond) => (
                      <SelectItem key={cond} value={cond}>
                        {cond}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Asset Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Asset["status"]) => updateField("status", value)}
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
            </div>
          </CardContent>
        </Card>

        {/* 2. OWNERSHIP */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2. Lahaanshaha (Department)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select value={formData.department} onValueChange={(value) => updateField("department", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dooro department" />
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

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => updateField("assignedTo", e.target.value)}
                  placeholder="Department / Office / Qof"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custodian">Custodian</Label>
                <Input
                  id="custodian"
                  value={formData.custodian}
                  onChange={(e) => updateField("custodian", e.target.value)}
                  placeholder="Qofka masuulka ka ah"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. PER-UNIT LOCATIONS — shown when qty >= 1 */}
        <Card className={formData.quantity > 1 ? "border-primary/40 shadow-md" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                3. Meelaha Assets ({formData.quantity} unit)
              </CardTitle>
              {formData.quantity > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyLocationToAll}
                  className="flex items-center gap-1 text-xs"
                >
                  <Copy className="h-3 w-3" />
                  Koobi Location #1 oo dhan
                </Button>
              )}
            </div>
            {formData.quantity > 1 && (
              <p className="text-sm text-muted-foreground mt-1">
                Fadlan geli meesha kasta oo ay ku taallaan {formData.quantity} assets-ka. Kasta waxay heli doontaa serial number gaar ah.
              </p>
            )}
          </CardHeader>
          <CardContent>
            {formData.quantity === 1 ? (
              // Single unit — simple input
              <div className="space-y-2">
                <Label htmlFor="location-1">Location *</Label>
                <Input
                  id="location-1"
                  value={unitDetails[0]?.location || ""}
                  onChange={(e) => updateUnit(1, "location", e.target.value)}
                  placeholder="Dhismaha / Qolka / Office (tusaale: Block A, Room 101)"
                  required
                />
              </div>
            ) : (
              // Multiple units — table view
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground w-16">Unit #</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                        Location / Meesha *
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground w-44">
                        Serial No (Optional)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {unitDetails.map((unit) => (
                      <tr key={unit.unitNumber} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {unit.unitNumber}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            value={unit.location}
                            onChange={(e) => updateUnit(unit.unitNumber, "location", e.target.value)}
                            placeholder={`Meesha unit #${unit.unitNumber} (tusaale: Block A, Qol 10${unit.unitNumber})`}
                            className={!unit.location.trim() ? "border-destructive/50 focus:border-destructive" : ""}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            value={unit.serialNumber}
                            onChange={(e) => updateUnit(unit.unitNumber, "serialNumber", e.target.value)}
                            placeholder="Auto-generated"
                            className="font-mono text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <span className="text-destructive">*</span>
                  Location walba waa in la buuxiyaa. Serial number-ka haddaad meesha ka tagto, system-ku wuu si auto ah u sameeysaa.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. PURCHASE DETAILS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">4. Faahfaahinta Iibsiga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => updateField("purchaseDate", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseCost">Purchase Cost ($ per unit) *</Label>
                <Input
                  id="purchaseCost"
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.purchaseCost || ""}
                  onChange={(e) => updateField("purchaseCost", Number.parseFloat(e.target.value) || 0)}
                  placeholder="Qiimaha hal unit..."
                  required
                />
                {formData.quantity > 1 && formData.purchaseCost > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Wadarta: <span className="font-bold text-foreground">${(formData.purchaseCost * formData.quantity).toLocaleString()}</span> ({formData.quantity} × ${formData.purchaseCost})
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier / Vendor</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => updateField("supplier", e.target.value)}
                  placeholder="Shirkadda laga iibsaday"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => updateField("invoiceNumber", e.target.value)}
                  placeholder="Invoice / Reference No"
                />
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label>Invoice Document (PDF ama Sawir)</Label>
              <div className="flex flex-col gap-4">
                {!invoiceFile ? (
                  <div
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">Riix halkan ama soo jiid invoice file-ka</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">PDF, JPG, PNG (Max 5MB)</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    {invoicePreview && invoiceFile.type.startsWith("image/") ? (
                      <img
                        src={invoicePreview}
                        alt="Invoice preview"
                        className="h-20 w-20 object-cover rounded border"
                      />
                    ) : (
                      <div className="h-20 w-20 bg-primary/10 rounded flex items-center justify-center">
                        <FileText className="h-8 w-8 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{invoiceFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(invoiceFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={removeFile}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5. TRACKING & MANAGEMENT */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">5. Raadraaca & Maamulka</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                <Input
                  id="warrantyExpiry"
                  type="date"
                  value={formData.warrantyExpiry}
                  onChange={(e) => updateField("warrantyExpiry", e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="maintenanceRequired"
                  checked={formData.maintenanceRequired}
                  onCheckedChange={(checked) => updateField("maintenanceRequired", checked)}
                />
                <Label htmlFor="maintenanceRequired">Maintenance Required</Label>
              </div>
            </div>

            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary">Serial Number — Automatic</p>
              <p className="text-xs text-muted-foreground mt-1">
                Serial number wuxuu si automatic ah u sameysmi doonaa mid kasta. Tusaale: Category &quot;Computers&quot; →{" "}
                <span className="font-mono font-bold">CO1234</span>, <span className="font-mono font-bold">CO5678</span>...
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Description</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Faahfaahin dheeraad ah..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Jooji
          </Button>
          <Button
            type="submit"
            disabled={departments.length === 0 || categories.length === 0 || isSubmitting}
            className="min-w-[160px]"
          >
            {isSubmitting
              ? `Diiwaan gelid... (${unitDetails.filter(u => u.location).length}/${formData.quantity})`
              : `Diiwaan Geli ${formData.quantity > 1 ? `${formData.quantity} Assets` : "Asset"}`
            }
          </Button>
        </div>
      </form>
    </DashboardLayout>
  )
}
