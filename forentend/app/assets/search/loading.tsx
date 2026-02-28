import { Skeleton, SkeletonPageHeader } from "@/components/ui/skeleton-card"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background lg:ml-72 p-4 pt-16 lg:pt-6 lg:p-8">
      <div className="space-y-6">
        <SkeletonPageHeader />
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="flex gap-3 mt-4">
              <Skeleton className="h-10 w-full max-w-md rounded-lg" />
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
