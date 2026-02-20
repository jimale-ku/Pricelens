# 🚨 Fix Backend Routes - Step by Step

## Problem: "Cannot GET /stores" - Route Not Found

The backend is running but `/stores` route isn't registered. This usually means:
1. Database connection failed → StoresService can't initialize
2. Module initialization error → Routes didn't register
3. Backend started but routes didn't load

---

## Step 1: Test Other Endpoints

**Test these to see what works:**

```powershell
# 1. Root (should work)
Invoke-RestMethod -Uri "http://localhost:3000/"

# 2. Health (should work)
Invoke-RestMethod -Uri "http://localhost:3000/health"

# 3. Categories (test if other routes work)
Invoke-RestMethod -Uri "http://localhost:3000/categories"
```

**Results:**
- ✅ Root works → Backend running
- ✅ Health works → Routes registering
- ✅ Categories works → Other modules OK, StoresModule issue
- ❌ Nothing works → Backend not fully started

---

## Step 2: Check Backend Terminal

**Look for these messages:**

✅ **Good signs:**
- `🚀 Nest application successfully started`
- `📚 Swagger documentation available`
- No red error messages

❌ **Bad signs:**
- Red error messages
- Database connection errors
- "Cannot connect to database"
- "PrismaClient" errors
- Module import errors

---

## Step 3: Check Database Connection

**StoresModule depends on Prisma (database). If database isn't connected, routes won't register.**

**Check `server/.env`:**
```
DATABASE_URL="postgresql://postgres:pricelens123@localhost:5432/pricelens_db?schema=public"
```

**Is PostgreSQL running?**
- Check if PostgreSQL service is running
- Database must be running for StoresModule to work

---

## Step 4: Restart Backend and Watch for Errors

**Do this:**

1. **Stop backend** (Ctrl+C)

2. **Start backend and watch for errors:**
   ```bash
   cd server
   npm run start:dev
   ```

3. **Look for:**
   - Database connection errors
   - Prisma errors
   - StoresModule errors
   - Any red error messages

4. **Share the full startup log** - especially any errors

---

## Step 5: Test Database Connection

**If database isn't connected, routes won't work.**

**Check if database is accessible:**
- Is PostgreSQL running?
- Can you connect to database?
- Check `DATABASE_URL` in `.env` is correct

---

## Quick Test Commands:

```powershell
# Test root
Invoke-RestMethod -Uri "http://localhost:3000/"

# Test health  
Invoke-RestMethod -Uri "http://localhost:3000/health"

# Test categories (if this works, other modules are OK)
Invoke-RestMethod -Uri "http://localhost:3000/categories"
```

---

## Most Likely Cause:

**Database connection issue** → StoresModule depends on Prisma → If DB isn't connected, routes don't register.

**Fix:**
1. Make sure PostgreSQL is running
2. Check `DATABASE_URL` in `server/.env` is correct
3. Restart backend
4. Test `/stores` again

---

## If Still Not Working:

**Share:**
1. Backend terminal output (full startup log)
2. Results of testing root/health/categories endpoints
3. Any error messages you see

This will help me identify the exact issue.
