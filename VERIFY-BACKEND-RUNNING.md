# ✅ Verify PriceLens Backend is Running

## Step 1: Check Backend Terminal

**Look at your backend terminal (where you ran `npm run start:dev`):**

**Should see:**
- ✅ `🚀 Nest application successfully started on 0.0.0.0:3000`
- ✅ `📚 Swagger documentation available at http://localhost:3000/api`
- ✅ `🌐 API accessible at http://192.168.201.105:3000`
- ✅ `service: 'PriceLens API'` (in health check)

**If you see errors:**
- ❌ Database connection errors
- ❌ Prisma errors
- ❌ Module import errors
- ❌ Red error messages

**Share the backend terminal output** - especially any errors.

---

## Step 2: Test Health Endpoint

**Run this:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

**Should return:**
```json
{
  "status": "ok",
  "service": "PriceLens API",  // ✅ Should say PriceLens
  "timestamp": "...",
  "uptime": ...
}
```

**If it still says "OneMind API":**
- Wrong backend still running
- Kill all Node processes again: `taskkill /IM node.exe /F`
- Restart PriceLens backend

---

## Step 3: Check Swagger Docs

**Open in browser:**
```
http://localhost:3000/api
```

**Should show:**
- Swagger API documentation
- List of endpoints including `/stores`
- Should say "PriceLens API" at the top

**If Swagger shows `/stores` endpoint:**
- Routes are registered
- Issue might be something else

**If Swagger doesn't show `/stores`:**
- StoresModule didn't load
- Check backend terminal for errors

---

## Step 4: Check Database Connection

**StoresModule needs database connection. If database isn't connected, routes won't register.**

**Check `server/.env`:**
```
DATABASE_URL="postgresql://postgres:pricelens123@localhost:5432/pricelens_db?schema=public"
```

**Is PostgreSQL running?**
- Check Windows Services
- PostgreSQL must be running for routes to work

---

## Step 5: Restart Backend and Watch for Errors

**Do this:**

1. **Stop backend** (Ctrl+C in backend terminal)

2. **Start backend:**
   ```bash
   cd server
   npm run start:dev
   ```

3. **Watch for:**
   - ✅ `Nest application successfully started`
   - ❌ Any red error messages
   - ❌ Database connection errors
   - ❌ Prisma errors

4. **After it starts, immediately test:**
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:3000/health"
   Invoke-RestMethod -Uri "http://localhost:3000/stores"
   ```

---

## Most Likely Issues:

1. **Database not connected** → Routes don't register
2. **Backend not fully started** → Wait for "successfully started"
3. **Module initialization error** → Check backend terminal
4. **Wrong backend still running** → Kill all Node processes

---

## Share This Info:

1. **Backend terminal output** (full startup log)
2. **Result of health endpoint** (does it say PriceLens?)
3. **Result of Swagger test** (does it show /stores?)
4. **Any error messages**

This will help identify the exact issue.
