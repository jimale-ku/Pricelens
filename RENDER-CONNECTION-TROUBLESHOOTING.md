# Render Connection Troubleshooting

## 🔍 Quick Checks

### 1. Is Render Service Running?

**Check Render Dashboard:**
1. Go to: https://dashboard.render.com
2. Find your service: `pricelens-1`
3. Check status:
   - ✅ **Live** = Running
   - ⚠️ **Sleeping** = Needs to wake up (free tier sleeps after inactivity)
   - ❌ **Failed** = Not running

**If Sleeping:**
- Free tier services sleep after 15 minutes of inactivity
- First request takes 30-60 seconds to wake up
- This is normal for free tier

**If Failed:**
- Check logs in Render dashboard
- May need to restart service

---

### 2. Test Render URL Directly

**Open in browser:**
```
https://pricelens-1.onrender.com/stores
```

**Expected:** JSON response with stores

**If error:**
- ❌ 404 = Service not found
- ❌ 502 = Service sleeping or crashed
- ❌ Timeout = Service not responding

---

### 3. Check CORS Configuration

**Current CORS setting:**
- Allows all origins (`*`) if `CORS_ORIGIN` not set
- Should work for mobile apps

**If needed, set in Render:**
- Environment Variable: `CORS_ORIGIN`
- Value: `*` (or specific origins)

---

## 🚨 Common Issues & Fixes

### Issue 1: Service is Sleeping (Free Tier)

**Symptoms:**
- First request takes 30-60 seconds
- Subsequent requests work fast
- App shows timeout/error

**Fix:**
- ✅ This is normal for free tier
- ✅ First request wakes up service
- ✅ Consider upgrading to paid plan ($7/month) for always-on

**Temporary Fix:**
- Send a test request to wake it up
- Or upgrade to paid plan

---

### Issue 2: Service Crashed

**Symptoms:**
- 502 Bad Gateway
- Service shows "Failed" in dashboard

**Fix:**
1. Check Render logs
2. Look for error messages
3. Restart service in dashboard
4. Fix any code errors

---

### Issue 3: Wrong URL

**Check:**
- Current URL: `https://pricelens-1.onrender.com`
- Make sure no trailing slash
- Make sure HTTPS (not HTTP)

**Verify in code:**
```typescript
// client/constants/api.ts
const DEFAULT_API_BASE_URL = 'https://pricelens-1.onrender.com';
```

---

### Issue 4: Network/Firewall Issues

**Symptoms:**
- Works on some networks, not others
- Client in USA can't connect

**Fix:**
- ✅ Render is accessible globally
- ✅ Check client's network/firewall
- ✅ Try different network (WiFi vs mobile data)

---

## 🔧 Quick Fixes

### Fix 1: Wake Up Service

**Send test request:**
```bash
curl https://pricelens-1.onrender.com/stores
```

**Or open in browser:**
```
https://pricelens-1.onrender.com/stores
```

**Wait 30-60 seconds** for first response (if sleeping)

---

### Fix 2: Check Render Logs

1. Go to Render dashboard
2. Click on your service
3. Click "Logs" tab
4. Look for errors

**Common errors:**
- Database connection issues
- Environment variables missing
- Port binding issues

---

### Fix 3: Restart Service

1. Go to Render dashboard
2. Click on your service
3. Click "Manual Deploy" → "Clear build cache & deploy"
4. Wait for deployment

---

### Fix 4: Verify Environment Variables

**Check in Render dashboard:**
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Auth secret
- `SERPER_API_KEY` - API key
- `CORS_ORIGIN` - CORS settings (optional)

**Missing variables = Service crashes**

---

## 📱 Mobile App Specific Issues

### Issue: App Can't Reach Render

**Check:**
1. ✅ API URL is correct: `https://pricelens-1.onrender.com`
2. ✅ No trailing space in URL
3. ✅ Using HTTPS (not HTTP)
4. ✅ Service is running in Render

**Test:**
- Open URL in browser on same device
- If browser works, app should work
- If browser fails, Render issue

---

### Issue: CORS Errors

**Symptoms:**
- Network request failed
- CORS error in logs

**Fix:**
- CORS is set to `*` (allows all)
- Should work for mobile apps
- If still issues, check Render logs

---

## 🎯 Step-by-Step Troubleshooting

### Step 1: Check Render Status

1. Go to: https://dashboard.render.com
2. Find service: `pricelens-1`
3. Check status:
   - ✅ Live = Good
   - ⚠️ Sleeping = Normal (wakes on request)
   - ❌ Failed = Problem

---

### Step 2: Test URL

**Open in browser:**
```
https://pricelens-1.onrender.com/stores
```

**Expected:** JSON response

**If error:**
- Note the error code
- Check Render logs
- See fixes above

---

### Step 3: Check App Configuration

**Verify API URL:**
```typescript
// client/constants/api.ts
const DEFAULT_API_BASE_URL = 'https://pricelens-1.onrender.com';
```

**Make sure:**
- ✅ No trailing space
- ✅ HTTPS (not HTTP)
- ✅ Correct domain

---

### Step 4: Check Render Logs

1. Render dashboard → Your service → Logs
2. Look for:
   - ✅ "Nest application successfully started"
   - ❌ Error messages
   - ❌ Database connection errors

---

### Step 5: Restart if Needed

**If service is crashed:**
1. Render dashboard → Your service
2. Manual Deploy → Clear cache & deploy
3. Wait 5-10 minutes
4. Test again

---

## 💡 Pro Tips

1. **Free Tier Sleeps:**
   - First request takes 30-60 seconds
   - This is normal!
   - Upgrade to paid for always-on

2. **Check Logs First:**
   - Render logs show exact errors
   - Most issues visible there

3. **Test in Browser:**
   - If browser works, app should work
   - If browser fails, Render issue

4. **Upgrade if Needed:**
   - Paid plan ($7/month) = Always on
   - No sleep delays
   - Better for production

---

## ✅ Quick Checklist

- [ ] Render service is "Live" (not Failed)
- [ ] URL works in browser: `https://pricelens-1.onrender.com/stores`
- [ ] API URL in app is correct: `https://pricelens-1.onrender.com`
- [ ] No trailing space in URL
- [ ] Using HTTPS (not HTTP)
- [ ] Environment variables set in Render
- [ ] Service logs show no errors

---

## 🚀 If Still Not Working

**Check:**
1. Render dashboard status
2. Render logs for errors
3. Test URL in browser
4. Verify API URL in app code
5. Check client's network connection

**Common solution:**
- Service is sleeping (free tier)
- First request wakes it up (30-60 seconds)
- Consider upgrading to paid plan
