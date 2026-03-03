// API Service for SIU Assets Management System
// Connects to Node.js + MongoDB backend

const API_BASE_URL = '/api'

// Types (matching backend MongoDB schemas)
export interface User {
    _id?: string
    id: string
    name: string
    email: string
    password?: string
    phone?: string
    role: "admin" | "adminOfficer" | "adminOperation"
    createdAt?: string
    updatedAt?: string
}

export interface Department {
    _id?: string
    id: string
    name: string
    description: string
    createdAt: string
}

export interface Category {
    _id?: string
    id: string
    name: string
    description: string
    createdAt: string
}

export interface Asset {
    _id?: string
    id: string
    name: string
    serialNumber: string
    category: string | { _id: string; name: string } | null
    department: string | { _id: string; name: string } | null
    status: "available" | "in-use" | "maintenance" | "disposed" | "transferred" | "missing"
    condition: "Excellent" | "Good" | "Fair" | "Poor" | "Damaged"
    purchaseDate: string
    purchaseCost: number
    currentValue: number
    supplier?: string
    assignedTo?: string | { _id: string; name: string; email?: string } | null
    location: string
    maintenanceRequired: boolean
    damageReports?: Array<{
        reportedBy: string
        reportedByName: string
        damageLevel: "saaid" | "dhex-dhexaad" | "iska-roon"
        damagePercentage: number
        location: string
        description: string
        date: string
    }>
    createdAt?: string
    updatedAt?: string

    // Legacy fields for compatibility
    assetType?: "Fixed" | "Movable"
    quantity?: number
    custodian?: string
    invoiceNumber?: string
    invoiceFile?: string
    warrantyExpiry?: string
    notes?: string
}

export interface Request {
    _id?: string
    id: string
    assetId?: string
    assetName: string
    type: "asset-registration" | "asset-damage" | "asset-transfer" | "status-change" | "maintenance" | "usage" | "transfer"
    requestedBy: string
    requestedByName: string
    status: "pending" | "approved" | "rejected"
    details: string
    newStatus?: string
    submittedAt?: string
    reviewedAt?: string
    reviewedBy?: string
    reviewedByName?: string
    rejectionReason?: string
    assetDamageData?: {
        damageLevel: "saaid" | "dhex-dhexaad" | "iska-roon"
        damagePercentage: number
        location: string
        description: string
    }
    assetTransferData?: {
        fromDepartment: string
        toDepartment: string
        fromDepartmentName?: string
        toDepartmentName?: string
        reason: string
    }
    assetRegistrationData?: {
        serialNumber: string
        category: string
        categoryName?: string
        department: string
        departmentName?: string
        purchaseDate: string
        purchaseCost: number
        supplier: string
        location: string
    }
    createdAt?: string
    updatedAt?: string
}

// Helper function to get token from localStorage
const getToken = (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
}

// Helper function to handle API requests
const apiRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; error?: string }> => {
    const token = getToken()

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    // Add custom headers from options
    if (options.headers) {
        Object.assign(headers, options.headers)
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        })

        const text = await response.text()
        let data: any = {}
        try {
            data = JSON.parse(text)
        } catch (e) {
            console.error('Failed to parse API response:', text.substring(0, 100))
            data = { message: response.statusText || 'Server error' }
        }

        if (!response.ok) {
            // Handle authentication errors
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token')
                localStorage.removeItem('currentUser')
                if (typeof window !== 'undefined') {
                    window.location.href = '/'
                }
            }

            return {
                success: false,
                message: data.message || 'Request failed',
                error: data.message
            }
        }

        return {
            success: true,
            data: data.data,
            message: data.message
        }
    } catch (error) {
        console.error('API request error:', error)
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Network error',
            error: error instanceof Error ? error.message : 'Network error'
        }
    }
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

export const login = async (
    email: string,
    password: string
): Promise<{ success: boolean; message: string; user?: User; token?: string }> => {
    const result = await apiRequest<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    })

    if (result.success && result.data) {
        // Store token and user
        localStorage.setItem('token', result.data.token)

        // Convert _id to id for compatibility
        const user = {
            ...result.data.user,
            id: result.data.user._id || result.data.user.id
        }
        localStorage.setItem('currentUser', JSON.stringify(user))

        return {
            success: true,
            message: result.message || 'Login successful',
            user,
            token: result.data.token
        }
    }

    return {
        success: false,
        message: result.message || 'Login failed'
    }
}

export const logout = (): void => {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
}

export const getCurrentUser = (): User | null => {
    if (typeof window === 'undefined') return null
    const userStr = localStorage.getItem('currentUser')
    if (!userStr) return null
    try {
        return JSON.parse(userStr)
    } catch (e) {
        console.error('Failed to parse currentUser from localStorage')
        return null
    }
}

