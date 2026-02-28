import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: number
    label: string
  }
  className?: string
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info"
}

export function StatCard({ title, value, icon, trend, className, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "bg-card border-border",
    primary: "bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30",
    success: "bg-gradient-to-br from-success/20 to-success/5 border-success/30",
    warning: "bg-gradient-to-br from-warning/20 to-warning/5 border-warning/30",
    danger: "bg-gradient-to-br from-destructive/20 to-destructive/5 border-destructive/30",
    info: "bg-gradient-to-br from-info/20 to-info/5 border-info/30",
  }

  const iconStyles = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/20 text-primary",
    success: "bg-success/20 text-success",
    warning: "bg-warning/20 text-warning",
    danger: "bg-destructive/20 text-destructive",
    info: "bg-info/20 text-info",
  }

  return (
    <Card className={cn("border transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5", variantStyles[variant], className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl md:text-3xl font-bold text-foreground mt-2 truncate">{value}</p>
            {trend && (
              <div className={cn("flex items-center gap-1 text-sm mt-2", trend.value >= 0 ? "text-success" : "text-destructive")}>
                <span className="font-medium">
                  {trend.value >= 0 ? "+" : ""}{trend.value}%
                </span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", iconStyles[variant])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
