import { Suspense } from "react"
import { AssetSearchContent } from "./asset-search-content"

export default function AssetSearchPage() {
  return (
    <Suspense fallback={null}>
      <AssetSearchContent />
    </Suspense>
  )
}
