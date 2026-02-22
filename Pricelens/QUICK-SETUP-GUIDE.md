# 🚀 Quick Setup Guide - Test App with Expo Go

**Step-by-step guide to get your app running with Expo Go (minimal downloads)**

---

## ✅ **Step 1: Download Node.js** (~30MB)

### **For Apple Silicon (M1/M2/M3 Mac):**
Download: https://nodejs.org/dist/v24.13.1/node-v24.13.1.pkg

### **For Intel Mac:**
Download: https://nodejs.org/dist/v24.13.1/node-v24.13.1.pkg

**Or visit:** https://nodejs.org/en/download
- Choose: **macOS Installer (.pkg)** - LTS version

**After download:**
1. Double-click the `.pkg` file
2. Follow installation wizard
3. Click "Install"
4. Enter your password if asked

**Verify installation:**
```bash
node --version  # Should show v24.x.x
npm --version   # Should show 10.x.x
```

---

## ✅ **Step 2: Install Expo CLI** (~5MB)

Open Terminal and run:
```bash
npm install -g expo-cli
```

**Verify:**
```bash
expo --version
```

---

## ✅ **Step 3: Set Up Cloud Database (Supabase)** - NO DOWNLOAD!

Instead of downloading PostgreSQL, use free cloud database:

1. **Go to:** https://supabase.com
2. **Click:** "Start your project" (free)
3. **Sign up** with GitHub/Google/Email
4. **Create new project:**
   - Name: `pricelens-dev`
   - Database password: (create a strong password, save it!)
   - Region: Choose closest to you
   - Click "Create new project"
5. **Wait 2 minutes** for setup
6. **Get database URL:**
   - Go to: **Settings** → **Database**
   - Find **Connection string** → **URI**
   - Copy the URL (looks like: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)

**Save this URL - you'll need it!**

---

## ✅ **Step 4: Install Project Dependencies**

### **Backend Dependencies:**
```bash
cd /Users/g/Documents/priceLens_mac/Pricelens/server
npm install --legacy-peer-deps
```

**This will download ~200MB of packages** (one-time download)

### **Frontend Dependencies:**
```bash
cd /Users/g/Documents/priceLens_mac/Pricelens/client
npm install --legacy-peer-deps
```

**This will download ~300MB of packages** (one-time download)

**Total: ~500MB** (but you only need to do this once)

---

## ✅ **Step 5: Configure Backend**

### **Create `.env` file in `server` folder:**

```bash
cd /Users/g/Documents/priceLens_mac/Pricelens/server
```

Create file named `.env` with this content:

```env
# Database (from Supabase)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"

# JWT Secrets (generate random strings)
JWT_SECRET="your-secret-key-min-32-characters-long-random-string-here"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-characters-long-random-string-here"

# Server Port
PORT=3000

# Environment
NODE_ENV=development
```

**Replace:**
- `YOUR_PASSWORD` with your Supabase database password
- `db.xxxxx.supabase.co` with your actual Supabase URL
- Generate JWT secrets (see below)

**Generate JWT secrets (run in terminal):**
```bash
# macOS/Linux
openssl rand -base64 32
```
Run this twice to get two different secrets.

---

## ✅ **Step 6: Set Up Database**

```bash
cd /Users/g/Documents/priceLens_mac/Pricelens/server

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed database
npm run seed
```

---

## ✅ **Step 7: Start Backend Server**

```bash
cd /Users/g/Documents/priceLens_mac/Pricelens/server
npm run start:dev
```

**Keep this terminal open!** Backend should be running on `http://localhost:3000`

**Test it:** Open browser → `http://localhost:3000/api` (should show Swagger docs)

---

## ✅ **Step 8: Configure Frontend**

### **Find your computer's IP address:**

```bash
# macOS
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Look for something like: `192.168.1.5` or `192.168.0.10`

### **Update API URL:**

Edit file: `client/constants/api.ts`

Change:
```typescript
export const API_BASE_URL = 'http://YOUR_IP_ADDRESS:3000';
```

**Example:**
```typescript
export const API_BASE_URL = 'http://192.168.1.5:3000';
```

**Important:** Use your actual IP address, NOT `localhost`!

---

## ✅ **Step 9: Start Frontend (Expo)**

**Open a NEW terminal window** (keep backend running in first terminal):

```bash
cd /Users/g/Documents/priceLens_mac/Pricelens/client
npm start
```

**You should see:**
- QR code in terminal
- Metro bundler running
- Expo DevTools opened

---

## ✅ **Step 10: Connect with Expo Go**

### **On Your Phone:**

1. **Install Expo Go app** (if not installed):
   - **iOS:** https://apps.apple.com/app/expo-go/id982107779
   - **Android:** https://play.google.com/store/apps/details?id=host.exp.exponent

2. **Make sure phone and computer are on SAME WiFi network**

3. **Open Expo Go app**

4. **Scan QR code** from terminal:
   - **iOS:** Use Camera app to scan QR code
   - **Android:** Use Expo Go app to scan QR code

5. **App should load!** 🎉

---

## 🐛 **Troubleshooting**

### **"Cannot connect to database"**
- Check Supabase project is running
- Verify `DATABASE_URL` in `.env` is correct
- Make sure password is correct

### **"Cannot connect to API from phone"**
- Make sure phone and computer are on same WiFi
- Check `API_BASE_URL` uses your IP (not localhost)
- Verify backend is running (`http://localhost:3000/api`)
- Try disabling VPN if active

### **"Port 3000 already in use"**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or change PORT in server/.env to 3001
```

### **"Expo Go can't load app"**
- Make sure backend is running
- Check API URL is correct
- Try: `expo start -c` (clears cache)

---

## 📊 **Data Usage Summary**

| Step | Download Size | When |
|------|---------------|------|
| Node.js | ~30MB | Now |
| Expo CLI | ~5MB | After Node.js |
| Backend deps | ~200MB | One-time |
| Frontend deps | ~300MB | One-time |
| **Total** | **~535MB** | **One-time** |

**After first setup, you only need:**
- Backend running (`npm run start:dev`)
- Frontend running (`npm start`)
- Expo Go app on phone

---

## ✅ **Quick Commands Reference**

```bash
# Check installations
node --version
npm --version
expo --version
git --version

# Start backend (Terminal 1)
cd server
npm run start:dev

# Start frontend (Terminal 2)
cd client
npm start

# Database commands
cd server
npx prisma generate
npx prisma migrate deploy
npm run seed
```

---

## 🎉 **You're Ready!**

Once everything is set up:
- ✅ Backend running on port 3000
- ✅ Frontend running with Expo
- ✅ Expo Go connected
- ✅ App visible on your phone

**Start testing your app!** 🚀
