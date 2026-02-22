# 🚀 Production Deployment Guide - PriceLens

**Complete guide to deploy PriceLens for your USA client (Startup-friendly options)**

---

## 📊 Current Status & What's Missing

### ✅ What You Have:
- ✅ NestJS backend (production-ready)
- ✅ React Native/Expo frontend
- ✅ PostgreSQL database schema (Prisma)
- ✅ Docker configuration (basic)
- ✅ Environment variable schema
- ✅ CI/CD pipeline (GitHub Actions)

### ❌ What's Missing for Production:
1. **Production Dockerfile** (only dev version exists)
2. **Environment variable template** (.env.sample)
3. **Production database** (currently local PostgreSQL)
4. **Production server/hosting** (backend needs deployment)
5. **Mobile app build** (Expo EAS build configuration)
6. **SSL/HTTPS certificates**
7. **Domain name configuration**
8. **Monitoring & logging** (production-grade)
9. **Backup strategy**
10. **CDN for static assets** (optional)

---

## 🎯 Deployment Options Comparison

### Option 1: **Supabase + Railway/Render** ⭐ **RECOMMENDED FOR STARTUPS**

**Best for:** Startups, quick deployment, low cost

**Pros:**
- ✅ **Free tier available** (Supabase: 500MB database, Railway: $5/month)
- ✅ **Zero DevOps** - fully managed
- ✅ **Easy setup** - connect in minutes
- ✅ **Auto-scaling** - handles traffic spikes
- ✅ **Built-in features** - Auth, Storage, Realtime (if needed)
- ✅ **PostgreSQL** - matches your current setup perfectly
- ✅ **Great documentation** - lots of tutorials

**Cons:**
- ⚠️ Can get expensive at scale (but fine for startups)
- ⚠️ Less control than AWS

**Cost:** ~$0-25/month (free tier + small backend)

---

### Option 2: **AWS (EC2 + RDS)**

**Best for:** Enterprise, need full control, high traffic

**Pros:**
- ✅ **Full control** - customize everything
- ✅ **Scalable** - handles millions of users
- ✅ **Enterprise-grade** - security, compliance
- ✅ **Many services** - S3, CloudFront, etc.

**Cons:**
- ❌ **Complex setup** - requires DevOps knowledge
- ❌ **Higher cost** - ~$50-200/month minimum
- ❌ **Time-consuming** - days to set up properly
- ❌ **Overkill for startups** - too much infrastructure

**Cost:** ~$50-200/month (EC2 + RDS + other services)

---

### Option 3: **Docker + VPS (DigitalOcean/Linode)**

**Best for:** Developers who want control, medium complexity

**Pros:**
- ✅ **Affordable** - $12-40/month
- ✅ **Full control** - your own server
- ✅ **Docker ready** - you have docker-compose.yml

**Cons:**
- ⚠️ **Manual setup** - need to configure everything
- ⚠️ **Server management** - updates, security patches
- ⚠️ **No auto-scaling** - manual scaling required

**Cost:** ~$12-40/month (VPS + managed database)

---

## 🏆 **RECOMMENDATION: Supabase + Railway** (Best for Startups)

**Why this is best for your client:**
1. **Fastest to deploy** - 2-3 hours vs days
2. **Lowest cost** - free tier covers initial users
3. **No DevOps needed** - client can manage themselves
4. **Professional** - looks good for demos
5. **Easy to scale** - upgrade when needed

---

## 📋 Step-by-Step Deployment: Supabase + Railway

### **Phase 1: Database Setup (Supabase)**

#### Step 1.1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up (free account)
3. Click "New Project"
4. Fill in:
   - **Name:** `pricelens-production`
   - **Database Password:** (save this securely!)
   - **Region:** `US East (N. Virginia)` or closest to your client
5. Wait 2 minutes for setup

#### Step 1.2: Get Database URL
1. Go to **Settings** → **Database**
2. Find **Connection string** → **URI**
3. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
4. Save this - you'll need it for Railway

#### Step 1.3: Run Migrations
```bash
cd server

# Set DATABASE_URL to Supabase URL
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres"

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database
npm run seed
```

---

### **Phase 2: Backend Deployment (Railway)**

#### Step 2.1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project"

#### Step 2.2: Deploy Backend
1. Click "Deploy from GitHub repo"
2. Select your PriceLens repository
3. Select `server` folder as root
4. Railway auto-detects Node.js

#### Step 2.3: Configure Environment Variables
In Railway dashboard, go to **Variables** tab and add:

```env
# Database (from Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# JWT Secrets (generate new ones for production!)
JWT_SECRET=[generate-32-char-random-string]
JWT_REFRESH_SECRET=[generate-32-char-random-string]
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://your-backend-url.railway.app/auth/google/callback

# Environment
NODE_ENV=production
PORT=3000

# API Keys (your existing ones)
SERPAPI_KEY=your-serpapi-key
OILPRICEAPI_KEY=your-oilpriceapi-key
APIFY_API_KEY=your-apify-key

# CORS (for mobile app)
CORS_ORIGIN=*

# Optional: Redis (if using)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

#### Step 2.4: Update Dockerfile for Production
Create/update `server/Dockerfile`:

```dockerfile
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --legacy-peer-deps --only=production

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /usr/src/app

