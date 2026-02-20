# 🔍 Diagnose "Aborted" Error - Step by Step

## "Aborted" Error = Request Timed Out

This means the frontend is trying to connect but getting no response within the timeout period.

---

## Quick Diagnosis - Do These in Order:

### 1. Is Backend Actually Running?

**Check backend terminal:**
- ✅ Should see: `🚀 Nest application successfully started`
- ❌ If you see errors → Backend crashed
- ❌ If terminal is empty → Backend not running

**Test backend directly:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

**Results:**
- ✅ Returns JSON → Backend is running
- ❌ Error/timeout → Backend NOT running

**If backend not running:**
```bash
cd server
npm run start:dev
```
Wait for: `🚀 Nest application successfully started`

---

### 2. What URL is Frontend Using?

**Check Metro terminal logs when app starts:**
Look for:
```
🔗 API_BASE_URL: http://192.168.201.105:3000
🔗 From .env: http://192.168.201.105:3000
```

**If you see:**
- ✅ `http://192.168.201.105:3000` → Frontend is correct
- ❌ `https://pricelens-1.onrender.com` → Frontend still using Render

**If still using Render:**
```bash
# Stop Metro (Ctrl+C)
cd client
npx expo start --clear
```
Then reload app and check logs again.

---

### 3. Can Backend Be Reached from Your PC?

**Test from PowerShell:**
```powershell
# Test localhost
Invoke-RestMethod -Uri "http://localhost:3000/health"

# Test with your IP
Invoke-RestMethod -Uri "http://192.168.201.105:3000/health"
```

**Results:**
- ✅ Both work → Backend is fine, issue is network/phone
- ✅ localhost works, IP doesn't → Network/firewall issue
- ❌ Both fail → Backend not running or crashed

---

### 4. Is Phone on Same Wi-Fi?

**Critical:** Phone and PC must be on **same Wi-Fi network**

**Check:**
- Phone Wi-Fi name = PC Wi-Fi name?
- Phone NOT on mobile data?
- Both connected to same router?

**If different networks:** Won't work. Connect phone to same Wi-Fi as PC.

---

### 5. Check Backend Terminal When Searching

**When you search in app, check backend terminal:**

**Should see:**
```
GET /products/search/fast?q=...
```

**If you see nothing:**
- Frontend isn't reaching backend
- Check URL in frontend logs
- Check network connection

**If you see errors:**
- Backend issue → Share error message

---

## Most Common Causes:

### Cause 1: Backend Not Running
**Fix:** Start backend with `npm run start:dev`

### Cause 2: Frontend Still Using Render
**Fix:** Restart Metro with `npx expo start --clear`

### Cause 3: Different Wi-Fi Networks
**Fix:** Connect phone to same Wi-Fi as PC

### Cause 4: Firewall Blocking
**Fix:** Allow Node.js through Windows Firewall

### Cause 5: Wrong IP Address
**Fix:** Check IP with `ipconfig`, update `.env`

---

## Quick Fix Checklist:

- [ ] Backend running? (`npm run start:dev` in server folder)
- [ ] Backend shows "successfully started"?
- [ ] Test `http://localhost:3000/health` works?
- [ ] Metro restarted with `--clear`?
- [ ] Frontend logs show local IP (not Render)?
- [ ] Phone on same Wi-Fi as PC?
- [ ] IP address correct? (`ipconfig | findstr IPv4`)

---

## Share This Info:

1. **Backend terminal:** Is it running? Any errors?
2. **Metro logs:** What does `🔗 API_BASE_URL:` show?
3. **Test result:** Does `http://localhost:3000/health` work?
4. **Network:** Phone and PC on same Wi-Fi?

This will help identify the exact issue.
