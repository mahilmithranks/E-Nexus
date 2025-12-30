# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js installed (v18+): Run `node --version`
- ✅ MongoDB installed and running: Run `mongod --version`

## Step-by-Step Setup

### 1. Start MongoDB

**Windows:**
```bash
net start MongoDB
```

**macOS/Linux:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### 2. Seed the Database

Open a terminal in the `backend` folder and run:
```bash
npm run seed
```

This will create:
- Admin user (admin@college.edu / Admin@123)
- 5 sample students
- 3 workshop days with sessions

### 3. Start the Backend Server

In the same terminal (backend folder):
```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
🚀 Server running on port 5000
✅ Admin user created successfully
```

### 4. Start the Frontend

Open a **new terminal** in the `frontend` folder and run:
```bash
npm run dev
```

You should see:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

### 5. Access the Application

Open your browser and go to: **http://localhost:5173**

## Test Credentials

### Admin Login
- **Email:** admin@college.edu
- **Password:** Admin@123

### Student Login (Sample)
- **Register Number:** CS001
- **Password:** 2003-01-15

Other students:
- CS002 / 2003-03-22
- EC001 / 2003-05-10
- ME001 / 2003-07-18
- IT001 / 2003-09-25

## Testing the Workflow

### As Admin:

1. **Login** with admin credentials
2. **Enable Day 1** (Day Management tab)
3. **Start Attendance** for a session (Session Management tab)
4. Wait for students to mark attendance
5. **Stop Attendance** after 10 minutes
6. **View Progress** (Progress Tracking tab)
7. **Export Data** (Export Data tab)

### As Student:

1. **Login** with student credentials (e.g., CS001 / 2003-01-15)
2. **Select Day 1** (if enabled by admin)
3. **Mark Attendance** when window is open
   - Allow camera permissions
   - Capture photo
4. **Submit Assignments** (only after marking attendance)
5. **Logout**

## Common Issues

### MongoDB Not Running
```bash
# Check if MongoDB is running
mongosh
# If it fails, start MongoDB service
```

### Port Already in Use
- Backend (5000): Change `PORT` in `backend/.env`
- Frontend (5173): Change port in `frontend/vite.config.js`

### Camera Not Working
- Grant camera permissions in browser settings
- Use Chrome/Firefox for best compatibility
- Ensure you're on localhost (HTTPS not required)

## Next Steps

1. **Add More Students**: Use admin dashboard to preload student data
2. **Create More Days**: Use admin dashboard to create additional workshop days
3. **Test Concurrency**: Open multiple browser tabs with different student logins
4. **Export Reports**: Download attendance and assignment Excel files

## Stopping the Application

1. Press `Ctrl+C` in both terminal windows (frontend and backend)
2. Optionally stop MongoDB:
   - Windows: `net stop MongoDB`
   - macOS/Linux: `brew services stop mongodb-community`

## Need Help?

Check the main README.md for:
- Full API documentation
- Database schema details
- Security features
- Troubleshooting guide
