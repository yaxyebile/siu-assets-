"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PageHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  Shield, 
  Database, 
  Bell, 
  Palette, 
  Lock,
  Save,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Server,
  HardDrive
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState({
    systemName: "SIU Assets Management",
    dailyDepreciation: 0.068,
    damageRateSevere: 20,
    damageRateModerate: 10,
    damageRateMinor: 5,
    enableNotifications: true,
    enableAutoBackup: false,
    sessionTimeout: 30,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [storageSize, setStorageSize] = useState("0.00")

  useEffect(() => {
    // Calculate storage size on client side only
    let total = 0
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += localStorage.getItem(key)?.length || 0
      }
    }
    setStorageSize((total / 1024).toFixed(2))
  }, [])

  const handleSave = () => {
    setIsSaving(true)
    // Simulate save
    setTimeout(() => {
      localStorage.setItem("system_settings", JSON.stringify(settings))
      setIsSaving(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }, 1000)
  }

  const handleClearAllData = () => {
    localStorage.clear()
    window.location.href = "/"
  }

  const getStorageSize = () => {
    return storageSize;
  }

  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <PageHeader 
        title="System Settings" 
        description="Configure system-wide settings and preferences"
        action={
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      {saveSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-success" />
          <span className="text-success font-medium">Settings saved successfully!</span>
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="general" className="rounded-lg gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="financial" className="rounded-lg gap-2">
            <Database className="h-4 w-4" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="danger" className="rounded-lg gap-2">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Basic system configuration</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>System Name</Label>
                  <Input 
                    value={settings.systemName}
                    onChange={(e) => setSettings({...settings, systemName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input 
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Enable Notifications</p>
                    <p className="text-sm text-muted-foreground">Show system notifications</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, enableNotifications: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Auto Backup</p>
                    <p className="text-sm text-muted-foreground">Automatically backup data daily</p>
                  </div>
                </div>
                <Switch 
                  checked={settings.enableAutoBackup}
                  onCheckedChange={(checked) => setSettings({...settings, enableAutoBackup: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Storage Info */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center">
                  <Server className="h-5 w-5 text-info" />
                </div>
                <div>
                  <CardTitle>Storage Information</CardTitle>
                  <CardDescription>Current data storage usage</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <div>
                  <p className="font-medium">LocalStorage Used</p>
                  <p className="text-sm text-muted-foreground">Browser storage space</p>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {storageSize} KB
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Settings */}
        <TabsContent value="financial" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                  <Database className="h-5 w-5 text-success" />
                </div>
                <div>
                  <CardTitle>Financial Configuration</CardTitle>
                  <CardDescription>Depreciation and damage rate settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Daily Depreciation Rate (%)</Label>
                <Input 
                  type="number"
                  step="0.001"
                  value={settings.dailyDepreciation}
                  onChange={(e) => setSettings({...settings, dailyDepreciation: parseFloat(e.target.value)})}
                />
                <p className="text-sm text-muted-foreground">Current: {settings.dailyDepreciation}% per day</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 space-y-2">
                  <Label className="text-destructive">Severe Damage Rate (%)</Label>
                  <Input 
                    type="number"
                    value={settings.damageRateSevere}
                    onChange={(e) => setSettings({...settings, damageRateSevere: parseInt(e.target.value)})}
                    className="border-destructive/30"
                  />
                  <p className="text-xs text-muted-foreground">Saaid - Severe damage</p>
                </div>
                <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 space-y-2">
                  <Label className="text-warning">Moderate Damage Rate (%)</Label>
                  <Input 
                    type="number"
                    value={settings.damageRateModerate}
                    onChange={(e) => setSettings({...settings, damageRateModerate: parseInt(e.target.value)})}
                    className="border-warning/30"
                  />
                  <p className="text-xs text-muted-foreground">Dhex-dhexaad - Moderate</p>
                </div>
                <div className="p-4 rounded-xl bg-success/10 border border-success/20 space-y-2">
                  <Label className="text-success">Minor Damage Rate (%)</Label>
                  <Input 
                    type="number"
                    value={settings.damageRateMinor}
                    onChange={(e) => setSettings({...settings, damageRateMinor: parseInt(e.target.value)})}
                    className="border-success/30"
                  />
                  <p className="text-xs text-muted-foreground">Iska Roon - Minor</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Access control and security options</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50 flex items-center justify-between">
                <div>
                  <p className="font-medium">Password Policy</p>
                  <p className="text-sm text-muted-foreground">Minimum 6 characters required</p>
                </div>
                <Badge>Active</Badge>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 flex items-center justify-between">
                <div>
                  <p className="font-medium">Role-Based Access</p>
                  <p className="text-sm text-muted-foreground">Users can only access permitted pages</p>
                </div>
                <Badge variant="secondary" className="bg-success/20 text-success">Enabled</Badge>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 flex items-center justify-between">
                <div>
                  <p className="font-medium">Data Encryption</p>
                  <p className="text-sm text-muted-foreground">LocalStorage data protection</p>
                </div>
                <Badge variant="outline">Basic</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger" className="space-y-6">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions - proceed with caution</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-background border border-destructive/30 flex items-center justify-between">
                <div>
                  <p className="font-medium">Clear All Data</p>
                  <p className="text-sm text-muted-foreground">Delete all users, assets, and requests permanently</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Clear All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all data including users, assets, requests, departments, and categories.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearAllData} className="bg-destructive hover:bg-destructive/90">
                        Yes, delete everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
