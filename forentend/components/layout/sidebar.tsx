"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import {
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  FileText,
  CheckCircle,
  LogOut,
  Menu,
  X,
  UserCog,
  Building2,
  Tags,
  DollarSign,
  Search,
  History,
  Shield,
  ChevronRight,
  Boxes,
  AlertTriangle,
  Settings,
  BarChart3,
  Database,
  MessageSquare,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  group?: string
}

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, group: "Overview" },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, group: "Overview" },
  { label: "Manage Officers", href: "/admin/manage-officers", icon: Users, group: "Users" },
  { label: "Manage Operations", href: "/admin-officer/manage-operations", icon: UserCog, group: "Users" },
  { label: "Departments", href: "/admin-officer/departments", icon: Building2, group: "Settings" },
  { label: "Categories", href: "/admin-officer/categories", icon: Tags, group: "Settings" },
  { label: "Register Asset", href: "/admin-officer/register-asset", icon: Package, group: "Assets" },
  { label: "Asset List", href: "/admin-officer/assets", icon: ClipboardList, group: "Assets" },
  { label: "Damaged Assets", href: "/admin-officer/damaged-assets", icon: AlertTriangle, group: "Assets" },
  { label: "Disposed Assets", href: "/admin-officer/disposed-assets", icon: Trash2, group: "Assets" },
  { label: "Asset Search", href: "/assets/search", icon: Search, group: "Assets" },
  { label: "Approvals", href: "/admin-officer/approvals", icon: CheckCircle, group: "Requests" },
  { label: "Activity Log", href: "/admin-officer/activity-log", icon: History, group: "Requests" },
  { label: "Financial Report", href: "/financial-report", icon: DollarSign, group: "Reports" },
  { label: "SMS Messages", href: "/admin/messages", icon: MessageSquare, group: "System" },
  { label: "Backup & Restore", href: "/admin/backup", icon: Database, group: "System" },
  { label: "System Settings", href: "/admin/system-settings", icon: Settings, group: "System" },
]

const adminOfficerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin-officer", icon: LayoutDashboard, group: "Overview" },
  { label: "Manage Operations", href: "/admin-officer/manage-operations", icon: UserCog, group: "Users" },
  { label: "Departments", href: "/admin-officer/departments", icon: Building2, group: "Settings" },
  { label: "Categories", href: "/admin-officer/categories", icon: Tags, group: "Settings" },
  { label: "Register Asset", href: "/admin-officer/register-asset", icon: Package, group: "Assets" },
  { label: "Asset List", href: "/admin-officer/assets", icon: ClipboardList, group: "Assets" },
  { label: "Damaged Assets", href: "/admin-officer/damaged-assets", icon: AlertTriangle, group: "Assets" },
  { label: "Disposed Assets", href: "/admin-officer/disposed-assets", icon: Trash2, group: "Assets" },
  { label: "Asset Search", href: "/assets/search", icon: Search, group: "Assets" },
  { label: "Approvals", href: "/admin-officer/approvals", icon: CheckCircle, group: "Requests" },
  { label: "Activity Log", href: "/admin-officer/activity-log", icon: History, group: "Requests" },
  { label: "Financial Report", href: "/financial-report", icon: DollarSign, group: "Reports" },
  { label: "SMS Operations", href: "/admin-officer/messages", icon: MessageSquare, group: "Messages" },
]

const adminOperationNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin-operation", icon: LayoutDashboard, group: "Overview" },
  { label: "Create Request", href: "/admin-operation/create-request", icon: FileText, group: "Requests" },
  { label: "My Requests", href: "/admin-operation/my-requests", icon: ClipboardList, group: "Requests" },
  { label: "Asset Search", href: "/assets/search", icon: Search, group: "Assets" },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const getNavItems = (): NavItem[] => {
    switch (user?.role) {
      case "admin":
        return adminNavItems
      case "adminOfficer":
        return adminOfficerNavItems
      case "adminOperation":
        return adminOperationNavItems
      default:
        return []
    }
  }

  const getRoleLabel = (): string => {
    switch (user?.role) {
      case "admin":
        return "System Admin"
      case "adminOfficer":
        return "Admin Officer"
      case "adminOperation":
        return "Admin Operation"
      default:
        return ""
    }
  }

  const getRoleBadgeColor = (): string => {
    switch (user?.role) {
      case "admin":
        return "bg-primary/20 text-primary border-primary/30"
      case "adminOfficer":
        return "bg-info/20 text-info border-info/30"
      case "adminOperation":
        return "bg-success/20 text-success border-success/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const navItems = getNavItems()

  // Group nav items
  const groupedItems = navItems.reduce((acc, item) => {
    const group = item.group || "Other"
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {} as Record<string, NavItem[]>)

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-card border-border shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-72 bg-sidebar flex flex-col z-40 transition-transform duration-300 shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg overflow-hidden">
              <img
                src="https://siufilesharing.s3.us-east-1.amazonaws.com/logo-white.png"
                alt="SIU Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-sidebar-foreground tracking-tight text-sm">SIU Assets Management</h1>
              <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border mt-1", getRoleBadgeColor())}>
                {getRoleLabel()}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin">
          {Object.entries(groupedItems).map(([group, items]) => (
            <div key={group} className="mb-4">
              <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{group}</p>
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:translate-x-1",
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        isActive ? "bg-white/20" : "bg-muted group-hover:bg-background"
                      )}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1">{item.label}</span>
                      {isActive && <ChevronRight className="h-4 w-4 opacity-70" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User info & Logout */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/30">
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-background/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
              <span className="text-sm font-bold text-primary">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl h-11"
            onClick={() => {
              logout()
              window.location.href = "/"
            }}
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <LogOut className="h-4 w-4" />
            </div>
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  )
}