// ============================================================================
// USERS
// ============================================================================

export const getUsers = async (): Promise<User[]> => {
    try {
        const result = await apiRequest<User[]>('/users')
        if (result.success && Array.isArray(result.data)) {
            // Convert _id to id for compatibility
            return result.data.map(user => ({
                ...user,
                id: user._id || user.id
            }))
        }
    } catch (e) {
        console.error('getUsers error:', e)
    }
    return []
}

export const getUserById = async (id: string): Promise<User | undefined> => {
    const result = await apiRequest<User>(`/users/${id}`)
    if (result.success && result.data) {
        return {
            ...result.data,
            id: result.data._id || result.data.id
        }
    }
    return undefined
}

export const getUsersByRole = async (role: User['role']): Promise<User[]> => {
    try {
        const result = await apiRequest<User[]>(`/users/role/${role}`)
        if (result.success && Array.isArray(result.data)) {
            return result.data.map(user => ({
                ...user,
                id: user._id || user.id
            }))
        }
    } catch (e) {
        console.error('getUsersByRole error:', e)
    }
    return []
}

export const createUser = async (
    user: Omit<User, 'id' | '_id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; message: string; user?: User }> => {
    const result = await apiRequest<User>('/users', {
        method: 'POST',
        body: JSON.stringify(user)
    })

    if (result.success && result.data) {
        return {
            success: true,
            message: result.message || 'User created successfully',
            user: {
                ...result.data,
                id: result.data._id || result.data.id
            }
        }
    }

    return {
        success: false,
        message: result.message || 'Failed to create user'
    }
}

export const updateUser = async (
    id: string,
    updates: Partial<User>
): Promise<{ success: boolean; message: string }> => {
    const result = await apiRequest<User>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    })

    return {
        success: result.success,
        message: result.message || (result.success ? 'User updated successfully' : 'Failed to update user')
    }
}

export const deleteUser = async (id: string): Promise<{ success: boolean; message: string }> => {
    const result = await apiRequest(`/users/${id}`, {
        method: 'DELETE'
    })

    return {
        success: result.success,
        message: result.message || (result.success ? 'User deleted successfully' : 'Failed to delete user')
    }
}

// ============================================================================
// ASSETS
// ============================================================================

export const getAssets = async (filters?: {
    status?: string
    department?: string
    category?: string
    search?: string
}): Promise<Asset[]> => {
    try {
        const queryParams = filters ? new URLSearchParams(filters as any).toString() : ''
        const endpoint = queryParams ? `/assets?${queryParams}` : '/assets'

        const result = await apiRequest<Asset[]>(endpoint)
        if (result.success && Array.isArray(result.data)) {
            return result.data.map(asset => ({
                ...asset,
                id: asset._id || asset.id
            }))
        }
    } catch (e) {
        console.error('getAssets error:', e)
    }
    return []
}

export const getAssetById = async (id: string): Promise<Asset | undefined> => {
    const result = await apiRequest<Asset>(`/assets/${id}`)
    if (result.success && result.data) {
        return {
            ...result.data,
            id: result.data._id || result.data.id
        }
    }
    return undefined
}

export const getAssetBySerialNumber = async (serialNumber: string): Promise<Asset | undefined> => {
    if (!serialNumber) return undefined

    const result = await apiRequest<Asset>(`/assets/serial/${serialNumber}`)
    if (result.success && result.data) {
        return {
            ...result.data,
            id: result.data._id || result.data.id
        }
    }
    return undefined
}

export const createAsset = async (
    asset: Omit<Asset, 'id' | '_id' | 'createdAt' | 'updatedAt' | 'serialNumber'> & { serialNumber?: string }
): Promise<{ success: boolean; message: string; asset?: Asset }> => {
    // Transform asset data to match backend schema
    const assetData = {
        name: asset.name,
        serialNumber: asset.serialNumber,
        category: asset.category,
        department: asset.department,
        status: asset.status || 'available',
        condition: asset.condition || 'Good',
        purchaseDate: asset.purchaseDate,
        purchaseCost: asset.purchaseCost,
        currentValue: asset.currentValue || asset.purchaseCost,
        supplier: asset.supplier,
        assignedTo: asset.assignedTo,
        location: asset.location,
        maintenanceRequired: asset.maintenanceRequired || false
    }

    const result = await apiRequest<Asset>('/assets', {
        method: 'POST',
        body: JSON.stringify(assetData)
    })

    if (result.success && result.data) {
        return {
            success: true,
            message: result.message || 'Asset created successfully',
            asset: {
                ...result.data,
                id: result.data._id || result.data.id
            }
        }
    }

    return {
        success: false,
        message: result.message || 'Failed to create asset'
    }
}

