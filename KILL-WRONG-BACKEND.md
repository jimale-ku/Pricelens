# 🚨 Kill Wrong Backend - Do This Now

## Found: TWO backends running on port 3000!
- PID 13592
- PID 11676

One of them is OneMind (wrong backend).

---

## Step 1: Kill Both Processes

**Run these commands:**

```powershell
# Kill process 13592
taskkill /PID 13592 /F

# Kill process 11676
taskkill /PID 11676 /F
```

**Or kill all Node processes (easier):**
```powershell
taskkill /IM node.exe /F
```

---

## Step 2: Verify Port 3000 is Free

**Check nothing is using port 3000:**
```powershell
netstat -ano | findstr :3000
```

**Should show:** Nothing (port is free)

---

## Step 3: Start PriceLens Backend

**Make sure you're in PriceLens directory:**
```powershell
cd C:\Users\MTC\Documents\Pricelens_new\server
```

**Start PriceLens backend:**
```bash
npm run start:dev
```

**Wait for:**
- ✅ `🚀 Nest application successfully started`
- ✅ Should say "PriceLens API" (not OneMind)

---

## Step 4: Verify It's PriceLens

**Test health endpoint:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

**Should return:**
```json
{
  "status": "ok",
  "service": "PriceLens API"  // ✅ Correct!
}
```

**Test stores endpoint:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/stores"
```

**Should return:** List of stores (JSON array)

---

## Quick All-in-One Fix:

```powershell
# Kill all Node processes
taskkill /IM node.exe /F

# Wait 2 seconds
Start-Sleep -Seconds 2

# Navigate to PriceLens
cd C:\Users\MTC\Documents\Pricelens_new\server

# Start PriceLens backend
npm run start:dev
```

---

## After This:

1. ✅ Only PriceLens backend running
2. ✅ Health shows "PriceLens API"
3. ✅ `/stores` endpoint works
4. ✅ Frontend can connect
5. ✅ Search works

**Then restart Metro and test the app!**
