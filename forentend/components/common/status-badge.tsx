import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  variant?: "asset" | "request"
}

export function StatusBadge({ status, variant = "request" }: StatusBadgeProps) {
  const getStyles = () => {
    if (variant === "asset") {
      switch (status) {
        case "available":
          return "bg-success/10 text-success border-success/20"
        case "in-use":
          return "bg-primary/10 text-primary border-primary/20"
        case "maintenance":
          return "bg-warning/10 text-warning border-warning/20"
        case "transferred":
          return "bg-muted text-muted-foreground border-border"
        default:
          return "bg-muted text-muted-foreground border-border"
      }
    }
    // Request variant
    switch (status) {
      case "pending":
        return "bg-warning/10 text-warning border-warning/20"
      case "approved":
        return "bg-success/10 text-success border-success/20"
      case "rejected":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
        getStyles(),
      )}
    >
      {status.replace("-", " ")}
    </span>
  )
}
