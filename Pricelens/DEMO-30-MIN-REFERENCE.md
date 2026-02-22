# ⚡ 30-Minute Demo Deployment - Quick Reference

**Keep this open while deploying!**

---

## 🔑 Quick Commands

### Generate JWT Secrets (PowerShell):
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```
**Run twice!** Save both outputs.

### Run Migrations (After deployment):
```bash
cd server
$env:DATABASE_URL="postgresql://pricelens:xxxxx@dpg-xxxxx-a.oregon-postgres.render.com/pricelens_db"
npx prisma generate
npx prisma migrate deploy
```

### Update Mobile App:
```typescript
// client/constants/api.ts
export const API_BASE_URL = 'https://your-app-name.onrender.com';
```

---

## 📝 Environment Variables (Copy-Paste Ready)

```env
DATABASE_URL=postgresql://pricelens:xxxxx@dpg-xxxxx-a.oregon-postgres.render.com/pricelens_db
NODE_ENV=production
PORT=3000
JWT_SECRET=[paste-generated-secret-1]
JWT_REFRESH_SECRET=[paste-generated-secret-2]
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-app-name.onrender.com/auth/google/callback
SERPAPI_KEY=your-serpapi-key
OILPRICEAPI_KEY=your-oilpriceapi-key
APIFY_API_KEY=your-apify-key
CORS_ORIGIN=*
LOG_LEVEL=info
```

---

## 🎯 Render.com Settings

### Database:
- **Name:** `pricelens-demo-db`
- **Region:** `Oregon (US West)`
- **Plan:** `Free`

### Backend:
- **Root Directory:** `server` ⚠️ **IMPORTANT!**
- **Build Command:** 
  ```
  npm install --legacy-peer-deps && npx prisma generate && npm run build
  ```
- **Start Command:**
  ```
  npm run start:prod
  ```

---

## ✅ Quick Test URLs

After deployment, test these:

1. **Swagger Docs:**
   ```
   https://your-app-name.onrender.com/api
   ```

2. **Search Test:**
   ```
   https://your-app-name.onrender.com/products/search?q=laptop
   ```

3. **Health Check:**
   ```
   https://your-app-name.onrender.com/health
   ```

---

## 🚨 Common Issues - One-Line Fixes

| Issue | Fix |
|-------|-----|
| Build fails | Check Root Directory is `server` |
| Database error | Use "Internal Database URL" not external |
| CORS error | Add `CORS_ORIGIN=*` |
| Prisma error | Add `npx prisma generate` to build command |
| Port error | Add `PORT=3000` to env vars |
| Slow first load | Normal on free tier (30-60 sec) |

---

## 📱 Mobile App Quick Update

1. Edit: `client/constants/api.ts`
2. Change: `API_BASE_URL` to your Render URL
3. Restart: `npm start` in client folder
4. Test: Scan QR code, try search

---

## ⏱️ Time Check

- **0-5 min:** Prep & secrets ✅
- **5-10 min:** Database ✅
- **10-20 min:** Backend ✅
- **20-25 min:** Migrations ✅
- **25-30 min:** Testing ✅

**You should be done by now!** 🎉

---

## 🎯 Final Checklist

- [ ] Backend URL works
- [ ] Swagger docs accessible
- [ ] Search endpoint returns data
- [ ] Mobile app updated
- [ ] Tested on phone
- [ ] Ready for demo!

---

## 📞 Emergency Contacts

- **Render Support:** https://render.com/docs
- **Full Guide:** See `DEMO-DEPLOYMENT-TODAY.md`

**Good luck!** 🚀




