# Quick Fix: Render Connection Issue

## 🚨 Problem: App Not Reaching Render Server

### Quick Checks:

1. **Is Render service running?**
   - Go to: https://dashboard.render.com
   - Check if service shows "Live" (green)
   - If "Sleeping" → Click "Manual Deploy" → "Clear build cache & deploy"

2. **Test Render URL directly:**
   - Open browser: `https://pricelens-1.onrender.com/stores`
   - Should return JSON
   - If timeout → Render is sleeping

3. **Check CORS in Render:**
   - Render dashboard → Environment → Add:
   - `CORS_ORIGIN=*` (or specific origins)

4. **Wake up Render:**
   - Free tier sleeps after 15 min inactivity
   - First request takes 30-60 seconds to wake
   - Subsequent requests are fast

### Quick Fix:

**Option 1: Wake Render**
- Visit: `https://pricelens-1.onrender.com/stores` in browser
- Wait 30-60 seconds
- Try app again

**Option 2: Check API URL**
- Verify `client/constants/api.ts` has:
  ```typescript
  const DEFAULT_API_BASE_URL = 'https://pricelens-1.onrender.com';
  ```

**Option 3: Add CORS**
- Render dashboard → Environment
- Add: `CORS_ORIGIN=*`
- Redeploy

### Most Likely Issue:
**Render is sleeping** (free tier) - first request wakes it up (30-60 sec delay)
