# ⚡ Deploy for Client Demo TODAY - 30 Minute Guide

**Get your app live in 30 minutes for today's demo!**

---

## 🎯 Fastest Option: Render.com (15-20 minutes)

**Why Render?**
- ✅ Free tier (works for demos)
- ✅ No credit card needed
- ✅ Auto-deploys from GitHub
- ✅ HTTPS included
- ✅ Database + Backend in one place

---

## 📋 Step-by-Step (Follow Exactly)

### **STEP 1: Prepare Your Code (5 minutes)**

#### 1.1: Make sure your code is on GitHub
```bash
# If not already on GitHub:
cd C:\Users\MTC\Documents\Pricelens
git init
git add .
git commit -m "Ready for deployment"
# Push to GitHub (create repo first on github.com)
```

#### 1.2: Generate JWT Secrets (Windows PowerShell)
```powershell
# Open PowerShell and run:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```
**Run this TWICE** - save both outputs as `JWT_SECRET` and `JWT_REFRESH_SECRET`

#### 1.3: Get your API keys ready
- SERPAPI_KEY: (you have this)
- OILPRICEAPI_KEY: (you have this)
- APIFY_API_KEY: (you have this)

---

### **STEP 2: Deploy Database (5 minutes)**

1. **Go to:** https://render.com
2. **Sign up** (use GitHub - fastest)
3. **Click:** "New +" → "PostgreSQL"
4. **Fill in:**
   - **Name:** `pricelens-demo-db`
   - **Database:** `pricelens_db`
   - **User:** `pricelens` (or leave default)
   - **Region:** `Oregon (US West)` (closest to USA)
   - **PostgreSQL Version:** `16` (latest)
   - **Plan:** `Free` (for demo)
5. **Click:** "Create Database"
6. **Wait 2-3 minutes** (watch the progress)
7. **When ready, click on the database**
8. **Go to:** "Info" tab
9. **Copy:** "Internal Database URL" (looks like: `postgresql://pricelens:xxxxx@dpg-xxxxx-a.oregon-postgres.render.com/pricelens_db`)
   - **SAVE THIS!** You'll need it in Step 3

---

### **STEP 3: Deploy Backend (10 minutes)**

1. **In Render dashboard, click:** "New +" → "Web Service"
2. **Connect GitHub:**
   - Click "Connect account" if not connected
   - Select your repository
   - Click "Connect"
3. **Configure service:**
   - **Name:** `pricelens-backend`
   - **Region:** `Oregon (US West)`
   - **Branch:** `main` (or `master`)
   - **Root Directory:** `server` ⚠️ **IMPORTANT!**
   - **Runtime:** `Node`
   - **Build Command:** 
     ```
     npm install --legacy-peer-deps && npx prisma generate && npm run build
     ```
   - **Start Command:**
     ```
     npm run start:prod
     ```
4. **Click:** "Advanced" → "Add Environment Variable"
5. **Add these variables ONE BY ONE:**

```env
# Database (from Step 2)
DATABASE_URL=postgresql://pricelens:xxxxx@dpg-xxxxx-a.oregon-postgres.render.com/pricelens_db

# Environment
NODE_ENV=production
PORT=3000

# JWT Secrets (from Step 1.2 - paste your generated secrets)
JWT_SECRET=[paste-first-secret-here]
JWT_REFRESH_SECRET=[paste-second-secret-here]
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth (if you have it, otherwise use dummy values for demo)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-app-name.onrender.com/auth/google/callback

# API Keys (your existing keys)
SERPAPI_KEY=your-serpapi-key
OILPRICEAPI_KEY=your-oilpriceapi-key
APIFY_API_KEY=your-apify-key

# CORS (allow all for demo)
CORS_ORIGIN=*

# Optional but recommended
LOG_LEVEL=info
```

6. **Click:** "Create Web Service"
7. **Wait 5-10 minutes** for first deployment
   - Watch the logs (click "Logs" tab)
   - Should see "Build successful" and "Starting..."

---

### **STEP 4: Run Database Migrations (5 minutes)**

Once backend is deployed:

1. **Get your backend URL:** 
   - In Render, click on your web service
   - Copy the URL (e.g., `https://pricelens-backend.onrender.com`)

2. **Run migrations locally:**
   ```bash
   cd C:\Users\MTC\Documents\Pricelens\server
   
   # Set database URL (use the one from Step 2)
   $env:DATABASE_URL="postgresql://pricelens:xxxxx@dpg-xxxxx-a.oregon-postgres.render.com/pricelens_db"
   
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate deploy
   ```

3. **Optional - Seed database:**
   ```bash
   npm run seed
   ```

---

### **STEP 5: Test Your Deployment (2 minutes)**

