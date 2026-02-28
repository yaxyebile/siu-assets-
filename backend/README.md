# SIU Assets Management System - Backend API

Complete Node.js + Express.js + MongoDB backend for the SIU Assets Management System.

## 🚀 Features

- **Authentication & Authorization** - JWT-based auth with role-based access control
- **User Management** - CRUD operations for 3 user roles (Admin, Admin Officer, Admin Operation)
- **Asset Management** - Complete asset lifecycle management with QR code support
- **Request System** - Asset registration, damage, and transfer requests with approval workflow
- **Departments & Categories** - Dynamic management of organizational structure
- **Activity Logs** - Comprehensive tracking of all system actions
- **SMS Notifications** - Automatic SMS alerts via SMS Gateway 24
- **Financial Reports** - Purchase costs, depreciation, and damage cost analysis
- **Analytics Dashboard** - Real-time statistics and insights
- **Backup & Restore** - Data export/import functionality

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn package manager

## 🛠️ Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

   The `.env` file is already configured with your MongoDB credentials.

4. **Seed the database**
   
   Create initial admin user and sample data:
   ```bash
   npm run seed
   ```

   Default admin credentials:
   - Email: `admin@siu.com`
   - Password: `admin123`

## 🏃 Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register first admin (only if no users exist)
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get single user
- `GET /api/users/role/:role` - Get users by role
- `POST /api/users` - Create user (admin/adminOfficer)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)
- `PUT /api/users/:id/password` - Change password

### Assets
- `GET /api/assets` - Get all assets (with filters)
- `GET /api/assets/:id` - Get single asset
- `GET /api/assets/serial/:serialNumber` - Get by serial (QR scan)
- `POST /api/assets` - Create asset (admin/adminOfficer)
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset (admin only)
- `POST /api/assets/:id/damage` - Add damage report
- `GET /api/assets/damaged` - Get damaged assets
- `GET /api/assets/statistics` - Get asset statistics

### Requests
- `GET /api/requests` - Get all requests (with filters)
- `GET /api/requests/:id` - Get single request
- `GET /api/requests/my` - Get my requests
- `POST /api/requests` - Create request
- `PUT /api/requests/:id/approve` - Approve request (admin/adminOfficer)
- `PUT /api/requests/:id/reject` - Reject request (admin/adminOfficer)

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get single department
- `POST /api/departments` - Create department (admin/adminOfficer)
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department (admin only)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (admin/adminOfficer)
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category (admin only)

### Activity Logs
- `GET /api/activity-logs` - Get activity logs with pagination
- `POST /api/activity-logs` - Create activity log

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics

### Reports
- `GET /api/reports/financial` - Get financial reports (admin/adminOfficer)

### Backup
- `GET /api/backup/export` - Export all data (admin only)
- `POST /api/backup/import` - Import data (admin only)

### SMS
- `POST /api/sms/send` - Send SMS manually (admin/adminOfficer)

## 🔐 User Roles

1. **admin** - Full system access
2. **adminOfficer** - Can manage assets, approve/reject requests
3. **adminOperation** - Can submit requests, view assigned assets

## 📱 SMS Integration

The system uses SMS Gateway 24 for notifications:
- Asset registration notifications to Admin Officers
- Request submission notifications to Admin Officers
- Request approval/rejection notifications to requesters

SMS credentials are configured in `.env` file.

## 🗄️ Database Models

- **User** - System users with roles
- **Asset** - Assets with damage reports
- **Request** - Asset requests (registration, damage, transfer)
- **Department** - Organizational departments
- **Category** - Asset categories
- **ActivityLog** - System activity tracking
- **SMSHistory** - SMS notification history

## 🔧 Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── userController.js     # User management
│   ├── assetController.js    # Asset management
│   ├── requestController.js  # Request handling
│   ├── departmentController.js
│   ├── categoryController.js
│   ├── activityLogController.js
│   ├── analyticsController.js
│   ├── reportController.js
│   └── backupController.js
├── middleware/
│   ├── auth.js              # JWT authentication & authorization
│   └── validate.js          # Request validation
├── models/
│   ├── User.js
│   ├── Asset.js
│   ├── Request.js
│   ├── Department.js
│   ├── Category.js
│   ├── ActivityLog.js
│   └── SMSHistory.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── assetRoutes.js
│   ├── requestRoutes.js
│   ├── departmentRoutes.js
│   ├── categoryRoutes.js
│   ├── activityLogRoutes.js
│   ├── analyticsRoutes.js
│   ├── reportRoutes.js
│   ├── backupRoutes.js
│   └── smsRoutes.js
├── utils/
│   ├── activityLogger.js    # Activity logging utility
│   ├── smsService.js        # SMS integration
│   └── seedAdmin.js         # Database seeding
├── .env                     # Environment variables
├── .env.example             # Environment template
├── .gitignore
├── package.json
├── server.js                # Entry point
└── README.md
```

## 🔗 Connecting to Frontend

Your Next.js frontend should make API calls to `http://localhost:5000/api/...`

Example API call from frontend:
```javascript
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email, password })
});
```

For authenticated requests, include the JWT token:
```javascript
const response = await fetch('http://localhost:5000/api/assets', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 🧪 Testing

Test the API using:
- Postman
- Thunder Client (VS Code extension)
- curl commands

Example curl test:
```bash
curl http://localhost:5000/api/health
```

## 📝 Notes

- All passwords are hashed using bcrypt before storage
- JWT tokens expire after 30 days
- Activity logs are automatically created for important actions
- SMS notifications are sent asynchronously
- CORS is configured to allow requests from `http://localhost:3000`

## 🐛 Troubleshooting

**MongoDB Connection Error:**
- Verify your MongoDB URI in `.env`
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure network connectivity

**Port Already in Use:**
- Change the PORT in `.env` file
- Or kill the process using port 5000

**SMS Not Sending:**
- Verify SMS Gateway 24 credentials
- Check phone number format
- Review SMS history in database

## 📞 Support

For issues or questions, contact the development team.

## 📄 License

Private - SIU Assets Management System

---

**Created for SIU Assets Management System**
Backend API v1.0.0
