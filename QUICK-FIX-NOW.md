# 🚨 Quick Fix - Do This Now

## Step 1: Fix SerpAPI Error

I've commented out the invalid SerpAPI key in `server/.env`. The backend will now use **Serper** instead.

**Restart your backend:**
```bash
# Stop backend (Ctrl+C)
# Then restart:
cd server
npm run start:dev
```

You should see: `✅ [MultiStore] Serper Shopping enabled` instead of SerpAPI errors.

---

## Step 2: Fix "Can't Connect to Server"

**Check these:**

1. **Backend is running?**
   - Terminal should show: `Nest application successfully started`
   - Test: Open `http://localhost:3000/stores` in browser

2. **IP address correct?**
   ```bash
   ipconfig | findstr IPv4
   ```
   - If IP changed, update `client/.env`:
     ```
     EXPO_PUBLIC_API_URL=http://YOUR_NEW_IP:3000
     ```

3. **Restart Metro:**
   ```bash
   cd client
   npx expo start --clear
   ```

4. **Same Wi-Fi?**
   - Phone and PC must be on same Wi-Fi network
   - Mobile data won't work

---

## After Fixing:

1. Backend restarted → Should see "Serper Shopping enabled"
2. Metro restarted → Should connect to backend
3. Search for product → Should work without SerpAPI errors

---

## If Still Not Working:

**Test backend directly:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/stores"
```

If this works → backend is fine, issue is network/IP
If this fails → backend isn't running properly
