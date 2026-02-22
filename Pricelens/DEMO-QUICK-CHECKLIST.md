# ✅ Demo Deployment Checklist - Print This!

**Follow this checklist to deploy in 30 minutes**

---

## ⏱️ Timeline: 30 Minutes

- [ ] **0-5 min:** Prepare code & generate secrets
- [ ] **5-10 min:** Deploy database (Render)
- [ ] **10-20 min:** Deploy backend (Render)
- [ ] **20-25 min:** Run migrations
- [ ] **25-30 min:** Test & update mobile app

---

## 📋 Step-by-Step Checklist

### **PREPARATION (5 min)**
- [ ] Code is on GitHub
- [ ] Generated JWT_SECRET (PowerShell command)
- [ ] Generated JWT_REFRESH_SECRET
- [ ] Have API keys ready (SERPAPI, OilPriceAPI, Apify)

### **DATABASE (5 min)**
- [ ] Signed up on Render.com
- [ ] Created PostgreSQL database
- [ ] Copied "Internal Database URL"
- [ ] Database status: "Available"

### **BACKEND (10 min)**
- [ ] Created Web Service on Render
- [ ] Connected GitHub repo
- [ ] Set Root Directory: `server`
- [ ] Set Build Command: `npm install --legacy-peer-deps && npx prisma generate && npm run build`
- [ ] Set Start Command: `npm run start:prod`
- [ ] Added all environment variables:
  - [ ] DATABASE_URL
  - [ ] NODE_ENV=production
  - [ ] PORT=3000
  - [ ] JWT_SECRET
  - [ ] JWT_REFRESH_SECRET
  - [ ] SERPAPI_KEY
  - [ ] OILPRICEAPI_KEY
  - [ ] APIFY_API_KEY
  - [ ] CORS_ORIGIN=*
- [ ] Deployment started
- [ ] Build successful (check logs)

### **MIGRATIONS (5 min)**
- [ ] Backend URL copied
- [ ] Ran `npx prisma generate` locally
- [ ] Ran `npx prisma migrate deploy` locally
- [ ] Migrations successful

### **TESTING (5 min)**
- [ ] Test `/api` endpoint (Swagger docs)
- [ ] Test `/products/search?q=laptop` endpoint
- [ ] Updated `client/constants/api.ts` with backend URL
- [ ] Tested mobile app connection
- [ ] Can search products on phone

---

## 🎯 Demo Ready Checklist

- [ ] Backend is live and responding
- [ ] Database has tables (migrations run)
- [ ] API endpoints working
- [ ] Mobile app connects to backend
- [ ] Can search for products
- [ ] Product images loading
- [ ] No errors in logs

---

## 🚨 Emergency Backup Plan

**If deployment fails:**
1. Use localhost (your current setup)
2. Use ngrok to expose localhost:
   ```bash
   npm install -g ngrok
   ngrok http 3000
   ```
3. Update mobile app with ngrok URL
4. Demo works! (temporary solution)

---

## 📱 Quick Mobile App Update

```typescript
// client/constants/api.ts
export const API_BASE_URL = 'https://your-app-name.onrender.com';
```

Then:
```bash
cd client
npm start
# Scan QR code
```

---

## ✅ Success Indicators

**Backend is working if:**
- ✅ `https://your-app.onrender.com/api` shows Swagger
- ✅ `https://your-app.onrender.com/products/search?q=laptop` returns JSON
- ✅ Logs show "Nest application successfully started"

**Mobile app is working if:**
- ✅ Can connect to backend
- ✅ Search returns results
- ✅ Products display with images

---

## 🎉 You're Ready!

**Backend URL:** `https://your-app-name.onrender.com`  
**Swagger Docs:** `https://your-app-name.onrender.com/api`  
**Mobile App:** Updated and connected ✅

**Time to demo: NOW!** 🚀




