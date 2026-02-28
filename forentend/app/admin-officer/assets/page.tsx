"use client"

import { Suspense } from "react"
import { AssetListContent } from "./asset-list-content"

export default function AssetListPage() {
  return (
    <Suspense fallback={null}>
      <AssetListContent />
    </Suspense>
  )
}
