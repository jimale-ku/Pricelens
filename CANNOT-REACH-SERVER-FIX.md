# "Can't Reach Server" - Troubleshooting Guide

## ✅ Code Pushed to GitHub
- Commit: `2190cb6`
- Changes: expo-keep-awake fix + Metro optimization
- **Render should auto-deploy** (if auto-deploy is enabled)

---

## 🔍 Why "Can't Reach Server" Happens

The app is trying to connect to: `https://pricelens-1.onrender.com`

### **Most Common Causes:**

1. **Render Backend is Sleeping** (Free Tier)
   - Render free tier sleeps after ~15 minutes of inactivity
   - First request after sleep takes 30-60 seconds (cold start)
   - App times out before server responds → "Can't reach server"

2. **Render is Still Deploying**
   - After code push, Render needs 2-5 minutes to deploy
   - During deployment, backend is unavailable

3. **Backend Crashed**
   - Check Render dashboard logs for errors
   - Service might have crashed and needs restart

4. **App Needs Restart**
   - After code changes, restart Expo app to get latest code
   - Old code might be cached

---

## 🚀 Quick Fixes (Try These in Order)

### **Fix 1: Wake Render Backend (Most Likely Fix)**

**Before testing the app:**

1. Open in browser: `https://pricelens-1.onrender.com/stores`
2. Wait 30-60 seconds for it to load (cold start)
3. You should see JSON data
4. **Then** open the app - server will be awake

**Or use UptimeRobot (free, keeps it awake):**
- Go to https://uptimerobot.com
- Add monitor: `https://pricelens-1.onrender.com/stores`
- Check every 5 minutes
- Render won't sleep during the day

---

### **Fix 2: Check Render Deployment Status**

1. Go to: https://dashboard.render.com
2. Open your **pricelens** service
3. Check status:
   - ✅ **Live** = Backend is running
   - ⏳ **Building** = Still deploying (wait 2-5 min)
   - ❌ **Failed** = Deployment failed (check logs)

---

### **Fix 3: Restart Expo App**

After code changes, restart the app:

1. **Close Expo Go app** completely
2. **Restart Metro:**
   ```bash
   cd client
   npx expo start --clear
   ```
3. **Scan QR code again** to reload app with latest code

---

### **Fix 4: Check Render Logs**

If still not working:

1. Go to Render dashboard
2. Click on your service
3. Go to **Logs** tab
4. Look for errors:
   - Database connection errors?
   - Environment variable missing?
   - Port conflicts?
   - Build failures?

---

## 📋 Step-by-Step Checklist

- [ ] **Wake Render:** Open `https://pricelens-1.onrender.com/stores` in browser (wait 30-60s)
- [ ] **Check Render Status:** Dashboard shows "Live" (not "Building" or "Failed")
- [ ] **Restart Expo:** Close app, restart Metro with `--clear`, scan QR again
- [ ] **Check API URL:** Confirm app uses `https://pricelens-1.onrender.com` (not local IP)
- [ ] **Check Network:** Phone has internet connection
- [ ] **Check Render Logs:** No errors in deployment logs

---

## 🎯 Expected Behavior

### **If Render is Awake:**
- App connects in 2-5 seconds ✅
- Products load normally ✅
- No "can't reach server" error ✅

### **If Render is Sleeping:**
- First request takes 30-60 seconds ⏳
- App might timeout → "can't reach server" ❌
- **Solution:** Wake Render first (open URL in browser)

---

## 💡 Pro Tips

1. **Before Client Demo:**
   - Wake Render 5-10 minutes before: Open `/stores` in browser
   - Or use UptimeRobot to keep it awake

2. **For Development:**
   - Use local backend (faster, no cold starts):
     - Set `EXPO_PUBLIC_API_URL=http://YOUR_PC_IP:3000` in `client/.env`
     - Run `cd server && npm run start:dev`
     - Run `cd client && npx expo start`

3. **For Production:**
   - Upgrade Render to paid plan ($7/month) - no sleep, always fast

---

## 🔧 Still Not Working?

If none of the above fixes work:

1. **Check Render Service:**
   - Is it running? (Dashboard shows "Live")
   - Any errors in logs?
   - Environment variables set correctly?

2. **Test Backend Directly:**
   - Open: `https://pricelens-1.onrender.com/stores`
   - Should return JSON
   - If it doesn't work in browser → backend issue (not app issue)

3. **Check App Code:**
   - Confirm `client/constants/api.ts` has: `https://pricelens-1.onrender.com`
   - Restart Metro with `--clear` flag
   - Rebuild app if needed

---

## 📞 Quick Test

**Right now, do this:**

1. Open browser: `https://pricelens-1.onrender.com/stores`
2. Wait 30-60 seconds
3. Should see JSON response
4. Then open Expo app
5. Should connect ✅

If browser doesn't load → Render backend issue (check dashboard)
If browser loads but app doesn't → App/network issue (restart app, check network)