# Copy built files and dependencies
COPY --from=base /usr/src/app/dist ./dist
COPY --from=base /usr/src/app/node_modules ./node_modules
COPY --from=base /usr/src/app/package*.json ./
COPY --from=base /usr/src/app/prisma ./prisma

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main"]
```

#### Step 2.5: Deploy
1. Railway will auto-deploy on push to main branch
2. Or click "Deploy" button
3. Wait 2-3 minutes
4. Get your backend URL: `https://your-app.railway.app`

---

### **Phase 3: Mobile App Deployment (Expo EAS)**

#### Step 3.1: Install EAS CLI
```bash
cd client
npm install -g eas-cli
eas login
```

#### Step 3.2: Configure EAS
```bash
eas build:configure
```

#### Step 3.3: Update API URL
Edit `client/constants/api.ts`:
```typescript
export const API_BASE_URL = 'https://your-backend.railway.app';
```

#### Step 3.4: Build for Production
```bash
# For Android
eas build --platform android --profile production

# For iOS (requires Apple Developer account)
eas build --platform ios --profile production
```

#### Step 3.5: Submit to App Stores
```bash
# Android (Google Play)
eas submit --platform android

# iOS (App Store)
eas submit --platform ios
```

---

## 🔒 Security Checklist

Before going live:

- [ ] **Change all default passwords**
- [ ] **Generate new JWT secrets** (don't use dev secrets!)
- [ ] **Enable HTTPS** (Railway does this automatically)
- [ ] **Set CORS_ORIGIN** to your actual domain (not `*`)
- [ ] **Review API keys** - ensure production keys are used
- [ ] **Enable rate limiting** (already in your code)
- [ ] **Set up monitoring** (Railway has built-in logs)
- [ ] **Backup database** (Supabase auto-backups daily)

---

## 📊 Cost Breakdown (Startup-Friendly)

### **Free Tier (0-1000 users/month):**
- Supabase: **$0** (500MB database, 2GB bandwidth)
- Railway: **$5/month** (512MB RAM, 1GB storage)
- Expo EAS: **$0** (free builds)
- **Total: ~$5/month**

### **Growth Tier (1000-10,000 users/month):**
- Supabase Pro: **$25/month**
- Railway Pro: **$20/month**
- **Total: ~$45/month**

### **Scale Tier (10,000+ users/month):**
- Supabase Team: **$599/month**
- Railway Scale: **$100-200/month**
- **Total: ~$700-800/month**

---

## 🚨 Alternative: Quick Demo Deployment (Render)

If you need it running **TODAY** for a demo:

### **Render.com** (Even Simpler)

1. **Database:**
   - Go to https://render.com
   - Create **PostgreSQL** database (free tier)
   - Get connection string

2. **Backend:**
   - Create **Web Service**
   - Connect GitHub repo
   - Set root directory: `server`
   - Build command: `npm install --legacy-peer-deps && npm run build`
   - Start command: `npm run start:prod`
   - Add environment variables (same as Railway)

3. **Done!** - Get URL in 5 minutes

**Cost:** Free tier available (slower, but works for demos)

---

## 📝 What You Need to Do NOW

### **Immediate (Before Client Demo):**

1. **Create .env.sample file:**
   ```bash
   cd server
   # Create template for client
   ```

2. **Update Dockerfile** (production version above)

3. **Test locally with production build:**
   ```bash
   npm run build
   npm run start:prod
   ```

4. **Choose deployment option:**
   - **Quick demo:** Render.com (free, 5 minutes)
   - **Production:** Supabase + Railway (recommended)

5. **Deploy backend** (follow Phase 2 above)

6. **Update client API URL** (point to production backend)

7. **Test everything** (search, auth, all features)

---

## 🎯 Recommended Timeline

- **Day 1:** Set up Supabase + Railway (2-3 hours)
- **Day 2:** Deploy backend, test API (2 hours)
- **Day 3:** Build mobile app, test on device (2 hours)
- **Day 4:** Final testing, client demo prep (2 hours)

**Total: ~8-10 hours of work**

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Railway Docs:** https://docs.railway.app
- **Expo EAS Docs:** https://docs.expo.dev/build/introduction/
- **Render Docs:** https://render.com/docs

---

## ✅ Post-Deployment Checklist

- [ ] Backend API responding (test `/api` endpoint)
- [ ] Database migrations applied
- [ ] Environment variables set correctly
- [ ] Mobile app connects to production API
- [ ] Authentication working (login/signup)
- [ ] Product search working
- [ ] All API keys configured
- [ ] Error monitoring set up (optional: Sentry)
- [ ] Client has access to dashboard
- [ ] Documentation shared with client

---

## 🎉 You're Ready!

Once deployed, your client can:
- ✅ Access the app from anywhere (USA or worldwide)
- ✅ Share with investors/users
- ✅ Test on real devices
- ✅ See real-time data

**Need help?** Follow the step-by-step guides above, or ask specific questions!




