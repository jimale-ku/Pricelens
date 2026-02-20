# 🔍 Identify Which Backend is Running

## The health response format suggests a different backend or middleware.

**Current health response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected"
  }
}
```

**PriceLens should return:**
```json
{
  "status": "ok",
  "service": "PriceLens API",
  "timestamp": "...",
  "uptime": ...
}
```

---

## Test These to Identify Backend:

### 1. Test Root Endpoint:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/"
```

**PriceLens should return:** `"Hello World!"`
**If different:** Wrong backend or middleware

### 2. Test Swagger:
Open in browser: `http://localhost:3000/api`

**Should show:**
- "PriceLens API" title
- List of endpoints
- `/stores` endpoint listed

**If shows different name:** Wrong backend

### 3. Check Backend Terminal:

**Look for:**
- `🚀 Nest application successfully started`
- `📚 Swagger documentation available at http://localhost:3000/api`
- Should say "PriceLens API" somewhere

**If says "OneMind" or different:** Wrong backend

---

## Solution: Complete Restart

**Kill everything and start fresh:**

```powershell
# 1. Kill ALL Node processes
taskkill /IM node.exe /F

# 2. Wait
Start-Sleep -Seconds 3

# 3. Navigate to PriceLens
cd C:\Users\MTC\Documents\Pricelens_new\server

# 4. Start PriceLens backend
npm run start:dev
```

**Watch for:**
- ✅ `🚀 Nest application successfully started`
- ✅ Should NOT say "OneMind"
- ✅ Should say "PriceLens API"

---

## After Restart, Test:

```powershell
# Root
Invoke-RestMethod -Uri "http://localhost:3000/"

# Health (should say PriceLens)
Invoke-RestMethod -Uri "http://localhost:3000/health"

# Stores (should work)
Invoke-RestMethod -Uri "http://localhost:3000/stores"
```

---

## If Still Wrong Backend:

**Check:**
1. Are you in the right directory? (`C:\Users\MTC\Documents\Pricelens_new\server`)
2. Are there multiple backend folders?
3. Is there a different terminal running OneMind backend?

**Share:**
- Result of root endpoint test
- What Swagger shows
- Backend terminal output
