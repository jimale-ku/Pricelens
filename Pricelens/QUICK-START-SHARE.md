# 🚀 Quick Start: Share App with Client (Kenya → USA)

## ⚡ Fastest Way (20 minutes)

### Step 1: Deploy Backend (15 min)

1. **Go to Railway**: https://railway.app
2. **Sign up** with GitHub
3. **New Project** → Connect your `Pricelens_new` repo
4. **Add PostgreSQL** database (Railway dashboard → "+ New" → Database)
5. **Set Environment Variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=your-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret
   CORS_ORIGIN=*
   ```
   (Add your API keys if you have them)
6. **Get your URL**: Settings → Generate Domain
7. **Test**: Open `https://your-url.up.railway.app/stores` in browser

### Step 2: Update Client (2 min)

Create `client/.env` file:
```
EXPO_PUBLIC_API_URL=https://your-url.up.railway.app
```

### Step 3: Share App (3 min)

```bash
cd client
npm start
# Press 's' → type 'tunnel'
# Copy the URL and send to client
```

**Send this to your client:**
```
Hi! Here's how to test the app:

1. Install Expo Go:
   iOS: https://apps.apple.com/app/expo-go/id982107779
   Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. Open this link on your phone: [PASTE EXPO URL HERE]

That's it! The app will load and you can interact with it.
```

---

## 🎯 That's It!

Your client can now:
- ✅ Install Expo Go (free)
- ✅ Open your link
- ✅ Test the app interactively
- ✅ Works from anywhere in the world

---

## 📋 Full Details

See `SHARE-WITH-CLIENT-USA.md` for complete guide with troubleshooting.
