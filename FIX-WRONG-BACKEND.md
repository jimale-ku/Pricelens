# 🚨 Fix: Wrong Backend Running (OneMind instead of PriceLens)

## Problem:
You're seeing "OneMind API" but working on PriceLens. This means **OneMind backend is running on port 3000** instead of PriceLens backend.

---

## Solution: Stop OneMind, Start PriceLens

### Step 1: Find What's Running on Port 3000

**Check what process is using port 3000:**
```powershell
netstat -ano | findstr :3000
```

This will show the Process ID (PID) using port 3000.

**Kill that process:**
```powershell
# Replace <PID> with the number from above
taskkill /PID <PID> /F
```

**Or kill all Node processes (nuclear option):**
```powershell
taskkill /IM node.exe /F
```

---

### Step 2: Make Sure You're in PriceLens Directory

**Verify you're in the right project:**
```powershell
cd C:\Users\MTC\Documents\Pricelens_new\server
pwd  # Should show Pricelens_new\server
```

---

### Step 3: Start PriceLens Backend

**Start the correct backend:**
```bash
cd server
npm run start:dev
```

**Wait for:**
- ✅ `🚀 Nest application successfully started`
- ✅ Should say "PriceLens API" not "OneMind API"

---

### Step 4: Verify It's PriceLens

**Test the health endpoint:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

**Should return:**
```json
{
  "status": "ok",
  "service": "PriceLens API"  // NOT "OneMind API"
}
```

---

## Quick Fix (All at Once):

```powershell
# 1. Kill all Node processes
taskkill /IM node.exe /F

# 2. Navigate to PriceLens server
cd C:\Users\MTC\Documents\Pricelens_new\server

# 3. Start PriceLens backend
npm run start:dev
```

---

## Prevention:

**Check which backend is running:**
- Look at terminal window title/name
- Check which directory the terminal is in
- Test health endpoint to verify

**Always start backend from PriceLens directory:**
```bash
cd C:\Users\MTC\Documents\Pricelens_new\server
npm run start:dev
```

---

## After Fixing:

1. ✅ Backend shows "PriceLens API"
2. ✅ `/stores` endpoint should work
3. ✅ Frontend can connect
4. ✅ Search works
