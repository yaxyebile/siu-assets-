// LocalStorage Service for Asset Management System

export interface User {
  id: string
  name: string
  email: string
  password: string
  phone?: string
  role: "admin" | "adminOfficer" | "adminOperation"
}

export interface Department {
  id: string
  name: string
  description: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  description: string
  createdAt: string
}

export interface Asset {
  id: string
  // Basic Information
  name: string
  category: string // Changed from union type to string
  assetType: "Fixed" | "Movable"
  quantity: number
  condition: "New" | "Good" | "Damaged"
  status: "available" | "in-use" | "maintenance" | "transferred"

  // Ownership & Location
  department: string
  assignedTo: string
  location: string
  custodian: string

  // Purchase Details
  purchaseDate: string
  purchaseCost: number
  supplier: string
  invoiceNumber: string
  invoiceFile?: string // Base64 encoded file or file name

  // Tracking & Management
  serialNumber: string
  warrantyExpiry: string
  maintenanceRequired: boolean
  notes: string

  createdAt: string
  updatedAt: string
}

export interface Request {
  id: string
  assetId: string
  assetName: string
  type:
    | "usage"
    | "status-change"
    | "maintenance"
    | "transfer"
    | "asset-registration"
    | "asset-damage"
    | "asset-transfer"
  requestedBy: string
  requestedByName: string
  status: "pending" | "approved" | "rejected"
  details?: string
  newStatus?: Asset["status"]
  assetRegistrationData?: {
    name: string
    category: string
    assetType: "Fixed" | "Movable"
    quantity: number
    condition: "New" | "Good" | "Damaged"
    department: string
    location: string
    purchaseDate: string
    purchaseCost: number
    supplier: string
    invoiceNumber: string
    invoiceFile?: string
    serialNumber: string
    warrantyExpiry: string
    notes: string
  }
  assetDamageData?: {
    damageLevel: "saaid" | "dhex-dhexaad" | "iska-roon"
    damageLocation: string
    damageDescription: string
    damagePercentage: number
  }
  assetTransferData?: {
    fromDepartment: string
    toDepartment: string
    transferReason: string
  }
  createdAt: string
  updatedAt: string
}

const STORAGE_KEYS = {
  USERS: "asset_management_users",
  ASSETS: "asset_management_assets",
  REQUESTS: "asset_management_requests",
  CURRENT_USER: "asset_management_current_user",
  DEPARTMENTS: "asset_management_departments",
  CATEGORIES: "asset_management_categories",
  SERIAL_COUNTERS: "asset_management_serial_counters",
}

// Initialize default admin user if no users exist
const initializeDefaultData = () => {
  const users = localStorage.getItem(STORAGE_KEYS.USERS)
  if (!users || JSON.parse(users).length === 0) {
    const defaultAdmin: User = {
      id: "admin-1",
      name: "System Admin",
      email: "admin@system.com",
      password: "admin123",
      role: "admin",
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([defaultAdmin]))
  }
}

// Users CRUD
export const getUsers = (): User[] => {
  if (typeof window === "undefined") return []
  initializeDefaultData()
  const users = localStorage.getItem(STORAGE_KEYS.USERS)
  return users ? JSON.parse(users) : []
}

export const getUserById = (id: string): User | undefined => {
  return getUsers().find((user) => user.id === id)
}

export const getUsersByRole = (role: User["role"]): User[] => {
  return getUsers().filter((user) => user.role === role)
}

export const createUser = (user: Omit<User, "id">): { success: boolean; message: string; user?: User } => {
  const users = getUsers()
  const existingUser = users.find((u) => u.email === user.email)
  if (existingUser) {
    return { success: false, message: "User with this email already exists" }
  }
  const newUser: User = {
    ...user,
    id: `user-${Date.now()}`,
  }
  users.push(newUser)
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
  return { success: true, message: "User created successfully", user: newUser }
}

export const updateUser = (id: string, updates: Partial<User>): { success: boolean; message: string } => {
  const users = getUsers()
  const index = users.findIndex((user) => user.id === id)
  if (index === -1) {
    return { success: false, message: "User not found" }
  }
  users[index] = { ...users[index], ...updates }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
  return { success: true, message: "User updated successfully" }
}

export const deleteUser = (id: string): { success: boolean; message: string } => {
  const users = getUsers()
  const filtered = users.filter((user) => user.id !== id)
  if (filtered.length === users.length) {
    return { success: false, message: "User not found" }
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered))
  return { success: true, message: "User deleted successfully" }
}

// Assets CRUD
export const getAssets = (): Asset[] => {
  if (typeof window === "undefined") return []
  const assets = localStorage.getItem(STORAGE_KEYS.ASSETS)
  return assets ? JSON.parse(assets) : []
}

export const getAssetById = (id: string): Asset | undefined => {
  return getAssets().find((asset) => asset.id === id)
}

