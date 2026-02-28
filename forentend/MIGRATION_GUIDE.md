# Files That Need Migration to API Service

## Total Files: 19

### ✅ Already Updated
1. `/context/auth-context.tsx` - ✅ DONE
2. `/services/sms-notification-service.ts` - ✅ DONE

### ⏳ Need to Update (19 files)

#### Admin Pages (4 files)
1. `/app/admin/page.tsx`
   - Line 8: `import { getUsers, getAssets, getRequests, type User } from "@/services/local-storage-service"`
   - **Change to:** `import { getUsers, getAssets, getRequests, type User } from "@/services/api-service"`
   - **Add:** async/await to data fetching

2. `/app/admin/manage-officers/page.tsx`
   - Line 31: `import { getUsersByRole, createUser, updateUser, deleteUser, type User } from "@/services/local-storage-service"`
   - **Change to:** `import { getUsersByRole, createUser, updateUser, deleteUser, type User } from "@/services/api-service"`
   - **Add:** async/await to all CRUD operations

3. `/app/admin/messages/page.tsx`
   - Line 12: `import { getUsers, type User } from "@/services/local-storage-service"`
   - **Change to:** `import { getUsers, type User } from "@/services/api-service"`
   - **Add:** async/await to getUsers

4. `/app/admin/analytics/page.tsx`
   - Line 8: `import { getUsers, getAssets, getRequests, getDepartments, getCategories } from "@/services/local-storage-service"`
   - **Change to:** `import { getDashboardAnalytics } from "@/services/api-service"`
   - **Note:** Use `getDashboardAnalytics()` instead of individual calls

#### Admin Officer Pages (9 files)
5. `/app/admin-officer/page.tsx`
   - Line 9: `import { getUsers, getAssets, getRequests, type Request } from "@/services/local-storage-service"`
   - **Change to:** `import { getUsers, getAssets, getRequests, type Request } from "@/services/api-service"`
   - **Add:** async/await

6. `/app/admin-officer/manage-operations/page.tsx`
   - Line 31: `import { getUsersByRole, createUser, updateUser, deleteUser, type User } from "@/services/local-storage-service"`
   - **Change to:** `import { getUsersByRole, createUser, updateUser, deleteUser, type User } from "@/services/api-service"`
   - **Add:** async/await to all CRUD operations

7. `/app/admin-officer/register-asset/page.tsx`
   - Line 23: Multiple imports from local-storage-service
   - **Change to:** `import { ... } from "@/services/api-service"`
   - **Add:** async/await to createAsset

8. `/app/admin-officer/assets/asset-list-content.tsx`
   - Line 45: Multiple imports from local-storage-service
   - **Change to:** `import { ... } from "@/services/api-service"`
   - **Add:** async/await to all operations

9. `/app/admin-officer/damaged-assets/page.tsx`
   - Line 30: Multiple imports from local-storage-service
   - **Change to:** `import { getDamagedAssets, ... } from "@/services/api-service"`
   - **Add:** async/await

10. `/app/admin-officer/approvals/page.tsx`
    - Line 29: Multiple imports from local-storage-service
    - **Change to:** `import { ... } from "@/services/api-service"`
    - **Add:** async/await to approve/reject operations

11. `/app/admin-officer/departments/page.tsx`
    - Line 20: Multiple imports from local-storage-service
    - **Change to:** `import { ... } from "@/services/api-service"`
    - **Add:** async/await to all CRUD operations

12. `/app/admin-officer/categories/page.tsx`
    - Line 20: Multiple imports from local-storage-service
    - **Change to:** `import { ... } from "@/services/api-service"`
    - **Add:** async/await to all CRUD operations

13. `/app/admin-officer/messages/page.tsx`
    - Line 12: `import { getUsersByRole, type User } from "@/services/local-storage-service"`
    - **Change to:** `import { getUsersByRole, type User } from "@/services/api-service"`
    - **Add:** async/await

14. `/app/admin-officer/activity-log/activity-log-content.tsx`
    - Line 15: `import { getRequests, getAssets, type Request, type Asset } from "@/services/local-storage-service"`
    - **Change to:** `import { getActivityLogs } from "@/services/api-service"`
    - **Note:** Use `getActivityLogs()` API endpoint instead

#### Admin Operation Pages (3 files)
15. `/app/admin-operation/page.tsx`
    - Line 11: `import { getRequestsByUser, type Request } from "@/services/local-storage-service"`
    - **Change to:** `import { getMyRequests, type Request } from "@/services/api-service"`
    - **Note:** Use `getMyRequests()` instead of `getRequestsByUser(userId)`

16. `/app/admin-operation/my-requests/page.tsx`
    - Line 11: `import { getRequestsByUser, type Request } from "@/services/local-storage-service"`
    - **Change to:** `import { getMyRequests, type Request } from "@/services/api-service"`
    - **Note:** Use `getMyRequests()` instead

