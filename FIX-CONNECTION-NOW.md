# 🚨 Fix "Can't Connect to Backend" - Do This Now

## Your IP is Correct: `192.168.201.105` ✅

The issue is the backend isn't responding (timeout). Follow these steps:

---

## Step 1: Check Backend is Running

**Look at your backend terminal:**
- ✅ Should see: `Nest application successfully started`
- ✅ Should see: `Listening on 0.0.0.0:3000` or `Listening on port 3000`
- ❌ If you see errors → Backend crashed

**If backend isn't running:**
```bash
cd server
npm run start:dev
```

**Wait for:** `Nest application successfully started` (don't proceed until you see this)

---

## Step 2: Test Backend from Browser

**Open this in your browser (on your PC):**
```
http://localhost:3000/stores
```

**Expected:**
- ✅ Shows JSON data (list of stores)
- ❌ Shows error/timeout → Backend not running or crashed

**If browser shows error:**
- Check backend terminal for error messages
- Backend might have crashed → Restart it

---

## Step 3: Test Backend from PowerShell

**Run this command:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/stores"
```

**Expected:**
- ✅ Returns JSON data
- ❌ Error → Backend not running

**If this fails:**
- Backend isn't running → Start it with `npm run start:dev`
- Or backend crashed → Check terminal for errors

---

## Step 4: Check Backend Logs When Searching

**When you search in the app, check backend terminal:**
- ✅ Should see: `GET /products/search/fast?q=...`
- ❌ See nothing → Frontend can't reach backend
- ❌ See errors → Backend issue

---

## Step 5: Restart Everything (Complete Reset)

**Do this in order:**

1. **Stop backend** (Ctrl+C in backend terminal)

2. **Start backend:**
   ```bash
   cd server
   npm run start:dev
   ```
   **Wait for:** `Nest application successfully started`

3. **Test backend works:**
   - Open browser: `http://localhost:3000/stores`
   - Should show JSON

4. **Stop Metro** (Ctrl+C in Metro terminal)

5. **Start Metro with cache clear:**
   ```bash
   cd client
   npx expo start --clear
   ```

6. **Reload app in Expo Go:**
   - Shake phone → Reload
   - Or close and reopen Expo Go

---

## Step 6: Check Network

**Phone and PC must be on same Wi-Fi:**
- ✅ Same Wi-Fi → Should work
- ❌ Phone on mobile data → Won't work
- ❌ Different Wi-Fi → Won't work

**Check firewall:**
- Windows Firewall might block port 3000
- Try temporarily disabling firewall to test

---

## Common Issues & Fixes:

### Issue: Backend terminal shows errors
- **Fix:** Check error message, fix the issue, restart backend

### Issue: Backend starts then crashes
- **Fix:** Check database is running, check `.env` file is correct

### Issue: "Connection refused"
- **Fix:** Backend not running → Start it

### Issue: "Timeout" / "Aborted"
- **Fix:** Backend running but slow → Check backend logs, restart backend

### Issue: Backend works in browser but not in app
- **Fix:** Network issue → Check same Wi-Fi, check firewall

---

## Quick Test:

**Run this and share the result:**
```powershell
# Test backend
Invoke-RestMethod -Uri "http://localhost:3000/stores"

# Check IP
ipconfig | findstr IPv4
```

---

## If Still Not Working:

**Try this temporary fix (for testing only):**
1. Switch to Render backend temporarily:
   ```
   # In client/.env, comment out local and use Render:
   # EXPO_PUBLIC_API_URL=http://192.168.201.105:3000
   EXPO_PUBLIC_API_URL=https://pricelens-1.onrender.com
   ```
2. Restart Metro: `npx expo start --clear`
3. Test if it works (will be slow due to cold start)

If Render works but local doesn't → Network/firewall issue
If neither works → Different problem