1. **Test API:**
   - Open: `https://your-app-name.onrender.com/api`
   - Should see Swagger documentation page ✅

2. **Test Health:**
   - Open: `https://your-app-name.onrender.com/health` (if you have this endpoint)
   - Or: `https://your-app-name.onrender.com/products/search?q=laptop`
   - Should return JSON data ✅

3. **Check Logs:**
   - In Render dashboard → "Logs" tab
   - Should see "Nest application successfully started" ✅

---

### **STEP 6: Update Mobile App (5 minutes)**

1. **Edit:** `client/constants/api.ts`
   ```typescript
   export const API_BASE_URL = 'https://your-app-name.onrender.com';
   ```

2. **Restart Expo:**
   ```bash
   cd client
   npm start
   ```

3. **Test on phone:**
   - Scan QR code
   - Try searching for products
   - Should connect to live backend ✅

---

## ✅ You're Live!

**Your backend URL:** `https://your-app-name.onrender.com`

**Share with client:**
- Backend API: `https://your-app-name.onrender.com/api` (Swagger docs)
- Test search: `https://your-app-name.onrender.com/products/search?q=laptop`

---

## 🚨 Common Issues & Quick Fixes

### Issue 1: "Build failed - Prisma not found"
**Fix:** Make sure build command includes `npx prisma generate`:
```
npm install --legacy-peer-deps && npx prisma generate && npm run build
```

### Issue 2: "Database connection failed"
**Fix:** 
- Check `DATABASE_URL` is correct (from Step 2)
- Make sure you're using "Internal Database URL" (not external)
- Wait 2 minutes after creating database

### Issue 3: "Port 3000 already in use"
**Fix:** This shouldn't happen on Render, but if it does:
- Add `PORT=3000` to environment variables
- Or change to `PORT=10000`

### Issue 4: "CORS error in mobile app"
**Fix:**
- Make sure `CORS_ORIGIN=*` is set
- Or set to your specific domain

### Issue 5: "App sleeps after inactivity" (Free tier)
**Fix:**
- First request after sleep takes 30-60 seconds
- Tell client: "First load might be slow (free tier)"
- Or upgrade to paid plan ($7/month) for no sleep

### Issue 6: "Migrations failed"
**Fix:**
- Make sure database is fully created (wait 3 minutes)
- Check DATABASE_URL format is correct
- Run migrations locally first to test

---

## 🎯 Alternative: Even Faster (Railway - 10 minutes)

If Render is slow, try Railway:

1. **Go to:** https://railway.app
2. **Sign up with GitHub**
3. **"New Project"** → **"Deploy from GitHub repo"**
4. **Select your repo**
5. **Railway auto-detects Node.js**
6. **Add environment variables** (same as Render above)
7. **Set DATABASE_URL** to Render database URL (or create Railway database)
8. **Auto-deploys!**

**Railway is faster but requires credit card** (free $5 credit)

---

## 📱 For Mobile App Demo

### Option A: Expo Go (Easiest)
1. Update `API_BASE_URL` in `client/constants/api.ts`
2. Run `npm start` in client folder
3. Scan QR code with Expo Go app
4. Test on phone ✅

### Option B: Build APK (More Professional)
```bash
cd client
npm install -g eas-cli
eas login
eas build --platform android --profile production
```
**Takes 15-20 minutes** - do this while backend deploys

---

## 🎉 Demo Checklist

Before showing client:

- [ ] Backend URL works (`/api` shows Swagger)
- [ ] Database migrations run successfully
- [ ] Test search endpoint returns data
- [ ] Mobile app connects to backend
- [ ] Can search for products
- [ ] Can see product images
- [ ] All features working

**You're ready for the demo!** 🚀

---

## 💡 Pro Tips for Demo

1. **First request is slow** (free tier) - warn client
2. **Show Swagger docs** - looks professional: `/api`
3. **Test before client arrives** - make sure everything works
4. **Have backup plan** - localhost still works if needed
5. **Show both:** Backend API + Mobile app

---

## 📞 Need Help RIGHT NOW?

**If stuck:**
1. Check Render logs (click "Logs" tab)
2. Common errors are in "Common Issues" above
3. Render support: https://render.com/docs

**Quick test:**
```bash
# Test if backend is up
curl https://your-app-name.onrender.com/api

# Should return HTML (Swagger page)
```

---

## ✅ Final Checklist

- [ ] Database created on Render
- [ ] Backend deployed on Render
- [ ] Environment variables set
- [ ] Migrations run
- [ ] Backend URL tested
- [ ] Mobile app API URL updated
- [ ] Tested on phone
- [ ] Ready for demo!

**Time to complete: 30-45 minutes**

**You've got this!** 🎯




