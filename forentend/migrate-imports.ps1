# PowerShell Script - Automatic Migration
# This script will update all imports from local-storage-service to api-service

$files = @(
    "app/financial-report/page.tsx",
    "app/assets/search/asset-search-content.tsx",
    "app/admin-operation/page.tsx",
    "app/admin-operation/my-requests/page.tsx",
    "app/admin-operation/create-request/page.tsx",
    "app/admin-officer/messages/page.tsx",
    "app/admin-officer/register-asset/page.tsx",
    "app/admin-officer/departments/page.tsx",
    "app/admin/messages/page.tsx",
    "app/admin/manage-officers/page.tsx",
    "app/admin-officer/damaged-assets/page.tsx",
    "app/admin-officer/categories/page.tsx",
    "app/admin-officer/assets/asset-list-content.tsx",
    "app/admin-officer/approvals/page.tsx",
    "app/admin/analytics/page.tsx",
    "app/admin-officer/activity-log/activity-log-content.tsx"
)

$basePath = "c:/Users/ugaar/Music/siu aset/forentend"

foreach ($file in $files) {
    $fullPath = Join-Path $basePath $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        $newContent = $content -replace 'from "@/services/local-storage-service"', 'from "@/services/api-service"'
        Set-Content $fullPath $newContent -NoNewline
        Write-Host "✅ Updated: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ Not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Migration complete! Updated $($files.Count) files." -ForegroundColor Cyan