export const updateAsset = async (
    id: string,
    updates: Partial<Asset>
): Promise<{ success: boolean; message: string }> => {
    const result = await apiRequest<Asset>(`/assets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    })

    return {
        success: result.success,
        message: result.message || (result.success ? 'Asset updated successfully' : 'Failed to update asset')
    }
}

export const deleteAsset = async (id: string): Promise<{ success: boolean; message: string }> => {
    const result = await apiRequest(`/assets/${id}`, {
        method: 'DELETE'
    })

    return {
        success: result.success,
        message: result.message || (result.success ? 'Asset deleted successfully' : 'Failed to delete asset')
    }
}

export const addDamageReport = async (
    id: string,
    damageData: {
        damageLevel: "saaid" | "dhex-dhexaad" | "iska-roon"
        damagePercentage: number
        location: string
        description: string
    }
): Promise<{ success: boolean; message: string }> => {
    const result = await apiRequest<Asset>(`/assets/${id}/damage`, {
        method: 'POST',
        body: JSON.stringify(damageData)
    })

    return {
        success: result.success,
        message: result.message || (result.success ? 'Damage report added successfully' : 'Failed to add damage report')
    }
}

export const getDamagedAssets = async (): Promise<Asset[]> => {
    const assets = await getAssets()
    if (!Array.isArray(assets)) return []
    return assets.filter(a =>
        (a.damageReports && a.damageReports.length > 0) ||
        ['Damaged', 'Poor'].includes(a.condition)
    )
}

export const getAssetStatistics = async (): Promise<any> => {
    const result = await apiRequest<any>('/assets/statistics')
    return result.data || {}
}

// ============================================================================
// REQUESTS
// ============================================================================

export const getRequests = async (filters?: {
    status?: string
    type?: string
    user?: string
    assetId?: string
}): Promise<Request[]> => {
    try {
        const queryParams = filters ? new URLSearchParams(filters as any).toString() : ''
        const endpoint = queryParams ? `/requests?${queryParams}` : '/requests'

        const result = await apiRequest<Request[]>(endpoint)
        if (result.success && Array.isArray(result.data)) {
            return result.data.map(request => ({
                ...request,
                id: request._id || request.id
            }))
        }
    } catch (e) {
        console.error('getRequests error:', e)
    }
    return []
}

export const getRequestById = async (id: string): Promise<Request | undefined> => {
    const result = await apiRequest<Request>(`/requests/${id}`)
    if (result.success && result.data) {
        return {
            ...result.data,
            id: result.data._id || result.data.id
        }
    }
    return undefined
}

export const getRequestsByUser = async (userId: string): Promise<Request[]> => {
    return getRequests({ user: userId })
}

export const getPendingRequests = async (): Promise<Request[]> => {
    return getRequests({ status: 'pending' })
}

export const getMyRequests = async (): Promise<Request[]> => {
    try {
        const result = await apiRequest<Request[]>('/requests/my')
        if (result.success && Array.isArray(result.data)) {
            return result.data.map(request => ({
                ...request,
                id: request._id || request.id
            }))
        }
    } catch (e) {
        console.error('getMyRequests error:', e)
    }
    return []
}

export const createRequest = async (
    request: Omit<Request, 'id' | '_id' | 'status' | 'createdAt' | 'updatedAt' | 'requestedBy' | 'requestedByName'>
): Promise<{ success: boolean; message: string; request?: Request }> => {
    const result = await apiRequest<Request>('/requests', {
        method: 'POST',
        body: JSON.stringify(request)
    })

    if (result.success && result.data) {
        return {
            success: true,
            message: result.message || 'Request submitted successfully',
            request: {
                ...result.data,
                id: result.data._id || result.data.id
            }
        }
    }

    return {
        success: false,
        message: result.message || 'Failed to create request'
    }
}

export const approveRequest = async (id: string): Promise<{ success: boolean; message: string }> => {
    const result = await apiRequest<Request>(`/requests/${id}/approve`, {
        method: 'PUT'
    })

    return {
        success: result.success,
        message: result.message || (result.success ? 'Request approved successfully' : 'Failed to approve request')
    }
}

export const rejectRequest = async (id: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    const result = await apiRequest<Request>(`/requests/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: reason || 'No reason provided' })
    })

    return {
        success: result.success,
        message: result.message || (result.success ? 'Request rejected' : 'Failed to reject request')
    }
}

// ============================================================================
// DEPARTMENTS
// ============================================================================

