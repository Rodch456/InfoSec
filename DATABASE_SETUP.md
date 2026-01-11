# Barangay Report System - Setup Instructions

## Database Setup

### Quick Setup (Recommended)
1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Click on "SQL" tab
3. Copy and paste the contents of `setup-db.sql`
4. Click "Go" to execute

OR

### Manual Setup via Command Line
```bash
# Connect to MySQL
mysql -u root -h localhost

# Then paste the contents of setup-db.sql
```

## Starting the Application

### Production Mode
```bash
npm run build
NODE_ENV=production node dist/index.cjs
```
Access at: `http://localhost:5000`

### Development Mode
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend  
npm run dev:client
```

## Test Credentials

Use these usernames to login (no password required initially):
- `juan` - Resident
- `maria` - Resident  
- `pedro` - Barangay Official
- `ana` - Barangay Official
- `admin` - Administrator

## Features

### Residents
- Submit incident reports
- View their own reports
- View system memos

### Barangay Officials
- View all reports
- View system memos

### Administrators
- View all reports
- Manage users
- View system logs
- View analytics
- Manage memos and ordinances
