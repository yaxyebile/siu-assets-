# Frontend Integration Guide - Next.js 16

## 🔗 Connecting Your Next.js Frontend to the Backend

### Step 1: Update API Configuration

Create or update `lib/api.js` or `utils/api.js`:

```javascript
// lib/api.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// API request helper
export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

export default API_BASE_URL;
```

---

### Step 2: Replace localStorage Authentication

#### Old Code (localStorage):
```javascript
// ❌ Remove this
const login = (email, password) => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
};
```

#### New Code (API):
```javascript
// ✅ Use this instead
import { apiRequest } from '@/lib/api';

const login = async (email, password) => {
  try {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (response.success) {
      // Save token and user to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      return response.data.user;
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```

---

### Step 3: Update User Management

#### Get All Users:
```javascript
// ✅ New API version
import { apiRequest } from '@/lib/api';

const getUsers = async () => {
  try {
    const response = await apiRequest('/users');
    return response.data; // Array of users
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};
```

#### Create User:
```javascript
const createUser = async (userData) => {
  try {
    const response = await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};
```

#### Update User:
```javascript
const updateUser = async (userId, userData) => {
  try {
    const response = await apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};
```

#### Delete User:
```javascript
const deleteUser = async (userId) => {
  try {
    const response = await apiRequest(`/users/${userId}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
```

---

### Step 4: Update Asset Management

#### Get All Assets:
```javascript
const getAssets = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/assets?${queryParams}` : '/assets';
    
    const response = await apiRequest(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
};

// Usage:
// getAssets({ status: 'available', department: 'IT' })
```

#### Create Asset:
```javascript
const createAsset = async (assetData) => {
  try {
    const response = await apiRequest('/assets', {
      method: 'POST',
      body: JSON.stringify(assetData)
    });
    return response.data;
  } catch (error) {
    console.error('Error creating asset:', error);
    throw error;
  }
};
```

#### Get Asset by Serial Number (QR Scan):
```javascript
const getAssetBySerial = async (serialNumber) => {
  try {
    const response = await apiRequest(`/assets/serial/${serialNumber}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching asset:', error);
    throw error;
  }
};
```

#### Add Damage Report:
```javascript
const addDamageReport = async (assetId, damageData) => {
  try {
    const response = await apiRequest(`/assets/${assetId}/damage`, {
      method: 'POST',
      body: JSON.stringify(damageData)
    });
    return response.data;
  } catch (error) {
    console.error('Error adding damage report:', error);
    throw error;
  }
};
```

---

### Step 5: Update Request Management

#### Get All Requests:
```javascript
const getRequests = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/requests?${queryParams}` : '/requests';
    
    const response = await apiRequest(endpoint);
    return response.data;
  } catch (error) {
    console.error('Error fetching requests:', error);
    throw error;
  }
};
```

#### Create Request:
```javascript
const createRequest = async (requestData) => {
  try {
    const response = await apiRequest('/requests', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    return response.data;
  } catch (error) {
    console.error('Error creating request:', error);
    throw error;
  }
};

// Example usage for asset registration request:
const submitAssetRegistration = async (assetData) => {
  const requestData = {
    assetName: assetData.name,
    type: 'asset-registration',
    details: `Request to register new asset: ${assetData.name}`,
    assetRegistrationData: {
      serialNumber: assetData.serialNumber,
      category: assetData.categoryId,
      department: assetData.departmentId,
      purchaseDate: assetData.purchaseDate,
      purchaseCost: assetData.purchaseCost,
      supplier: assetData.supplier,
      location: assetData.location
    }
  };
  
  return await createRequest(requestData);
};
```

#### Approve Request:
```javascript
const approveRequest = async (requestId) => {
  try {
    const response = await apiRequest(`/requests/${requestId}/approve`, {
      method: 'PUT'
    });
    return response.data;
  } catch (error) {
    console.error('Error approving request:', error);
    throw error;
  }
};
```

