# 🔧 Troubleshoot Backend Connection - Step by Step

## Current Issue: AbortError (Request Timing Out)

This means the frontend is trying to connect but the backend isn't responding.

---

## Step 1: Verify Backend is Running

**Check backend terminal:**
- Should see: `Nest application successfully started`
- Should see: `Listening on 0.0.0.0:3000` or `Listening on port 3000`

**If backend isn't running:**
```bash
cd server
npm run start:dev
```

**Wait for:** `Nest application successfully started`

---

## Step 2: Test Backend from Your PC

**Open browser on your PC:**
```
http://localhost:3000/stores
```

**Expected result:**
- ✅ Should show JSON data (list of stores)
- ❌ If it doesn't load → Backend isn't running or crashed

**If browser shows error:**
- Backend crashed → Check backend terminal for errors
- Port 3000 in use → Kill other processes using port 3000

---

## Step 3: Check Your IP Address

**Get your current IP:**
```bash
ipconfig | findstr IPv4
```

**Check what's in `client/.env`:**
```
EXPO_PUBLIC_API_URL=http://192.168.201.105:3000
```

**If IPs don't match:**
- Update `client/.env` with your current IP
- Restart Metro: `npx expo start --clear`

---

## Step 4: Test Backend from PowerShell

**Test if backend responds:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/stores"
```

**Expected:**
- ✅ Returns JSON data
- ❌ Error → Backend not running

**Test with your IP:**
```powershell
Invoke-RestMethod -Uri "http://192.168.201.105:3000/stores"
```

**Expected:**
- ✅ Returns JSON data
- ❌ Error → Network/firewall issue

---

## Step 5: Check Network Connection

**Phone and PC must be on same Wi-Fi:**
- ✅ Same Wi-Fi network → Should work
- ❌ Phone on mobile data → Won't work (can't reach 192.168.x.x)
- ❌ Different Wi-Fi networks → Won't work

**Check firewall:**
- Windows Firewall might block port 3000
- Allow Node.js through firewall

---

## Step 6: Restart Everything

**Complete restart:**

1. **Stop backend** (Ctrl+C in backend terminal)

2. **Start backend:**
   ```bash
   cd server
   npm run start:dev
   ```
   Wait for: `Nest application successfully started`

3. **Stop Metro** (Ctrl+C in Metro terminal)

4. **Start Metro with cache clear:**
   ```bash
   cd client
   npx expo start --clear
   ```

5. **Reload app** in Expo Go (shake phone → Reload)

---

## Step 7: Check Backend Logs

**When you search, check backend terminal:**
- Should see: `GET /products/search/fast?q=...`
- If you see nothing → Frontend isn't reaching backend
- If you see errors → Backend issue

---

## Common Issues:

### Issue: "Connection refused"
- **Cause:** Backend not running
- **Fix:** Start backend with `npm run start:dev`

### Issue: "Network request failed"
- **Cause:** Wrong IP or different network
- **Fix:** Check IP, ensure same Wi-Fi

### Issue: "Timeout" / "Aborted"
- **Cause:** Backend running but slow/not responding
- **Fix:** Check backend logs for errors, restart backend

### Issue: Backend crashes on startup
- **Cause:** Database not running, missing env vars, port in use
- **Fix:** Check backend terminal for error messages

---

## Quick Diagnostic:

Run these commands and share results:

```bash
# 1. Check backend running
curl http://localhost:3000/stores

# 2. Check your IP
ipconfig | findstr IPv4

# 3. Check if port 3000 is listening
netstat -an | findstr :3000
```

---

## If Still Not Working:

1. **Try using `localhost` instead of IP** (only works on emulator):
   ```
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

2. **Check backend is listening on all interfaces:**
   - Should see: `Listening on 0.0.0.0:3000`
   - Not just: `Listening on 127.0.0.1:3000`

3. **Try different port** (if 3000 is blocked):
   - Change backend port in `server/.env`: `PORT=3001`
   - Update `client/.env`: `EXPO_PUBLIC_API_URL=http://192.168.201.105:3001`
