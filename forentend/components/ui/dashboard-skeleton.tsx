import React from "react"
// Reusable Skeleton primitives with shimmer wave effect

function SkeletonBox({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <div
            className={`skeleton-shimmer rounded-xl ${className}`}
            style={style}
        />
    )
}

// ── Officer Dashboard Skeleton ──
export function OfficerDashboardSkeleton() {
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Hero Header */}
            <div className="rounded-2xl overflow-hidden h-36 skeleton-shimmer" />

            {/* 4 stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-2xl p-6 border border-border/40 space-y-4 bg-card">
                        <div className="flex items-center justify-between">
                            <SkeletonBox className="h-4 w-24" />
                            <SkeletonBox className="h-9 w-9 rounded-xl" />
                        </div>
                        <SkeletonBox className="h-10 w-16" />
                        <SkeletonBox className="h-3 w-20" />
                    </div>
                ))}
            </div>

            {/* Financial panel */}
            <div className="rounded-2xl h-28 skeleton-shimmer border border-border/20" />

            {/* Recent requests */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-6 py-5 border-b border-border flex items-center gap-3">
                    <SkeletonBox className="h-9 w-9 rounded-xl" />
                    <div className="space-y-2">
                        <SkeletonBox className="h-5 w-36" />
                        <SkeletonBox className="h-3 w-48" />
                    </div>
                </div>
                <div className="p-6 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/40">
                            <div className="flex items-center gap-3">
                                <SkeletonBox className="h-7 w-20 rounded-lg" />
                                <div className="space-y-2">
                                    <SkeletonBox className="h-4 w-32" />
                                    <SkeletonBox className="h-3 w-24" />
                                </div>
                            </div>
                            <SkeletonBox className="h-6 w-20 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ── Operation Dashboard Skeleton ──
export function OperationDashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Hero Header */}
            <div className="rounded-2xl overflow-hidden h-36 skeleton-shimmer" />

            {/* 4 stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-2xl p-6 border border-border/40 space-y-4 bg-card">
                        <div className="flex items-center justify-between">
                            <SkeletonBox className="h-4 w-20" />
                            <SkeletonBox className="h-9 w-9 rounded-xl" />
                        </div>
                        <SkeletonBox className="h-10 w-12" />
                        <SkeletonBox className="h-3 w-24" />
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="rounded-2xl p-5 border border-border/40 bg-card">
                        <div className="flex items-center gap-4">
                            <SkeletonBox className="h-12 w-12 rounded-xl" />
                            <div className="space-y-2 flex-1">
                                <SkeletonBox className="h-4 w-28" />
                                <SkeletonBox className="h-3 w-36" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Requests */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-6 py-5 border-b border-border flex items-center gap-3">
                    <SkeletonBox className="h-9 w-9 rounded-xl" />
                    <div className="space-y-2">
                        <SkeletonBox className="h-5 w-28" />
                        <SkeletonBox className="h-3 w-44" />
                    </div>
                </div>
                <div className="p-6 space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border/40">
                            <div className="flex items-center gap-3">
                                <SkeletonBox className="h-7 w-24 rounded-lg" />
                                <SkeletonBox className="h-4 w-40" />
                            </div>
                            <SkeletonBox className="h-6 w-20 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ── Financial Report Skeleton ──
export function FinancialReportSkeleton() {
    return (
        <div className="space-y-6">
            {/* Hero */}
            <div className="rounded-2xl h-36 skeleton-shimmer" />

            {/* 4 summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-2xl p-6 border border-border/40 bg-card space-y-4">
                        <div className="flex items-center justify-between">
                            <SkeletonBox className="h-4 w-28" />
                            <SkeletonBox className="h-9 w-9 rounded-xl" />
                        </div>
                        <SkeletonBox className="h-8 w-32" />
                        <SkeletonBox className="h-3 w-20" />
                    </div>
                ))}
            </div>

            {/* Net Value panel */}
            <div className="rounded-2xl h-32 skeleton-shimmer border border-border/20" />

            {/* Detail table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-6 py-5 border-b border-border flex items-center gap-3">
                    <SkeletonBox className="h-9 w-9 rounded-xl" />
                    <div className="space-y-2">
                        <SkeletonBox className="h-5 w-52" />
                        <SkeletonBox className="h-3 w-32" />
                    </div>
                </div>
                <div className="p-6 space-y-3">
                    {/* Table header */}
                    <div className="grid grid-cols-5 gap-3 pb-2 border-b border-border/40">
                        {[...Array(5)].map((_, i) => (
                            <SkeletonBox key={i} className="h-4" />
                        ))}
                    </div>
                    {/* Table rows */}
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="grid grid-cols-5 gap-3 py-2">
                            {[...Array(5)].map((_, j) => (
                                <SkeletonBox key={j} className="h-5" style={{ opacity: 1 - i * 0.08 }} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ── Generic Page Skeleton (for other pages) ──
export function PageSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <SkeletonBox className="h-8 w-48" />
                <SkeletonBox className="h-4 w-72" />
            </div>
            {/* Card */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-6 py-5 border-b border-border">
                    <SkeletonBox className="h-6 w-40" />
                </div>
                <div className="p-6 space-y-3">
                    {[...Array(rows)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <SkeletonBox className="h-10 w-10 rounded-xl shrink-0" />
                            <div className="flex-1 space-y-2">
                                <SkeletonBox className="h-4 w-full max-w-xs" />
                                <SkeletonBox className="h-3 w-2/3" />
                            </div>
                            <SkeletonBox className="h-7 w-20 rounded-full shrink-0" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
