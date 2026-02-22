# Share Your App with Client in USA (From Kenya) 🇰🇪 → 🇺🇸

## 🎯 The Problem
- You're in Kenya, client is in USA
- Screen recordings don't let them interact
- They need to test the actual app

## ✅ The Solution: 3 Steps

### Step 1: Deploy Backend to Cloud (FREE) ⚡

Your backend needs to be accessible from anywhere. Use **Railway** (easiest) or **Render**.

#### Option A: Railway (Recommended - Easiest)

1. **Sign up**: Go to [railway.app](https://railway.app) (free tier available)

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select your `Pricelens_new` repository
   - Railway will detect it's a Node.js project

3. **Configure Backend**:
   - Railway will auto-detect the `server` folder
   - If not, set **Root Directory** to `server`
   - Set **Start Command** to: `npm run start:prod`
   - Set **Build Command** to: `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`

4. **Add PostgreSQL Database**:
   - In Railway dashboard, click "+ New"
   - Select "Database" → "PostgreSQL"
   - Railway will create a database and set `DATABASE_URL` automatically

5. **Set Environment Variables**:
   - Go to your service → "Variables" tab
   - Add these (copy from your `.env` file):
     ```
     NODE_ENV=production
     PORT=3000
     JWT_SECRET=your-secret-key-here
     JWT_EXPIRES_IN=7d
     JWT_REFRESH_SECRET=your-refresh-secret
     JWT_REFRESH_EXPIRES_IN=30d
     CORS_ORIGIN=*
     ```
   - Add your API keys (SERPAPI, SERPER, etc.) if you have them
   - **Important**: Railway sets `DATABASE_URL` automatically, don't override it

6. **Deploy**:
   - Railway will automatically deploy
   - Once deployed, click on your service → "Settings" → "Generate Domain"
   - Copy the URL (e.g., `https://your-app.up.railway.app`)

7. **Run Database Migrations**:
   - In Railway, go to your service → "Deployments" → Click on latest deployment
   - Open "Deploy Logs" → Click "Shell"
   - Run: `npx prisma migrate deploy`
   - (Or add this to your build command)

#### Option B: Render (Alternative)

1. Go to [render.com](https://render.com)
2. Create "New Web Service"
3. Connect GitHub repo
4. Set:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build && npx prisma generate`
   - **Start Command**: `npm run start:prod`
5. Add PostgreSQL database (free tier)
6. Add environment variables
7. Deploy

---

### Step 2: Update Client to Use Deployed Backend 🔗

Once backend is deployed, update your client:

1. **Update API URL** in `client/constants/api.ts`:
   ```typescript
   // Replace this line:
   const DEFAULT_API_BASE_URL = 'http://192.168.201.105:3000';
   
   // With your Railway/Render URL:
   const DEFAULT_API_BASE_URL = 'https://your-app.up.railway.app';
   ```

2. **Commit and push to GitHub**:
   ```bash
   git add client/constants/api.ts
   git commit -m "Update API URL for production"
   git push
   ```

---

### Step 3: Share App with Client 📱

Now you have **2 options**:

#### Option A: Expo Go (Quickest - 5 minutes)

1. **Start Expo in Tunnel Mode**:
   ```bash
   cd client
   npm start
   ```
   - Press `s` → select `tunnel` (or type `tunnel`)
   - This creates a URL that works from anywhere in the world

2. **Share the Link**:
   - Copy the URL shown (looks like `exp://...`)
   - Or share the QR code
   - Send via WhatsApp/Email to your client

3. **Client Instructions** (send this to them):
   ```
   Hi! Here's how to test the app:
   
   1. Install Expo Go app:
      - iOS: https://apps.apple.com/app/expo-go/id982107779
      - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
   
   2. Open this link on your phone: [PASTE YOUR EXPO URL HERE]
   
   3. The app will load in Expo Go - you can interact with it!
   ```

**Pros**: Instant, no build needed  
**Cons**: Client needs Expo Go app

---

#### Option B: EAS Build Preview (More Professional - 15 minutes)

Creates an installable app - no Expo Go needed!

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login**:
   ```bash
   eas login
   ```
   (Create free Expo account if needed)

3. **Build Preview**:
   ```bash
   cd client
   
   # For Android (creates APK)
   eas build --platform android --profile preview
   
   # For iOS (creates TestFlight build)
   eas build --platform ios --profile preview
   ```

4. **Share the Link**:
   - EAS will give you a shareable URL
   - Send this to your client
   - They can install directly on their phone!

**Pros**: Professional, no Expo Go needed, works like real app  
**Cons**: Takes 10-15 minutes to build

---

## 🚀 Quick Start (Fastest Path)

**Right now, do this:**

1. **Deploy backend to Railway** (15 minutes):
   - Sign up at railway.app
   - Connect GitHub
   - Add PostgreSQL
   - Set env variables
   - Get your URL

2. **Update API URL** in `client/constants/api.ts`

3. **Share via Expo Go**:
   ```bash
   cd client
   npm start
   # Press 's' → 'tunnel'
   # Share the URL
   ```

**Total time: ~20 minutes** ⚡

---

## 📋 Checklist

Before sharing:
- [ ] Backend deployed and accessible (test URL in browser)
- [ ] API URL updated in `client/constants/api.ts`
- [ ] Database migrations run
- [ ] Test the deployed backend: `https://your-url.com/stores` should return JSON
- [ ] Expo app starts successfully
- [ ] Tunnel mode works (test on your own phone first)

---

## 🆘 Troubleshooting

**"Backend not accessible"**
- Check Railway/Render logs
- Verify environment variables are set
- Test URL in browser: `https://your-url.com/stores`

**"Client can't connect"**
- Make sure you're using **tunnel mode** (not LAN)
- Verify backend URL is correct in `constants/api.ts`
- Check CORS settings on backend (should allow `*` or your Expo URL)

**"Database errors"**
- Run migrations: `npx prisma migrate deploy`
- Check `DATABASE_URL` is set correctly
- Verify database is running in Railway/Render

---

## 💡 Pro Tips

1. **Use Railway** - It's the easiest and has a good free tier
2. **Test yourself first** - Before sending to client, test on your phone
3. **Use tunnel mode** - Always use tunnel for cross-country sharing
4. **Keep backend running** - Railway free tier sleeps after inactivity, but wakes up on request
5. **For production later** - Use EAS Build Preview or full app store publishing

---

## 🎯 Next Steps After Client Testing

Once client approves:
1. Use **EAS Build** for production builds
2. Submit to **App Store** and **Google Play**
3. Set up **EAS Update** for over-the-air updates

---

## 📞 Need Help?

If you get stuck:
- Railway docs: https://docs.railway.app
- Expo docs: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
