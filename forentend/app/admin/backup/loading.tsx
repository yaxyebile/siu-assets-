import { SkeletonForm } from "@/components/ui/skeleton-card"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background lg:ml-72 p-4 pt-16 lg:pt-6 lg:p-8">
      <SkeletonForm />
    </div>
  )
}
