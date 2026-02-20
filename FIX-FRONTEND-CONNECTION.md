# 🔧 Fix Frontend Connection - Step by Step

## Problem: Frontend Still Connecting to Render Instead of Local

Even though `.env` is set to local, Metro might not have read it. Expo only reads `.env` when Metro starts.

---

## Step 1: Check What URL Frontend is Using

**When you open the app, check the logs in Expo Go or Metro terminal:**

Look for these debug logs:
```
🔗 API_BASE_URL: http://192.168.201.105:3000
🔗 From .env: http://192.168.201.105:3000
```

**If you see:**
- ✅ `http://192.168.201.105:3000` → Frontend is correct, issue is backend
- ❌ `https://pricelens-1.onrender.com` → Metro didn't read .env, need to restart

---

## Step 2: Restart Metro with Cache Clear

**Metro MUST be restarted after changing .env:**

```bash
# Stop Metro (Ctrl+C)

# Start Metro with cache clear
cd client
npx expo start --clear
```

**The `--clear` flag is IMPORTANT** - it clears cache so Metro reads `.env` fresh.

---

## Step 3: Reload App in Expo Go

**After Metro restarts:**
1. Shake phone → Reload
2. Or close Expo Go and reopen
3. Check logs for: `🔗 API_BASE_URL: http://192.168.201.105:3000`

---

## Step 4: Verify Backend is Running

**Test backend directly:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

**Should return:** JSON with status (not error)

**If this fails:** Backend isn't running → Start it:
```bash
cd server
npm run start:dev
```

---

## Step 5: Test Connection from Frontend

**After restarting Metro and reloading app:**

1. **Check Metro logs** - Should see:
   ```
   🔗 API_BASE_URL: http://192.168.201.105:3000
   ```

2. **Try searching** - Should connect to local backend

3. **Check backend terminal** - Should see requests coming in:
   ```
   GET /products/search/fast?q=...
   ```

---

## Quick Fix (All Steps):

```bash
# 1. Stop Metro (Ctrl+C)

# 2. Restart Metro with cache clear
cd client
npx expo start --clear

# 3. In another terminal, make sure backend is running
cd server
npm run start:dev

# 4. Reload app in Expo Go (shake → Reload)
```

---

## If Still Connecting to Render:

**Check .env file location:**
- Must be in `client/.env` (not root, not server)
- File name must be exactly `.env` (not `.env.local`, not `.env.example`)

**Verify .env content:**
```env
EXPO_PUBLIC_API_URL=http://192.168.201.105:3000
```
- No spaces around `=`
- No quotes around URL
- No comments on same line

**After fixing .env:**
- Restart Metro with `--clear`
- Reload app

---

## Debug: Check What URL is Actually Being Used

**In Metro terminal or Expo Go logs, look for:**
```
🔗 API_BASE_URL: ...
🔗 From .env: ...
```

**This tells you:**
- What URL frontend is using
- Whether .env was read

**Share these logs** if still not working.
