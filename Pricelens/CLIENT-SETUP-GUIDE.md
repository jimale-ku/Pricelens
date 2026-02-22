# 🚀 Client Setup Guide - PriceLens Project

**Complete step-by-step guide to set up and run the PriceLens project for presentation.**

---

## 📋 Prerequisites

Before starting, make sure you have:

### Required Software:
- ✅ **Node.js** v20.x or higher ([Download](https://nodejs.org/))
- ✅ **PostgreSQL** v15 or higher ([Download](https://www.postgresql.org/download/))
- ✅ **Git** ([Download](https://git-scm.com/downloads))
- ✅ **Expo Go App** on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Optional (but helpful):
- ✅ **VS Code** or any code editor
- ✅ **Postman** (for testing API)

---

## 📦 Step 1: Get the Project Code

### Option A: If you have the code folder
1. **Copy the entire `Pricelens` folder** to your computer
2. **Open terminal/command prompt** in the `Pricelens` folder

### Option B: If using Git
```bash
git clone <repository-url>
cd Pricelens
```

---

## 🗄️ Step 2: Set Up Database (Backend)

### 2.1 Install PostgreSQL
1. Download and install PostgreSQL from https://www.postgresql.org/download/
2. During installation, **remember your password** (you'll need it)
3. Make sure PostgreSQL service is running

### 2.2 Create Database
1. Open **pgAdmin** (comes with PostgreSQL) or use command line
2. Create a new database:
   ```sql
   CREATE DATABASE pricelens_db;
   ```

---

## ⚙️ Step 3: Configure Backend

### 3.1 Navigate to Server Folder
```bash
cd server
```

### 3.2 Install Dependencies
```bash
npm install --legacy-peer-deps
```

> ⚠️ **Important:** Use `--legacy-peer-deps` flag (required for this project)

### 3.3 Create Environment File
Create a file named `.env` in the `server` folder:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/pricelens_db?schema=public"

# JWT Secrets (generate random strings)
JWT_SECRET="your-secret-key-min-32-characters-long-random-string"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-characters-long-random-string"

# PriceAPI Key (if you have one)
PRICEAPI_KEY="your-priceapi-key-here"

# Server Port
PORT=3000
```

**To generate JWT secrets (Windows PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Or use this online tool:** https://randomkeygen.com/

### 3.4 Set Up Database
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed database with sample data
npm run seed
```

### 3.5 Start Backend Server
```bash
npm run start:dev
```

**You should see:**
```
✅ Server running on http://localhost:3000
```

**Keep this terminal open!** The backend must be running.

---

## 📱 Step 4: Configure Frontend

### 4.1 Open New Terminal
**Open a NEW terminal window** (keep backend running in first terminal)

### 4.2 Navigate to Client Folder
```bash
cd client
```

### 4.3 Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 4.4 Update API URL
Open `client/constants/api.ts` and update the API URL:

**Find your computer's IP address:**
- **Windows:** Open Command Prompt, type: `ipconfig`
- **Mac/Linux:** Open Terminal, type: `ifconfig`
- Look for **IPv4 Address** (e.g., `192.168.1.5`)

**Update the file:**
```typescript
// client/constants/api.ts
export const API_BASE_URL = 'http://YOUR_IP_ADDRESS:3000';

// Example:
// export const API_BASE_URL = 'http://192.168.1.5:3000';
```

> ⚠️ **Important:** Replace `YOUR_IP_ADDRESS` with your actual IP address (not `localhost`)

---

## 🚀 Step 5: Start Frontend (Expo)

### 5.1 Start Expo
```bash
npm start
```

**You should see:**
```
✅ Metro bundler running
✅ Expo DevTools opened
✅ QR code displayed
```

### 5.2 Connect with Expo Go

**On Your Phone:**
1. **Install Expo Go app** (if not already installed)
2. **Open Expo Go app**
3. **Scan the QR code** from terminal
   - **iOS:** Use Camera app to scan
   - **Android:** Use Expo Go app to scan

**Alternative:**
- **iOS:** Press `i` in terminal to open in iOS Simulator
- **Android:** Press `a` in terminal to open in Android Emulator

---

## ✅ Step 6: Verify Everything Works

### Test Backend:
1. Open browser: `http://localhost:3000/api`
2. You should see **Swagger API documentation**

### Test Frontend:
1. App should open in Expo Go
2. You should see the home screen
3. Try searching for a product (e.g., "laptop")

---

## 🎯 Quick Start Commands (Summary)

**Terminal 1 - Backend:**
```bash
cd server
npm install --legacy-peer-deps
# Create .env file (see Step 3.3)
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm install --legacy-peer-deps
# Update API_BASE_URL in constants/api.ts
npm start
# Scan QR code with Expo Go
```

---

## 🐛 Troubleshooting

### Issue 1: "Cannot connect to database"
**Solution:**
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env` is correct
- Make sure database `pricelens_db` exists

### Issue 2: "Port 3000 already in use"
**Solution:**
```bash
# Windows - Find and kill process
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Or change PORT in .env to 3001
```

### Issue 3: "Cannot connect to API from phone"
**Solution:**
- Make sure phone and computer are on **same WiFi network**
- Check firewall isn't blocking port 3000
- Verify `API_BASE_URL` uses your IP (not localhost)
- Try disabling VPN if active

### Issue 4: "Module not found" errors
**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install --legacy-peer-deps
```

### Issue 5: "Expo Go can't load app"
**Solution:**
- Make sure backend is running
- Check API URL is correct
- Try clearing Expo cache: `npx expo start -c`

---

## 📱 For Client Presentation

### What to Show:
1. ✅ **Home Screen** - Category navigation
2. ✅ **Category Pages** - Product listings
3. ✅ **Search Functionality** - Search for products
4. ✅ **Product Cards** - Show prices across stores
5. ✅ **Store Logos** - Professional logos displayed
6. ✅ **Product Images** - Images from PriceAPI

### Demo Flow:
1. Open app in Expo Go
2. Navigate to "Kitchen & Appliances" category
3. Show popular items with store logos
4. Search for "laptop" or "iPhone"
5. Show product with images and prices
6. Show price comparison across stores

---

## 🔐 Important Notes

### For Demo/Presentation:
- ✅ **PriceAPI Key:** If you have one, add it to `server/.env`
- ✅ **Database:** Can use empty database (products will be fetched from PriceAPI)
- ✅ **Network:** Make sure phone and computer are on same WiFi

### For Production (Later):
- Deploy backend to cloud (AWS, Heroku, etc.)
- Deploy frontend or build native app
- Set up production database
- Configure environment variables

---

## 📞 Need Help?

If something doesn't work:

1. **Check both terminals** - Backend and Frontend must be running
2. **Check database** - PostgreSQL must be running
3. **Check network** - Phone and computer on same WiFi
4. **Check API URL** - Must use IP address, not localhost

---

## ✅ Setup Checklist

- [ ] Node.js installed
- [ ] PostgreSQL installed and running
- [ ] Database `pricelens_db` created
- [ ] Backend dependencies installed
- [ ] `.env` file created with correct values
- [ ] Database migrations run
- [ ] Backend server running (Terminal 1)
- [ ] Frontend dependencies installed
- [ ] `API_BASE_URL` updated with your IP
- [ ] Expo Go app installed on phone
- [ ] Frontend running (Terminal 2)
- [ ] App connected via Expo Go
- [ ] Can see home screen
- [ ] Can search for products

---

## 🎉 You're Ready!

Once all steps are complete, your client can:
- ✅ View the app in Expo Go
- ✅ Navigate categories
- ✅ Search products
- ✅ See prices and store logos
- ✅ Experience the full app!

**Good luck with your presentation!** 🚀










