# Fix Server Connection & SerpAPI Issues

## Issue 1: SerpAPI 401 Error (Invalid API Key)

**Problem:** Backend is trying to use SerpAPI but getting "Invalid API key" errors.

**Solution:** The backend should use **Serper** instead (which you have configured). Let me check which service is being used.

### Quick Fix:
Your `.env` has both keys:
- `SERPAPI_KEY=04cd24be53ae188f1e8d817f1f37ddf08e3e946a` (might be invalid/expired)
- `SERPER_API_KEY=0d2d55e5bfb29860e9989b6e83bf5896789ecb4e` (should work)

**Option A: Disable SerpAPI, use Serper only**
Comment out or remove SERPAPI_KEY from `server/.env`:
```env
# SERPAPI_KEY=04cd24be53ae188f1e8d817f1f37ddf08e3e946a  # Commented out - using Serper instead
SERPER_API_KEY=0d2d55e5bfb29860e9989b6e83bf5896789ecb4e
```

**Option B: Get a new SerpAPI key**
1. Go to https://serpapi.com/manage-api-key
2. Get a new API key
3. Update `server/.env` with the new key

---

## Issue 2: Can't Connect to Server

**Problem:** Frontend can't reach backend at `http://192.168.201.105:3000`

### Check These:

**1. Is backend running?**
```bash
cd server
npm run start:dev
```
Should see: `Nest application successfully started`

**2. Is backend accessible?**
Open browser: `http://localhost:3000/stores`
- If it works → backend is running
- If it doesn't → backend isn't running

**3. Check your IP address**
```bash
ipconfig | findstr IPv4
```
- If IP changed → update `client/.env` with new IP
- Current IP in `.env`: `192.168.201.105`

**4. Same network?**
- Phone and PC must be on **same Wi-Fi**
- If phone on mobile data → won't work

**5. Firewall blocking?**
- Windows Firewall might block port 3000
- Allow Node.js through firewall

**6. Restart Metro after changing .env**
```bash
cd client
npx expo start --clear
```

---

## Quick Test Commands:

### Test Backend (PowerShell):
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/stores"
```

### Test from Phone:
- Make sure phone and PC on same Wi-Fi
- Check IP matches: `ipconfig | findstr IPv4`
- Update `client/.env` if IP changed
- Restart Metro: `npx expo start --clear`

---

## Recommended Fix Order:

1. **Fix SerpAPI issue first:**
   - Comment out `SERPAPI_KEY` in `server/.env`
   - Restart backend: `npm run start:dev`

2. **Then fix connection:**
   - Check backend is running
   - Verify IP address
   - Restart Metro with `--clear`

3. **Test:**
   - Search for a product
   - Should see results (using Serper, not SerpAPI)
