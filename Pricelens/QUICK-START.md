# ⚡ Quick Start - 5 Minute Setup

**Fastest way to get the app running for your client presentation.**

---

## 🎯 Prerequisites Check

Before starting, make sure you have:
- ✅ Node.js installed (`node --version` should show v20+)
- ✅ PostgreSQL installed and running
- ✅ Expo Go app on your phone

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Database Setup
```bash
# Create database in PostgreSQL
# Open pgAdmin or psql, then:
CREATE DATABASE pricelens_db;
```

### Step 2: Backend Setup
```bash
cd server

# Install dependencies
npm install --legacy-peer-deps

# Create .env file (copy this):
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/pricelens_db?schema=public"
# JWT_SECRET="generate-random-32-char-string"
# JWT_REFRESH_SECRET="generate-random-32-char-string"
# PRICEAPI_KEY="your-key-if-you-have-one"

# Setup database
npx prisma generate
npx prisma migrate deploy

# Start backend (keep this running)
npm run start:dev
```

### Step 3: Frontend Setup
**Open NEW terminal:**
```bash
cd client

# Install dependencies
npm install --legacy-peer-deps

# Update API URL (find your IP with: ipconfig on Windows, ifconfig on Mac)
# Edit: client/constants/api.ts
# Change: API_BASE_URL to your IP (e.g., 'http://192.168.1.5:3000')

# Start frontend
npm start
```

### Step 4: Connect Phone
1. **Open Expo Go** on your phone
2. **Scan QR code** from terminal
3. **App loads!** ✅

### Step 5: Test
- ✅ Backend: Open `http://localhost:3000/api` (should show Swagger)
- ✅ Frontend: App should open in Expo Go
- ✅ Search: Try searching "laptop" or "iPhone"

---

## 📝 Important Files to Edit

### 1. `server/.env`
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/pricelens_db?schema=public"
JWT_SECRET="your-32-char-random-string"
JWT_REFRESH_SECRET="your-32-char-random-string"
PRICEAPI_KEY="your-key-if-available"
```

### 2. `client/constants/api.ts`
```typescript
export const API_BASE_URL = 'http://YOUR_IP_ADDRESS:3000';
// Example: 'http://192.168.1.5:3000'
```

---

## ✅ Success Indicators

**Backend is working if:**
- Terminal shows: `✅ Server running on http://localhost:3000`
- Browser shows Swagger docs at `http://localhost:3000/api`

**Frontend is working if:**
- Terminal shows QR code
- Expo Go app loads the app
- You can see the home screen

---

## 🐛 Quick Fixes

**"Cannot connect to database"**
→ Check PostgreSQL is running and password is correct

**"Port 3000 in use"**
→ Kill process or change PORT in .env

**"Cannot connect from phone"**
→ Make sure phone and computer on same WiFi, use IP not localhost

**"Module not found"**
→ Delete `node_modules` and run `npm install --legacy-peer-deps` again

---

## 🎯 For Client Demo

**What to show:**
1. Home screen with categories
2. Category page (e.g., Kitchen Appliances)
3. Product cards with store logos
4. Search functionality
5. Product images from PriceAPI

**Demo script:**
1. "Here's the home screen with all categories"
2. "Let's check Kitchen Appliances - see the products with store logos"
3. "Now let's search for a laptop - see how it finds products with images"
4. "Notice the price comparison across different stores"

---

**That's it! You're ready to present!** 🚀










