"use client"

import type React from "react"

import { useAuth } from "@/context/auth-context"
import { Sidebar } from "./sidebar"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type { User } from "@/services/local-storage-service"

interface DashboardLayoutProps {
  children: React.ReactNode
  allowedRoles: User["role"][]
}

export function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/")
      } else if (user.role && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard
        switch (user.role) {
          case "admin":
            router.push("/admin")
            break
          case "adminOfficer":
            router.push("/admin-officer")
            break
          case "adminOperation":
            router.push("/admin-operation")
            break
        }
      }
    }
  }, [user, isLoading, router, allowedRoles])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !user.role || !allowedRoles.includes(user.role)) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-72 min-h-screen">
        <div className="p-4 pt-16 lg:pt-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