17. `/app/admin-operation/create-request/page.tsx`
    - Line 25: Multiple imports from local-storage-service
    - **Change to:** `import { ... } from "@/services/api-service"`
    - **Add:** async/await to createRequest

#### Asset Search (1 file)
18. `/app/assets/search/asset-search-content.tsx`
    - Line 27: Multiple imports from local-storage-service
    - **Change to:** `import { getAssetBySerialNumber, ... } from "@/services/api-service"`
    - **Add:** async/await

#### Financial Report (1 file)
19. `/app/financial-report/page.tsx`
    - Line 9: `import { getAssets, getRequests, type Asset, type Request } from "@/services/local-storage-service"`
    - **Change to:** `import { getFinancialReport } from "@/services/api-service"`
    - **Note:** Use `getFinancialReport()` API endpoint instead

---

## Migration Pattern for Each File

### Step 1: Update Import
```typescript
// OLD
import { getUsers, createUser } from "@/services/local-storage-service"

// NEW
import { getUsers, createUser } from "@/services/api-service"
```

### Step 2: Add Loading State
```typescript
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
```

### Step 3: Make Functions Async
```typescript
// OLD
const loadData = () => {
  const data = getUsers()
  setUsers(data)
}

// NEW
const loadData = async () => {
  try {
    setLoading(true)
    const data = await getUsers()
    setUsers(data)
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

### Step 4: Handle CRUD Operations
```typescript
// OLD
const handleCreate = (userData) => {
  const result = createUser(userData)
  if (result.success) {
    loadData()
  }
}

// NEW
const handleCreate = async (userData) => {
  try {
    const result = await createUser(userData)
    if (result.success) {
      await loadData()
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  } catch (err) {
    toast.error(err.message)
  }
}
```

### Step 5: Add Loading UI
```typescript
if (loading) return <div>Loading...</div>
if (error) return <div>Error: {error}</div>
```

---

## Quick Migration Script

You can use this find-and-replace pattern in VS Code:

### Find:
```
from "@/services/local-storage-service"
```

### Replace:
```
from "@/services/api-service"
```

**Then manually add async/await to all data operations!**

---

## Testing Each File After Migration

1. Open the page in browser
2. Check browser console for errors
3. Check network tab for API calls
4. Verify data loads correctly
5. Test CRUD operations
6. Check error handling

---

## Priority Order

### High Priority (Core Functionality)
1. `/app/admin/page.tsx` - Dashboard
2. `/app/admin-officer/page.tsx` - Officer Dashboard
3. `/app/admin-operation/page.tsx` - Operation Dashboard
4. `/app/admin/manage-officers/page.tsx` - User management
5. `/app/admin-officer/register-asset/page.tsx` - Asset registration
6. `/app/admin-officer/approvals/page.tsx` - Request approvals

### Medium Priority (Management)
7. `/app/admin-officer/assets/asset-list-content.tsx` - Asset list
8. `/app/admin-officer/manage-operations/page.tsx` - Operations management
9. `/app/admin-operation/create-request/page.tsx` - Create requests
10. `/app/admin-operation/my-requests/page.tsx` - View requests
11. `/app/admin-officer/departments/page.tsx` - Departments
12. `/app/admin-officer/categories/page.tsx` - Categories

### Low Priority (Additional Features)
13. `/app/admin-officer/damaged-assets/page.tsx` - Damaged assets
14. `/app/assets/search/asset-search-content.tsx` - Asset search
15. `/app/financial-report/page.tsx` - Financial reports
16. `/app/admin/analytics/page.tsx` - Analytics
17. `/app/admin-officer/activity-log/activity-log-content.tsx` - Activity logs
18. `/app/admin/messages/page.tsx` - Messages
19. `/app/admin-officer/messages/page.tsx` - Messages

---

## Common Issues & Solutions

### Issue: "Cannot read property of undefined"
**Cause:** Data not loaded yet
**Solution:** Add loading state and conditional rendering

### Issue: "Function is not async"
**Cause:** Forgot to add async keyword
**Solution:** Add `async` before function definition

### Issue: "Unhandled promise rejection"
**Cause:** Missing try-catch
**Solution:** Wrap API calls in try-catch blocks

### Issue: "Data not updating after create/update"
**Cause:** Not reloading data after operation
**Solution:** Call `await loadData()` after successful operation

---

## Completion Checklist

- [ ] All 19 files updated with new imports
- [ ] All data fetching functions are async
- [ ] All CRUD operations are async
- [ ] Loading states added
- [ ] Error handling added
- [ ] Tested login flow
- [ ] Tested user management
- [ ] Tested asset management
- [ ] Tested request workflow
- [ ] Tested departments/categories
- [ ] Tested reports
- [ ] Tested search
- [ ] All pages load without errors

---

**Ready to start migration! Follow the priority order and test each file after updating.** 🚀