#### Reject Request:
```javascript
const rejectRequest = async (requestId, reason) => {
  try {
    const response = await apiRequest(`/requests/${requestId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
    return response.data;
  } catch (error) {
    console.error('Error rejecting request:', error);
    throw error;
  }
};
```

---

### Step 6: Update Departments & Categories

#### Get Departments:
```javascript
const getDepartments = async () => {
  try {
    const response = await apiRequest('/departments');
    return response.data;
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};
```

#### Get Categories:
```javascript
const getCategories = async () => {
  try {
    const response = await apiRequest('/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};
```

---

### Step 7: Update Dashboard Analytics

```javascript
const getDashboardAnalytics = async () => {
  try {
    const response = await apiRequest('/analytics/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};

// Response structure:
// {
//   users: { total, byRole },
//   assets: { total, byStatus, byCondition, damaged },
//   requests: { total, pending, byStatus, byType },
//   financials: { totalPurchaseCost, totalCurrentValue, totalDepreciation, totalDamageCost },
//   departments: number,
//   categories: number,
//   recentActivities: []
// }
```

---

### Step 8: Update Financial Reports

```javascript
const getFinancialReport = async () => {
  try {
    const response = await apiRequest('/reports/financial');
    return response.data;
  } catch (error) {
    console.error('Error fetching financial report:', error);
    throw error;
  }
};
```

---

### Step 9: Create API Service File

Create `services/api.service.js`:

```javascript
import { apiRequest } from '@/lib/api';

export const authService = {
  login: async (email, password) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  },
  
  getCurrentUser: async () => {
    const response = await apiRequest('/auth/me');
    return response.data;
  }
};

export const userService = {
  getAll: async () => {
    const response = await apiRequest('/users');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiRequest(`/users/${id}`);
    return response.data;
  },
  
  create: async (userData) => {
    const response = await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return response.data;
  },
  
  update: async (id, userData) => {
    const response = await apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiRequest(`/users/${id}`, {
      method: 'DELETE'
    });
    return response;
  }
};

export const assetService = {
  getAll: async (filters) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/assets?${queryParams}` : '/assets';
    const response = await apiRequest(endpoint);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiRequest(`/assets/${id}`);
    return response.data;
  },
  
  getBySerial: async (serialNumber) => {
    const response = await apiRequest(`/assets/serial/${serialNumber}`);
    return response.data;
  },
  
  create: async (assetData) => {
    const response = await apiRequest('/assets', {
      method: 'POST',
      body: JSON.stringify(assetData)
    });
    return response.data;
  },
  
  update: async (id, assetData) => {
    const response = await apiRequest(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assetData)
    });
    return response.data;
  },
  
  delete: async (id) => {
    const response = await apiRequest(`/assets/${id}`, {
      method: 'DELETE'
    });
    return response;
  },
  
  addDamageReport: async (id, damageData) => {
    const response = await apiRequest(`/assets/${id}/damage`, {
      method: 'POST',
      body: JSON.stringify(damageData)
    });
    return response.data;
  },
  
  getDamaged: async () => {
    const response = await apiRequest('/assets/damaged');
    return response.data;
  },
  
  getStatistics: async () => {
    const response = await apiRequest('/assets/statistics');
    return response.data;
  }
};

export const requestService = {
  getAll: async (filters) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/requests?${queryParams}` : '/requests';
    const response = await apiRequest(endpoint);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await apiRequest(`/requests/${id}`);
    return response.data;
  },
  
  getMy: async () => {
    const response = await apiRequest('/requests/my');
    return response.data;
  },
  
  create: async (requestData) => {
    const response = await apiRequest('/requests', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
    return response.data;
  },
  
  approve: async (id) => {
    const response = await apiRequest(`/requests/${id}/approve`, {
      method: 'PUT'
    });
    return response.data;
  },
  
  reject: async (id, reason) => {
    const response = await apiRequest(`/requests/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
    return response.data;
  }
};

export const departmentService = {
  getAll: async () => {
    const response = await apiRequest('/departments');
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiRequest('/departments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.data;
  }
};

export const categoryService = {
  getAll: async () => {
    const response = await apiRequest('/categories');
    return response.data;
  },
  
  create: async (data) => {
    const response = await apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.data;
  }
};

export const analyticsService = {
  getDashboard: async () => {
    const response = await apiRequest('/analytics/dashboard');
    return response.data;
  }
};

export const reportService = {
  getFinancial: async () => {
    const response = await apiRequest('/reports/financial');
    return response.data;
  }
};
```

---

### Step 10: Update Environment Variables

Create `.env.local` in your Next.js project:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

### Step 11: Usage in Components

```javascript
// In your React component
import { useEffect, useState } from 'react';
import { assetService, departmentService } from '@/services/api.service';

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assetsData, departmentsData] = await Promise.all([
        assetService.getAll(),
        departmentService.getAll()
      ]);
      
      setAssets(assetsData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async (assetData) => {
    try {
      await assetService.create(assetData);
      await loadData(); // Reload data
      alert('Asset created successfully');
    } catch (error) {
      console.error('Error creating asset:', error);
      alert('Failed to create asset');
    }
  };

  // ... rest of component
}
```

---

## 🔄 Migration Checklist

- [ ] Create `lib/api.js` with API helper
- [ ] Create `services/api.service.js` with all service methods
- [ ] Update `.env.local` with API URL
- [ ] Replace all localStorage data operations with API calls
- [ ] Update login/logout to use JWT tokens
- [ ] Update all CRUD operations to use API
- [ ] Test authentication flow
- [ ] Test user management
- [ ] Test asset management
- [ ] Test request workflow
- [ ] Test dashboard analytics
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Add proper error messages

---

## 🎯 Key Changes Summary

1. **Authentication**: localStorage → JWT tokens
2. **Data Storage**: localStorage → MongoDB via API
3. **User Management**: Local array → API endpoints
4. **Assets**: Local array → API endpoints with relationships
5. **Requests**: Local array → API with approval workflow
6. **SMS**: Manual → Automatic via backend
7. **Reports**: Client-side calculations → Server-side aggregations

---

## 🚨 Important Notes

1. **Token Expiration**: JWT tokens expire after 30 days. Handle token refresh if needed.
2. **Error Handling**: All API calls should be wrapped in try-catch blocks.
3. **Loading States**: Show loading indicators during API calls.
4. **Validation**: Backend validates all inputs, but frontend should also validate.
5. **CORS**: Backend is configured to allow requests from `http://localhost:3000`.

---

## ✅ Testing Your Integration

1. Start backend: `cd backend && npm start`
2. Start frontend: `cd frontend && npm run dev`
3. Test login with: `admin@siu.com` / `admin123`
4. Verify data loads from API
5. Test creating/updating/deleting records
6. Check browser console for errors
7. Monitor backend terminal for API requests

---

**Your backend is ready! Start integrating with your Next.js frontend now! 🚀**