export const getDepartments = async (): Promise<Department[]> => {
    try {
        const result = await apiRequest<Department[]>('/departments')
        if (result.success && Array.isArray(result.data)) {
            return result.data.map(dept => ({
                ...dept,
                id: dept._id || dept.id
            }))
        }
    } catch (e) {
        console.error('getDepartments error:', e)
    }
    return []
}

export const createDepartment = async (
    department: Omit<Department, 'id' | '_id' | 'createdAt'>
): Promise<{ success: boolean; message: string; department?: Department }> => {
    const result = await apiRequest<Department>('/departments', {
        method: 'POST',
        body: JSON.stringify(department)
    })

    if (result.success && result.data) {
        return {
            success: true,
            message: result.message || 'Department created successfully',
            department: {
                ...result.data,
                id: result.data._id || result.data.id
            }
        }
    }

    return {
        success: false,
        message: result.message || 'Failed to create department'
    }
}

export const updateDepartment = async (
    id: string,
    updates: Partial<Omit<Department, 'id' | '_id' | 'createdAt'>>
): Promise<{ success: boolean; message: string }> => {
    const result = await apiRequest<Department>(`/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    })

    return {
        success: result.success,
        message: result.message || (result.success ? 'Department updated successfully' : 'Failed to update department')
    }
}

export const deleteDepartment = async (id: string): Promise<{ success: boolean; message: string }> => {
    const result = await apiRequest(`/departments/${id}`, {
        method: 'DELETE'
    })

    return {
        success: result.success,
        message: result.message || (result.success ? 'Department deleted successfully' : 'Failed to delete department')
    }
}

// ============================================================================
// CATEGORIES
// ============================================================================

export const getCategories = async (): Promise<Category[]> => {
    try {
        const result = await apiRequest<Category[]>('/categories')
        if (result.success && Array.isArray(result.data)) {
            return result.data.map(cat => ({
                ...cat,
                id: cat._id || cat.id
            }))
        }
    } catch (e) {
        console.error('getCategories error:', e)
    }
    return []
}

export const createCategory = async (
    category: Omit<Category, 'id' | '_id' | 'createdAt'>
): Promise<{ success: boolean; message: string; category?: Category }> => {
    const result = await apiRequest<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify(category)
    })

    if (result.success && result.data) {
        return {
            success: true,
            message: result.message || 'Category created successfully',
            category: {
                ...result.data,
                id: result.data._id || result.data.id
            }
        }
    }

    return {
        success: false,
        message: result.message || 'Failed to create category'
    }
}

export const updateCategory = async (
    id: string,
    updates: Partial<Omit<Category, 'id' | '_id' | 'createdAt'>>
): Promise<{ success: boolean; message: string }> => {
    const result = await apiRequest<Category>(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    })

    return {
        success: result.success,
        message: result.message || (result.success ? 'Category updated successfully' : 'Failed to update category')
    }
}

export const deleteCategory = async (id: string): Promise<{ success: boolean; message: string }> => {
    const result = await apiRequest(`/categories/${id}`, {
        method: 'DELETE'
    })

    return {
        success: result.success,
        message: result.message || (result.success ? 'Category deleted successfully' : 'Failed to delete category')
    }
}

// ============================================================================
// ANALYTICS & REPORTS
// ============================================================================

export const getDashboardAnalytics = async (): Promise<any> => {
    const result = await apiRequest<any>('/analytics/dashboard')
    return result.data || {}
}

export const getFinancialReport = async (): Promise<any> => {
    const result = await apiRequest<any>('/reports/financial')
    return result.data || {}
}

export const getActivityLogs = async (page: number = 1, limit: number = 50): Promise<any> => {
    const result = await apiRequest<any>(`/activity-logs?page=${page}&limit=${limit}`)
    return result.data || { data: [], total: 0, page: 1, pages: 1 }
}

// ============================================================================
// BACKUP & EXPORT
// ============================================================================

export const exportData = async (): Promise<any> => {
    const result = await apiRequest<any>('/backup/export')
    return result.data || null
}

export const importData = async (data: any, clearExisting: boolean = false): Promise<{ success: boolean; message: string }> => {
    const result = await apiRequest<any>('/backup/import', {
        method: 'POST',
        body: JSON.stringify({ data, clearExisting })
    })

    return {
        success: result.success,
        message: result.message || (result.success ? 'Data imported successfully' : 'Failed to import data')
    }
}

// ============================================================================
// UTILITY FUNCTIONS (for backward compatibility)
// ============================================================================

export const generateSerialNumber = (categoryName: string): string => {
    // This is now handled by the backend, but we keep this for compatibility
    // Return empty string and let backend generate
    return ''
}