export const getAssetBySerialNumber = (serialNumber: string): Asset | undefined => {
  if (!serialNumber) return undefined
  return getAssets().find(
    (asset) => asset.serialNumber && asset.serialNumber.toLowerCase() === serialNumber.toLowerCase(),
  )
}

export const createAsset = (
  asset: Omit<Asset, "id" | "createdAt" | "updatedAt" | "serialNumber"> & { serialNumber?: string },
): { success: boolean; message: string; asset?: Asset } => {
  const assets = getAssets()

  const serialNumber = asset.serialNumber || generateSerialNumber(asset.category)

  const newAsset: Asset = {
    ...asset,
    serialNumber,
    id: `asset-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  assets.push(newAsset)
  localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets))
  return {
    success: true,
    message: "Asset created successfully",
    asset: newAsset,
  }
}

export const updateAsset = (id: string, updates: Partial<Asset>): { success: boolean; message: string } => {
  const assets = getAssets()
  const index = assets.findIndex((asset) => asset.id === id)
  if (index === -1) {
    return { success: false, message: "Asset not found" }
  }
  assets[index] = {
    ...assets[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(assets))
  return { success: true, message: "Asset updated successfully" }
}

export const deleteAsset = (id: string): { success: boolean; message: string } => {
  const assets = getAssets()
  const filtered = assets.filter((asset) => asset.id !== id)
  if (filtered.length === assets.length) {
    return { success: false, message: "Asset not found" }
  }
  localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(filtered))
  return { success: true, message: "Asset deleted successfully" }
}

// Requests CRUD
export const getRequests = (): Request[] => {
  if (typeof window === "undefined") return []
  const requests = localStorage.getItem(STORAGE_KEYS.REQUESTS)
  return requests ? JSON.parse(requests) : []
}

export const getRequestById = (id: string): Request | undefined => {
  return getRequests().find((request) => request.id === id)
}

export const getRequestsByUser = (userId: string): Request[] => {
  return getRequests().filter((request) => request.requestedBy === userId)
}

export const getPendingRequests = (): Request[] => {
  return getRequests().filter((request) => request.status === "pending")
}

export const createRequest = (
  request: Omit<Request, "id" | "status" | "createdAt" | "updatedAt">,
): { success: boolean; message: string; request?: Request } => {
  const requests = getRequests()
  const newRequest: Request = {
    ...request,
    id: `request-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  requests.push(newRequest)
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests))
  return {
    success: true,
    message: "Request submitted successfully",
    request: newRequest,
  }
}

export const approveRequest = (id: string): { success: boolean; message: string } => {
  const requests = getRequests()
  const index = requests.findIndex((request) => request.id === id)
  if (index === -1) {
    return { success: false, message: "Request not found" }
  }

  const request = requests[index]

  if (request.type === "asset-registration" && request.assetRegistrationData) {
    const data = request.assetRegistrationData
    createAsset({
      name: data.name,
      category: data.category,
      assetType: data.assetType,
      quantity: data.quantity,
      condition: data.condition,
      status: "available",
      department: data.department,
      assignedTo: "",
      location: data.location,
      custodian: "",
      purchaseDate: data.purchaseDate,
      purchaseCost: data.purchaseCost,
      supplier: data.supplier,
      invoiceNumber: data.invoiceNumber,
      invoiceFile: data.invoiceFile,
      serialNumber: data.serialNumber,
      warrantyExpiry: data.warrantyExpiry,
      maintenanceRequired: false,
      notes: `${data.notes}\n[Requested by: ${request.requestedByName}]`,
    })
  } else if (request.type === "asset-damage" && request.assetDamageData) {
    const asset = getAssetById(request.assetId)
    if (asset) {
      const damagePercentage = request.assetDamageData.damagePercentage / 100 // Convert to decimal
      const newCost = asset.purchaseCost * (1 - damagePercentage)
      updateAsset(request.assetId, {
        purchaseCost: newCost,
        condition: "Damaged",
        notes: `${asset.notes || ""}\n[Damage Report - ${new Date().toLocaleDateString()}]: ${request.assetDamageData.damageDescription} | Location: ${request.assetDamageData.damageLocation} | Deducted: ${request.assetDamageData.damagePercentage}% | Reported by: ${request.requestedByName}`,
      })
    }
  } else if (request.type === "asset-transfer" && request.assetTransferData) {
    const asset = getAssetById(request.assetId)
    if (asset) {
      updateAsset(request.assetId, {
        department: request.assetTransferData.toDepartment,
        status: "transferred",
        notes: `${asset.notes || ""}\n[Transfer - ${new Date().toLocaleDateString()}]: From ${request.assetTransferData.fromDepartment} to ${request.assetTransferData.toDepartment} | Reason: ${request.assetTransferData.transferReason} | Requested by: ${request.requestedByName}`,
      })
    }
  } else if (request.type === "status-change" || request.type === "maintenance" || request.type === "transfer") {
    const newStatus = request.newStatus || (request.type === "maintenance" ? "maintenance" : "in-use")
    updateAsset(request.assetId, { status: newStatus })
  } else if (request.type === "usage") {
    updateAsset(request.assetId, { status: "in-use" })
  }

  requests[index] = {
    ...requests[index],
    status: "approved",
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests))
  return { success: true, message: "Request approved successfully" }
}

