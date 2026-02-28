"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/common/page-header"
import { StatusBadge } from "@/components/common/status-badge"
import { AssetQRCard } from "@/components/asset-qr-card"
import { QRScanner } from "@/components/qr-scanner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useAuth } from "@/context/auth-context"
import {
  getAssetBySerialNumber,
  getAssets,
  createRequest,
  getDepartments,
  type Asset,
  type Department,
} from "@/services/api-service"
import { notifyNewRequest } from "@/services/sms-notification-service"
import {
  Search,
  QrCode,
  Package,
  MapPin,
  Building,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  X,
  Keyboard,
  ArrowRightLeft,
} from "lucide-react"

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

export function AssetSearchContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [foundAsset, setFoundAsset] = useState<Asset | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [qrAsset, setQrAsset] = useState<Asset | null>(null)
  const [recentAssets, setRecentAssets] = useState<Asset[]>([])

  const [scannerOpen, setScannerOpen] = useState(false)
  const [manualInput, setManualInput] = useState("")

  const [damageModalOpen, setDamageModalOpen] = useState(false)
  const [damageFormData, setDamageFormData] = useState({
    damageLevel: "" as "saaid" | "dhex-dhexaad" | "iska-roon" | "",
    damageLocation: "",
    damageDescription: "",
  })
  const [damageError, setDamageError] = useState("")
  const [damageSuccess, setDamageSuccess] = useState(false)

  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [transferFormData, setTransferFormData] = useState({
    newDepartment: "",
    transferReason: "",
  })
  const [transferError, setTransferError] = useState("")
  const [transferSuccess, setTransferSuccess] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [assetsData, departmentsData] = await Promise.all([
          getAssets(),
          getDepartments()
        ])
        const assets = Array.isArray(assetsData) ? assetsData : []
        setRecentAssets(assets.slice(-5).reverse())
        setDepartments(Array.isArray(departmentsData) ? departmentsData : [])
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }
    loadData()
  }, [])

  const handleQRScan = async (value: string) => {
    let serialNumber = value
    if (value.startsWith("ASSET:")) {
      serialNumber = value.replace("ASSET:", "")
    }

    setScannerOpen(false)
    setSearchTerm(serialNumber)

    try {
      const asset = await getAssetBySerialNumber(serialNumber)
      if (asset) {
        setFoundAsset(asset)
        setNotFound(false)
      } else {
        setFoundAsset(null)
        setNotFound(true)
      }
    } catch (error) {
      console.error("Error searching asset:", error)
      setFoundAsset(null)
      setNotFound(true)
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    try {
      const asset = await getAssetBySerialNumber(searchTerm.trim())
      if (asset) {
        setFoundAsset(asset)
        setNotFound(false)
      } else {
        setFoundAsset(null)
        setNotFound(true)
      }
    } catch (error) {
      console.error("Error searching asset:", error)
      setFoundAsset(null)
      setNotFound(true)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleDamageSubmit = async () => {
    setDamageError("")

    if (!user) {
      setDamageError("Waa inaad logged in ahaataa")
      return
    }

    if (!foundAsset) {
      setDamageError("Asset lama helin")
      return
    }

    if (!damageFormData.damageLevel) {
      setDamageError("Fadlan dooro heerka dhaawaca")
      return
    }

    if (!damageFormData.damageLocation) {
      setDamageError("Fadlan geli meesha uu ka haloobay")
      return
    }

    if (!damageFormData.damageDescription) {
      setDamageError("Fadlan sharax waxa dhacay")
      return
    }

    const damagePercentage = damageLevels.find((d) => d.value === damageFormData.damageLevel)?.percentage || 0

    try {
      const result = await createRequest({
        assetId: foundAsset.id,
        assetName: foundAsset.name,
        type: "asset-damage",
        details: `Damage Level: ${damageFormData.damageLevel} (${damagePercentage}%) | Location: ${damageFormData.damageLocation}`,
        assetDamageData: {
          damageLevel: damageFormData.damageLevel as "saaid" | "dhex-dhexaad" | "iska-roon",
          damagePercentage: damagePercentage,
          location: damageFormData.damageLocation,
          description: damageFormData.damageDescription,
        },
      })

      if (result.success) {
        setDamageSuccess(true)
        if (foundAsset) {
          notifyNewRequest("asset-damage", foundAsset.name, user?.name || "Unknown")
        }
        setTimeout(() => {
          setDamageModalOpen(false)
          setDamageSuccess(false)
          setDamageFormData({ damageLevel: "", damageLocation: "", damageDescription: "" })
          router.push("/admin-operation/my-requests")
        }, 1500)
      } else {
        setDamageError(result.message)
      }
    } catch (error) {
      setDamageError("Khalad ayaa dhacay markii la dirayay request-ka")
    }
  }

  const getPropName = (prop: string | { name: string } | undefined) => {
    if (!prop) return ""
    return typeof prop === 'object' ? prop.name : prop
  }

  const assetDept = foundAsset ? getPropName(foundAsset.department) : ""

  const handleTransferSubmit = async () => {
    setTransferError("")

    if (!user) {
      setTransferError("Waa inaad logged in ahaataa")
      return
    }

    if (!foundAsset) {
      setTransferError("Asset lama helin")
      return
    }

    if (!transferFormData.newDepartment) {
      setTransferError("Fadlan dooro department-ka cusub")
      return
    }

    if (transferFormData.newDepartment === assetDept) {
      setTransferError("Department-ka cusub waa inuu ka duwan yahay kan hadda")
      return
    }

    if (!transferFormData.transferReason) {
      setTransferError("Fadlan geli sababta wareejinta")
      return
    }

    try {
      const result = await createRequest({
        assetId: foundAsset.id,
        assetName: foundAsset.name,
        type: "asset-transfer",
        details: `Transfer from ${assetDept} to ${transferFormData.newDepartment}`,
        assetTransferData: {
          fromDepartment: assetDept,
          toDepartment: transferFormData.newDepartment,
          reason: transferFormData.transferReason,
        },
      })

      if (result.success) {
        setTransferSuccess(true)
        if (foundAsset) {
          notifyNewRequest("asset-transfer", foundAsset.name, user?.name || "Unknown")
        }
        setTimeout(() => {
          setTransferModalOpen(false)
          setTransferSuccess(false)
          setTransferFormData({ newDepartment: "", transferReason: "" })
          router.push("/admin-operation/my-requests")
        }, 1500)
      } else {
        setTransferError(result.message)
      }
    } catch (error) {
      setTransferError("Khalad ayaa dhacay markii la dirayay request-ka")
    }
  }

  const selectedDamageLevel = damageLevels.find((d) => d.value === damageFormData.damageLevel)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0)
  }

  const isAdminOperation = user?.role === "adminOperation"

  const availableDepartments = departments.filter((d) => d.name !== assetDept)

  return (
    <DashboardLayout allowedRoles={["adminOfficer", "adminOperation"]}>
      <PageHeader title="Raadi Asset" description="Ku raadi asset serial number-kiisa ama QR code scan" />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Geli Serial Number (tusaale: CO0001)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                onKeyDown={handleKeyPress}
                className="pl-9 font-mono text-lg"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch} className="gap-2">
                <Search className="h-4 w-4" />
                Raadi
              </Button>
              {isAdminOperation && (
                <Button
                  onClick={() => setScannerOpen(true)}
                  variant="outline"
                  className="gap-2 bg-primary/10 border-primary hover:bg-primary/20"
                >
                  <QrCode className="h-4 w-4" />
                  Scan QR
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {foundAsset && (
        <Card className="mb-6 border-primary">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Serial Number</p>
                <CardTitle className="text-2xl font-mono text-primary">{foundAsset.serialNumber}</CardTitle>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                {isAdminOperation && (
                  <>
                    <Button
                      onClick={() => setTransferModalOpen(true)}
                      variant="outline"
                      className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                      Transfer
                    </Button>
                    <Button onClick={() => setDamageModalOpen(true)} variant="destructive" className="gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Report Damage
                    </Button>
                  </>
                )}
                <Button onClick={() => setQrAsset(foundAsset)} variant="outline" className="gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Code
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Asset Name</p>
                  <p className="font-medium">{foundAsset.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{getPropName(foundAsset.department)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{foundAsset.location || "N/A"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{getPropName(foundAsset.category)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <StatusBadge status={foundAsset.status} variant="asset" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Condition</p>
                <p className="font-medium">{foundAsset.condition}</p>
              </div>

              {!isAdminOperation && (
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Purchase Cost</p>
                    <p className="font-medium">{formatCurrency(foundAsset.purchaseCost)}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Assigned To</p>
                <p className="font-medium">{getPropName(foundAsset.assignedTo) || "N/A"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Custodian</p>
                <p className="font-medium">{foundAsset.custodian || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {notFound && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive font-medium">Asset lama helin serial number-kan: {searchTerm}</p>
            <p className="text-sm text-muted-foreground mt-1">Fadlan hubi in serial number-ku sax yahay</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assets-kii Ugu Dambeeyay</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAssets.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Wali assets lama diiwaan galin</p>
          ) : (
            <div className="space-y-2">
              {recentAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => {
                    setSearchTerm(asset.serialNumber)
                    setFoundAsset(asset)
                    setNotFound(false)
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-primary">{asset.serialNumber}</span>
                    <span className="text-sm">{asset.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{getPropName(asset.department)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        setQrAsset(asset)
                      }}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code View Modal */}
      <Dialog open={!!qrAsset} onOpenChange={() => setQrAsset(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Asset QR Code</DialogTitle>
            <DialogDescription>Print ama download QR code-ka asset-kan</DialogDescription>
          </DialogHeader>
          {qrAsset && <AssetQRCard asset={qrAsset} onClose={() => setQrAsset(null)} />}
        </DialogContent>
      </Dialog>

      {/* QR Scanner Modal */}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Scan QR Code
            </DialogTitle>
            <DialogDescription>QR code-ka dhig camera-ga hortiisa si loo scan gareeyo</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <QRScanner onScan={handleQRScan} onError={(err) => console.log("Scanner error:", err)} />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">AMA</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Label className="text-sm font-medium flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Gacanta Ku Geli Serial Number
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Tusaale: CO0001"
                  className="font-mono"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && manualInput.length >= 2) {
                      handleQRScan(manualInput)
                    }
                  }}
                />
                <Button
                  onClick={() => manualInput.length >= 2 && handleQRScan(manualInput)}
                  disabled={manualInput.length < 2}
                >
                  Raadi
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setScannerOpen(false)} className="gap-2">
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Damage Report Modal */}
      <Dialog open={damageModalOpen} onOpenChange={setDamageModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Report Asset Damage
            </DialogTitle>
            <DialogDescription>
              Soo gudbi damage report asset-kan: {foundAsset?.serialNumber} - {foundAsset?.name}
            </DialogDescription>
          </DialogHeader>

          {damageSuccess ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-16 w-16 text-primary mb-4" />
              <p className="text-lg font-medium">Damage Report la soo gudbiyay!</p>
              <p className="text-sm text-muted-foreground">Admin Officer ayaa approve-garayn doona</p>
            </div>
          ) : (
            <div className="space-y-4">
              {foundAsset && (
                <div className="p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-mono font-bold text-primary">{foundAsset.serialNumber}</p>
                    <p className="text-sm">{foundAsset.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{getPropName(foundAsset.department)}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Heerka Dhaawaca (Damage Level) *</Label>
                <Select
                  value={damageFormData.damageLevel}
                  onValueChange={(value) =>
                    setDamageFormData((prev) => ({
                      ...prev,
                      damageLevel: value as "saaid" | "dhex-dhexaad" | "iska-roon",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Dooro heerka dhaawaca" />
                  </SelectTrigger>
                  <SelectContent>
                    {damageLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <span className="font-medium">{level.label}</span>
                          <span className="text-muted-foreground ml-2">({level.percentage}%)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDamageLevel && (
                  <p className="text-sm text-muted-foreground">{selectedDamageLevel.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Meesha uu ka Haloobay (Damage Location) *</Label>
                <Input
                  placeholder="Tusaale: Qolka 201, Dhismaha A"
                  value={damageFormData.damageLocation}
                  onChange={(e) => setDamageFormData((prev) => ({ ...prev, damageLocation: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Sharaxaad (Description) *</Label>
                <Textarea
                  placeholder="Sharax waxa dhacay iyo sababta..."
                  value={damageFormData.damageDescription}
                  onChange={(e) => setDamageFormData((prev) => ({ ...prev, damageDescription: e.target.value }))}
                  rows={3}
                />
              </div>

              {damageError && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                  {damageError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDamageModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleDamageSubmit} variant="destructive" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Submit Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <ArrowRightLeft className="h-5 w-5" />
              Transfer Asset to Another Department
            </DialogTitle>
            <DialogDescription>
              Soo gudbi transfer request asset-kan: {foundAsset?.serialNumber} - {foundAsset?.name}
            </DialogDescription>
          </DialogHeader>

          {transferSuccess ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="h-16 w-16 text-primary mb-4" />
              <p className="text-lg font-medium">Transfer Request la soo gudbiyay!</p>
              <p className="text-sm text-muted-foreground">Admin Officer ayaa approve-garayn doona</p>
            </div>
          ) : (
            <div className="space-y-4">
              {foundAsset && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-mono font-bold text-primary">{foundAsset.serialNumber}</p>
                      <p className="text-sm">{foundAsset.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Current Department</p>
                      <p className="font-bold text-primary">{getPropName(foundAsset.department)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Department-ka Cusub (New Department) *</Label>
                <Select
                  value={transferFormData.newDepartment}
                  onValueChange={(value) => setTransferFormData((prev) => ({ ...prev, newDepartment: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Dooro department-ka cusub" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDepartments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableDepartments.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Departments kale ma jiraan. Fadlan ka samee departments page-ka.
                  </p>
                )}
              </div>

              {transferFormData.newDepartment && foundAsset && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Wareejinta:</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium">{assetDept}</span>
                    <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-600">{transferFormData.newDepartment}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Sababta Wareejinta (Transfer Reason) *</Label>
                <Textarea
                  placeholder="Sharax sababta loo wareejinayo asset-kan department-kan cusub..."
                  value={transferFormData.transferReason}
                  onChange={(e) => setTransferFormData((prev) => ({ ...prev, transferReason: e.target.value }))}
                  rows={3}
                />
              </div>

              {transferError && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                  {transferError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setTransferModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleTransferSubmit}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                  disabled={availableDepartments.length === 0}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Submit Transfer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
