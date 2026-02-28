"use client"

import React from "react"
import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Download, 
  Upload, 
  FileJson, 
  HardDrive,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  FileText,
  Users,
  Package,
  ClipboardList
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DataSummary {
  users: unknown[]
  assets: unknown[]
  requests: unknown[]
  departments: unknown[]
  categories: unknown[]
}

function getDataSummary(): DataSummary {
  const users = JSON.parse(localStorage.getItem("asset_management_users") || "[]")
  const assets = JSON.parse(localStorage.getItem("asset_management_assets") || "[]")
  const requests = JSON.parse(localStorage.getItem("asset_management_requests") || "[]")
  const departments = JSON.parse(localStorage.getItem("asset_management_departments") || "[]")
  const categories = JSON.parse(localStorage.getItem("asset_management_categories") || "[]")

  return { users, assets, requests, departments, categories }
}

export default function BackupPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importSuccess, setImportSuccess] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState<DataSummary>({
    users: [],
    assets: [],
    requests: [],
    departments: [],
    categories: []
  })

  useEffect(() => {
    // Only access localStorage on client side
    const users = JSON.parse(localStorage.getItem("asset_management_users") || "[]")
    const assets = JSON.parse(localStorage.getItem("asset_management_assets") || "[]")
    const requests = JSON.parse(localStorage.getItem("asset_management_requests") || "[]")
    const departments = JSON.parse(localStorage.getItem("asset_management_departments") || "[]")
    const categories = JSON.parse(localStorage.getItem("asset_management_categories") || "[]")

    setSummary({ users, assets, requests, departments, categories })
  }, [])

  const handleExport = () => {
    setIsExporting(true)
    setError("")

    try {
      const data = {
        exportDate: new Date().toISOString(),
        version: "1.0",
        data: {
          users: JSON.parse(localStorage.getItem("asset_management_users") || "[]"),
          assets: JSON.parse(localStorage.getItem("asset_management_assets") || "[]"),
          requests: JSON.parse(localStorage.getItem("asset_management_requests") || "[]"),
          departments: JSON.parse(localStorage.getItem("asset_management_departments") || "[]"),
          categories: JSON.parse(localStorage.getItem("asset_management_categories") || "[]"),
          serialCounters: JSON.parse(localStorage.getItem("asset_management_serial_counters") || "{}"),
        }
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `siu-assets-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 3000)
    } catch (err) {
      setError("Failed to export data")
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setError("")

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        if (!data.data) {
          throw new Error("Invalid backup file format")
        }

        // Restore data
        if (data.data.users) {
          localStorage.setItem("asset_management_users", JSON.stringify(data.data.users))
        }
        if (data.data.assets) {
          localStorage.setItem("asset_management_assets", JSON.stringify(data.data.assets))
        }
        if (data.data.requests) {
          localStorage.setItem("asset_management_requests", JSON.stringify(data.data.requests))
        }
        if (data.data.departments) {
          localStorage.setItem("asset_management_departments", JSON.stringify(data.data.departments))
        }
        if (data.data.categories) {
          localStorage.setItem("asset_management_categories", JSON.stringify(data.data.categories))
        }
        if (data.data.serialCounters) {
          localStorage.setItem("asset_management_serial_counters", JSON.stringify(data.data.serialCounters))
        }

        setImportSuccess(true)
        setTimeout(() => {
          setImportSuccess(false)
          window.location.reload()
        }, 2000)
      } catch (err) {
        setError("Invalid backup file. Please select a valid JSON backup.")
      } finally {
        setIsImporting(false)
      }
    }
    reader.readAsText(file)
  }

  const currentSummary = summary

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <PageHeader 
        title="Backup & Restore" 
        description="Export and import system data"
      />

      {exportSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-success" />
          <span className="text-success font-medium">Data exported successfully!</span>
        </div>
      )}

      {importSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-success" />
          <span className="text-success font-medium">Data imported successfully! Reloading...</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="text-destructive font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Export Card */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>Download all system data as JSON</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/50 space-y-3">
              <p className="text-sm text-muted-foreground">The export will include:</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{summary.users.length} Users</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>{summary.assets.length} Assets</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  <span>{summary.requests.length} Requests</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span>{summary.departments.length} Departments</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="w-full gap-2"
              size="lg"
            >
              {isExporting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4" />
              )}
              {isExporting ? "Exporting..." : "Export to JSON"}
            </Button>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                <Upload className="h-6 w-6 text-warning" />
              </div>
              <div>
                <CardTitle>Import Data</CardTitle>
                <CardDescription>Restore data from a backup file</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Warning</p>
                  <p className="text-sm text-muted-foreground">
                    Importing will overwrite all existing data. Make sure to export current data first.
                  </p>
                </div>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="w-full gap-2 border-warning/50 hover:bg-warning/10 bg-transparent"
                  size="lg"
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isImporting ? "Importing..." : "Import from JSON"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Import Backup Data</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will replace all existing data with the imported data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Label htmlFor="backup-file">Select backup file</Label>
                  <Input 
                    id="backup-file"
                    type="file" 
                    accept=".json"
                    onChange={handleImport}
                    className="mt-2"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* Current Data Summary */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center">
              <HardDrive className="h-5 w-5 text-info" />
            </div>
            <div>
              <CardTitle>Current Data Summary</CardTitle>
              <CardDescription>Overview of stored data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{currentSummary.users.length}</p>
              <p className="text-sm text-muted-foreground">Users</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <Package className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{currentSummary.assets.length}</p>
              <p className="text-sm text-muted-foreground">Assets</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <ClipboardList className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">{currentSummary.requests.length}</p>
              <p className="text-sm text-muted-foreground">Requests</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <Database className="h-8 w-8 text-info mx-auto mb-2" />
              <p className="text-2xl font-bold">{currentSummary.departments.length}</p>
              <p className="text-sm text-muted-foreground">Departments</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <FileText className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold">{currentSummary.categories.length}</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