export const rejectRequest = (id: string): { success: boolean; message: string } => {
  const requests = getRequests()
  const index = requests.findIndex((request) => request.id === id)
  if (index === -1) {
    return { success: false, message: "Request not found" }
  }
  requests[index] = {
    ...requests[index],
    status: "rejected",
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests))
  return { success: true, message: "Request rejected" }
}

// Auth
export const login = (email: string, password: string): { success: boolean; message: string; user?: User } => {
  const users = getUsers()
  const user = users.find((u) => u.email === email && u.password === password)
  if (!user) {
    return { success: false, message: "Invalid email or password" }
  }
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
  return { success: true, message: "Login successful", user }
}

export const logout = (): void => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
}

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null
  const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
  return user ? JSON.parse(user) : null
}

// Department CRUD operations
export const getDepartments = (): Department[] => {
  if (typeof window === "undefined") return []
  const departments = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)
  return departments ? JSON.parse(departments) : []
}

export const createDepartment = (
  department: Omit<Department, "id" | "createdAt">,
): { success: boolean; message: string; department?: Department } => {
  const departments = getDepartments()
  const existing = departments.find((d) => d.name.toLowerCase() === department.name.toLowerCase())
  if (existing) {
    return { success: false, message: "Department with this name already exists" }
  }
  const newDepartment: Department = {
    ...department,
    id: `dept-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  departments.push(newDepartment)
  localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments))
  return { success: true, message: "Department created successfully", department: newDepartment }
}

export const updateDepartment = (
  id: string,
  updates: Partial<Omit<Department, "id" | "createdAt">>,
): { success: boolean; message: string } => {
  const departments = getDepartments()
  const index = departments.findIndex((d) => d.id === id)
  if (index === -1) {
    return { success: false, message: "Department not found" }
  }
  departments[index] = { ...departments[index], ...updates }
  localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments))
  return { success: true, message: "Department updated successfully" }
}

export const deleteDepartment = (id: string): { success: boolean; message: string } => {
  const departments = getDepartments()
  const filtered = departments.filter((d) => d.id !== id)
  if (filtered.length === departments.length) {
    return { success: false, message: "Department not found" }
  }
  localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(filtered))
  return { success: true, message: "Department deleted successfully" }
}

// Category CRUD operations
export const getCategories = (): Category[] => {
  if (typeof window === "undefined") return []
  const categories = localStorage.getItem(STORAGE_KEYS.CATEGORIES)
  return categories ? JSON.parse(categories) : []
}

export const createCategory = (
  category: Omit<Category, "id" | "createdAt">,
): { success: boolean; message: string; category?: Category } => {
  const categories = getCategories()
  const existing = categories.find((c) => c.name.toLowerCase() === category.name.toLowerCase())
  if (existing) {
    return { success: false, message: "Category with this name already exists" }
  }
  const newCategory: Category = {
    ...category,
    id: `cat-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }
  categories.push(newCategory)
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories))
  return { success: true, message: "Category created successfully", category: newCategory }
}

export const updateCategory = (
  id: string,
  updates: Partial<Omit<Category, "id" | "createdAt">>,
): { success: boolean; message: string } => {
  const categories = getCategories()
  const index = categories.findIndex((c) => c.id === id)
  if (index === -1) {
    return { success: false, message: "Category not found" }
  }
  categories[index] = { ...categories[index], ...updates }
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories))
  return { success: true, message: "Category updated successfully" }
}

export const deleteCategory = (id: string): { success: boolean; message: string } => {
  const categories = getCategories()
  const filtered = categories.filter((c) => c.id !== id)
  if (filtered.length === categories.length) {
    return { success: false, message: "Category not found" }
  }
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered))
  return { success: true, message: "Category deleted successfully" }
}

export const generateSerialNumber = (categoryName: string): string => {
  if (typeof window === "undefined") return ""

  // Get first 2 letters of category (uppercase)
  const prefix = categoryName.substring(0, 2).toUpperCase()

  // Get current counters
  const countersStr = localStorage.getItem(STORAGE_KEYS.SERIAL_COUNTERS)
  const counters: Record<string, number> = countersStr ? JSON.parse(countersStr) : {}

  // Increment counter for this category prefix
  const currentCount = (counters[prefix] || 0) + 1
  counters[prefix] = currentCount

  // Save updated counters
  localStorage.setItem(STORAGE_KEYS.SERIAL_COUNTERS, JSON.stringify(counters))

  // Format: XX0001, XX0002, etc.
  const serialNumber = `${prefix}${currentCount.toString().padStart(4, "0")}`

  return serialNumber
}
