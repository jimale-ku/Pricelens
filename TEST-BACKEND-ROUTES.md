# Test Backend Routes

## The Route Should Be: `/stores` (not `/api/stores`)

The error "Cannot GET /stores" means backend is running but route isn't found.

---

## Test These URLs:

### 1. Test Root:
```
http://localhost:3000/
```

### 2. Test Stores (should work):
```
http://localhost:3000/stores
```

### 3. Test API Docs:
```
http://localhost:3000/api
```

### 4. Test Health/Status:
```
http://localhost:3000/health
```

---

## Check Backend Terminal:

**When backend starts, you should see:**
```
🚀 Nest application successfully started on 0.0.0.0:3000
📚 Swagger documentation available at http://localhost:3000/api
🌐 API accessible at http://192.168.201.105:3000
```

**If you see errors before this:**
- Routes might not be registered
- Module import issue
- Database connection issue

---

## If Route Still Not Found:

**Check backend terminal for:**
- Any error messages during startup
- Database connection errors
- Module import errors

**Try restarting backend:**
```bash
# Stop backend (Ctrl+C)
cd server
npm run start:dev
```

**Watch for:**
- ✅ `Nest application successfully started`
- ❌ Any red error messages

---

## Alternative: Check if Backend is Actually Running

**Test with curl (if available):**
```bash
curl http://localhost:3000/
```

**Or test in browser:**
- Open: `http://localhost:3000/api`
- Should show Swagger API documentation

If Swagger works but `/stores` doesn't → Route registration issue
If nothing works → Backend not running properly
