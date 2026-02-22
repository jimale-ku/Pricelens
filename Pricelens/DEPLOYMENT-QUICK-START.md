# ⚡ Quick Deployment Guide - Get Live in 30 Minutes

**Fastest way to get your app running for client demo**

---

## 🎯 Option 1: Render.com (Easiest - 15 minutes)

### Step 1: Database (5 min)
1. Go to https://render.com → Sign up
2. Click **"New +"** → **"PostgreSQL"**
3. Name: `pricelens-db`
4. Region: `Oregon (US West)` or closest
5. Click **"Create Database"**
6. Wait 2 minutes
7. Copy **"Internal Database URL"** (save it!)

### Step 2: Backend (10 min)
1. In Render, click **"New +"** → **"Web Service"**
2. Connect your GitHub repo
3. Configure:
   - **Name:** `pricelens-backend`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install --legacy-peer-deps && npm run build`
   - **Start Command:** `npm run start:prod`
4. Click **"Advanced"** → **"Add Environment Variable"**
5. Add these variables:

```env
DATABASE_URL=[paste from Step 1]
NODE_ENV=production
PORT=3000
JWT_SECRET=[generate-random-32-chars]
JWT_REFRESH_SECRET=[generate-random-32-chars]
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-app.onrender.com/auth/google/callback
SERPAPI_KEY=your-serpapi-key
OILPRICEAPI_KEY=your-oilpriceapi-key
CORS_ORIGIN=*
```

6. Click **"Create Web Service"**
7. Wait 5 minutes for deployment
8. Get your URL: `https://your-app.onrender.com`

### Step 3: Run Migrations
```bash
cd server
export DATABASE_URL="[your-render-database-url]"
npx prisma generate
npx prisma migrate deploy
```

### Step 4: Update Client
Edit `client/constants/api.ts`:
```typescript
export const API_BASE_URL = 'https://your-app.onrender.com';
```

**Done!** ✅ Your backend is live!

---

## 🎯 Option 2: Railway (Recommended - 20 minutes)

### Step 1: Database (Supabase - 5 min)
1. Go to https://supabase.com → Sign up
2. **"New Project"** → Name: `pricelens`
3. Set password (save it!)
4. Region: `US East`
5. Wait 2 minutes
6. Go to **Settings** → **Database**
7. Copy **Connection string** (URI format)

### Step 2: Backend (Railway - 15 min)
1. Go to https://railway.app → Sign up with GitHub
2. **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repo
4. Railway auto-detects Node.js
5. Click on the service → **"Variables"** tab
6. Add all environment variables (same as Render above)
7. Set `DATABASE_URL` to Supabase connection string
8. Railway auto-deploys!

**Done!** ✅ Get URL from Railway dashboard

---

## 🎯 Option 3: Docker + DigitalOcean (30 minutes)

### Step 1: Create Droplet
1. Go to https://digitalocean.com
2. Create **Droplet**:
   - OS: **Ubuntu 22.04**
   - Plan: **$12/month** (1GB RAM)
   - Region: **New York** (closest to USA)
3. Wait 2 minutes

### Step 2: SSH into Server
```bash
ssh root@your-server-ip
```

### Step 3: Install Docker
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y
```

### Step 4: Deploy
```bash
# Clone your repo
git clone https://github.com/your-username/pricelens.git
cd pricelens/server

# Create .env file
nano .env
# (paste all environment variables)

# Start services
docker-compose up -d
```

**Done!** ✅ Access at `http://your-server-ip:3000`

---

## 🔑 Generate JWT Secrets

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Run twice to get `JWT_SECRET` and `JWT_REFRESH_SECRET`

---

## ✅ Test Your Deployment

1. **Health Check:**
   ```
   https://your-backend-url.com/api
   ```
   Should show Swagger docs

2. **Test Search:**
   ```bash
   curl https://your-backend-url.com/products/search?q=laptop
   ```

3. **Test from Mobile App:**
   - Update `client/constants/api.ts`
   - Restart Expo
   - Try searching for products

---

## 🚨 Common Issues

### Issue: "Database connection failed"
- **Fix:** Check `DATABASE_URL` format
- **Fix:** Ensure database is accessible (not blocked by firewall)

### Issue: "Prisma Client not generated"
- **Fix:** Run `npx prisma generate` before build
- **Fix:** Add to build command: `npm run build && npx prisma generate`

### Issue: "Port already in use"
- **Fix:** Change `PORT` environment variable
- **Fix:** Check if another service is using port 3000

### Issue: "CORS error in mobile app"
- **Fix:** Set `CORS_ORIGIN=*` (for testing)
- **Fix:** For production, set to your actual domain

---

## 📱 Next: Deploy Mobile App

Once backend is live:

1. **Update API URL** in `client/constants/api.ts`
2. **Build with Expo EAS:**
   ```bash
   cd client
   eas build --platform android
   ```
3. **Install APK** on Android device
4. **Test everything!**

---

## 🎉 You're Live!

Your client can now:
- ✅ Access the app from anywhere
- ✅ Test on real devices
- ✅ Share with investors/users
- ✅ See real-time data

**Need help?** Check the full `DEPLOYMENT-GUIDE.md` for detailed instructions.




