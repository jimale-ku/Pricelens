# Railway Deployment Guide (Step-by-Step)

## 🚂 Deploy Your Backend to Railway in 10 Minutes

### Prerequisites
- GitHub account (you already have this ✅)
- Railway account (free at railway.app)

---

## Step 1: Sign Up for Railway

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign up with GitHub (easiest way)

---

## Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your GitHub
4. Select your repository: `Pricelens_new`
5. Click **"Deploy Now"**

Railway will automatically detect your project structure.

---

## Step 3: Configure the Backend Service

Railway might create multiple services. You need to configure the backend:

1. Click on your **backend service** (or create one if needed)
2. Go to **"Settings"** tab
3. Set these:

   **Root Directory**: `server`
   
   **Build Command**: 
   ```bash
   npm install && npm run build && npx prisma generate
   ```
   
   **Start Command**:
   ```bash
   npm run start:prod
   ```

4. Click **"Save"**

---

## Step 4: Add PostgreSQL Database

1. In Railway dashboard, click **"+ New"** button
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically:
   - Create a PostgreSQL database
   - Set `DATABASE_URL` environment variable
   - Link it to your backend service

**Note**: The `DATABASE_URL` is automatically set - don't add it manually!

---

## Step 5: Set Environment Variables

1. Go to your backend service → **"Variables"** tab
2. Click **"+ New Variable"**
3. Add these one by one:

   ```
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=your-super-secret-refresh-token-key
   JWT_REFRESH_EXPIRES_IN=30d
   CORS_ORIGIN=*
   ```

4. **Add your API keys** (if you have them):
   - `SERPAPI_KEY` (if you have SerpAPI)
   - `SERPER_API_KEY` (if you have Serper.dev)
   - `GOOGLE_CLIENT_ID` (if using Google OAuth)
   - `GOOGLE_CLIENT_SECRET`
   - Any other API keys from your `.env` file

5. **Important**: 
   - Don't add `DATABASE_URL` - Railway sets it automatically
   - Don't add `PORT` if Railway sets it automatically
   - Use `*` for `CORS_ORIGIN` to allow all origins (or specific Expo URLs)

---

## Step 6: Run Database Migrations

After first deployment:

1. Go to your backend service → **"Deployments"** tab
2. Click on the latest deployment
3. Click **"View Logs"**
4. Click **"Shell"** button (opens terminal)
5. Run:
   ```bash
   npx prisma migrate deploy
   ```
6. This sets up your database tables

**Alternative**: Add to build command:
```bash
npm install && npm run build && npx prisma generate && npx prisma migrate deploy
```

---

## Step 7: Get Your Backend URL

1. Go to your backend service → **"Settings"** tab
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"**
4. Copy the URL (e.g., `https://pricelens-production.up.railway.app`)

**This is your backend URL!** 🎉

---

## Step 8: Test Your Backend

Open in browser:
```
https://your-url.up.railway.app/stores
```

You should see JSON data. If you see an error, check the deployment logs.

---

## Step 9: Update Your Client App

Update `client/constants/api.ts`:

```typescript
const DEFAULT_API_BASE_URL = 'https://your-url.up.railway.app';
```

Commit and push:
```bash
git add client/constants/api.ts
git commit -m "Update API URL for Railway deployment"
git push
```

---

## Step 10: Share App with Client

Now use Expo Go tunnel mode:

```bash
cd client
npm start
# Press 's' → select 'tunnel'
# Share the URL with your client
```

---

## 🔍 Troubleshooting

### Backend won't start
- Check **Deploy Logs** in Railway
- Verify all environment variables are set
- Make sure `DATABASE_URL` is set (Railway does this automatically)

### Database connection errors
- Run migrations: `npx prisma migrate deploy` in Railway shell
- Check `DATABASE_URL` is correct
- Verify PostgreSQL service is running

### CORS errors
- Set `CORS_ORIGIN=*` in environment variables
- Or set specific origins: `CORS_ORIGIN=https://expo.dev,exp://...`

### 502 Bad Gateway
- Check deployment logs
- Verify start command is correct: `npm run start:prod`
- Make sure port is set correctly (Railway sets `PORT` automatically)

---

## 💰 Railway Free Tier Limits

- **$5 free credit** per month
- **500 hours** of usage
- **Sleeps after inactivity** (wakes up on first request)
- **Perfect for development/testing**

For production, consider upgrading or using Render's free tier.

---

## 🎯 Next Steps

1. ✅ Backend deployed
2. ✅ Client updated
3. ✅ Share with client via Expo Go
4. Later: Use EAS Build for production builds
5. Later: Publish to app stores

---

## 📚 Resources

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Your deployment URL: Check Railway dashboard
