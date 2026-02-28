# API Testing Guide

## Quick Start Testing

### 1. Health Check
```bash
curl http://localhost:5000/api/health
```

### 2. Login (Get JWT Token)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@siu.com\",\"password\":\"admin123\"}"
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "name": "Super Admin",
      "email": "admin@siu.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the token for authenticated requests!**

---

## Authenticated Requests

Replace `YOUR_TOKEN_HERE` with the actual token from login response.

### Get All Assets
```bash
curl http://localhost:5000/api/assets \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create New Asset
```bash
curl -X POST http://localhost:5000/api/assets \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dell Laptop",
    "serialNumber": "DL-2024-001",
    "category": "CATEGORY_ID_HERE",
    "department": "DEPARTMENT_ID_HERE",
    "purchaseDate": "2024-01-15",
    "purchaseCost": 1200,
    "currentValue": 1200,
    "supplier": "Dell Inc",
    "location": "IT Office",
    "condition": "Excellent",
    "status": "available"
  }'
```

### Get All Departments
```bash
curl http://localhost:5000/api/departments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get All Categories
```bash
curl http://localhost:5000/api/categories \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Request
```bash
curl -X POST http://localhost:5000/api/requests \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "assetName": "New Printer",
    "type": "asset-registration",
    "details": "Need a new printer for accounting department",
    "assetRegistrationData": {
      "serialNumber": "PR-2024-001",
      "category": "CATEGORY_ID",
      "department": "DEPARTMENT_ID",
      "purchaseDate": "2024-02-14",
      "purchaseCost": 500,
      "supplier": "HP",
      "location": "Accounting Office"
    }
  }'
```

### Get Dashboard Analytics
```bash
curl http://localhost:5000/api/analytics/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Financial Reports
```bash
curl http://localhost:5000/api/reports/financial \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Frontend Integration Examples

### React/Next.js Login Example
```javascript
const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      // Save token to localStorage
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};
```

### Authenticated API Call Example
```javascript
const getAssets = async () => {
  const token = localStorage.getItem('token');

  const response = await fetch('http://localhost:5000/api/assets', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  return data.data; // Returns array of assets
};
```

### Create Asset Example
```javascript
const createAsset = async (assetData) => {
  const token = localStorage.getItem('token');

  const response = await fetch('http://localhost:5000/api/assets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(assetData)
  });

  const data = await response.json();
  return data;
};
```

---

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message here",
  "errors": [ ... ] // For validation errors
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

---

## Testing with Postman

1. Import the following as a collection
2. Set base URL: `http://localhost:5000/api`
3. Create environment variable `token` for authentication
4. Use `{{token}}` in Authorization header

### Postman Collection Structure
```
SIU Assets API
├── Auth
│   ├── Login
│   ├── Register
│   └── Get Me
├── Users
│   ├── Get All Users
│   ├── Create User
│   ├── Update User
│   └── Delete User
├── Assets
│   ├── Get All Assets
│   ├── Create Asset
│   ├── Update Asset
│   ├── Get Asset by Serial
│   └── Add Damage Report
├── Requests
│   ├── Get All Requests
│   ├── Create Request
│   ├── Approve Request
│   └── Reject Request
└── Analytics
    ├── Dashboard
    └── Financial Reports
```

---

## Default Credentials

**Admin User:**
- Email: `admin@siu.com`
- Password: `admin123`
- Role: `admin`

**Note:** Change the password after first login in production!

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error
