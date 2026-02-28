# 🚀 Quick Reference Card - SIU Assets Backend

## Server Commands

```bash
# Start server
cd backend
npm start

# Development mode (auto-reload)
npm run dev

# Seed database
npm run seed
```

## Default Login

```
Email: admin@siu.com
Password: admin123
```

## Quick Test

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@siu.com","password":"admin123"}'
```

## Frontend API Helper

```javascript
// lib/api.js
const API_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    }
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
};
```

## Common API Calls

```javascript
// Login
const login = async (email, password) => {
  const res = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  localStorage.setItem('token', res.data.token);
  return res.data.user;
};

// Get Assets
const getAssets = async () => {
  const res = await apiRequest('/assets');
  return res.data;
};

// Create Asset
const createAsset = async (data) => {
  const res = await apiRequest('/assets', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.data;
};

// Get Departments
const getDepartments = async () => {
  const res = await apiRequest('/departments');
  return res.data;
};

// Get Categories
const getCategories = async () => {
  const res = await apiRequest('/categories');
  return res.data;
};

// Create Request
const createRequest = async (data) => {
  const res = await apiRequest('/requests', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.data;
};

// Approve Request
const approveRequest = async (id) => {
  const res = await apiRequest(`/requests/${id}/approve`, {
    method: 'PUT'
  });
  return res.data;
};

// Get Dashboard Analytics
const getAnalytics = async () => {
  const res = await apiRequest('/analytics/dashboard');
  return res.data;
};
```

## User Roles

| Role | Permissions |
|------|-------------|
| **admin** | Full access to everything |
| **adminOfficer** | Manage assets, approve requests |
| **adminOperation** | Submit requests, view assets |

## Request Types

1. **asset-registration** - Register new asset
2. **asset-damage** - Report asset damage
3. **asset-transfer** - Transfer asset to another department

## Asset Status

- `available` - Ready for use
- `in-use` - Currently assigned
- `maintenance` - Under repair
- `disposed` - Removed from inventory
- `transferred` - Moved to another department
- `missing` - Cannot be located

## Damage Levels

- `saaid` - Severe damage
- `dhex-dhexaad` - Moderate damage
- `iska-roon` - Minor damage

## Important URLs

- Server: http://localhost:5000
- Health: http://localhost:5000/api/health
- API Docs: http://localhost:5000/

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=siu_assets_secret_key_2026_secure_token
SMS_DEVICE_ID=12539
SMS_SIM=1
SMS_TOKEN=9cc542db9cc23b626ae294a166a1594d
FRONTEND_URL=http://localhost:3000
```

## File Structure

```
backend/
├── server.js           # Entry point
├── config/db.js        # MongoDB
├── models/             # 7 schemas
├── controllers/        # 10 controllers
├── routes/             # 11 routes
├── middleware/         # Auth & validation
└── utils/              # Helpers
```

## Troubleshooting

**Port in use:**
```bash
# Change PORT in .env
PORT=5001
```

**MongoDB error:**
- Check internet connection
- Verify MongoDB URI in .env

**Token expired:**
- Login again to get new token

**CORS error:**
- Verify FRONTEND_URL in .env
- Check frontend is on port 3000

## Documentation Files

1. `README.md` - Full documentation
2. `API_TESTING.md` - API examples
3. `FRONTEND_INTEGRATION.md` - Frontend code
4. `BACKEND_SUMMARY.md` - Architecture
5. `PROJECT_COMPLETE.md` - Overview

---

**Keep this card handy for quick reference! 📌**
