# Client Demo Checklist – Render + Metro

## ✅ Workflow (What You Said – Correct)

1. **Push code to GitHub** (your internet repo)
2. **Render deploys** (auto-deploys on push, or trigger Manual Deploy in Render dashboard)
3. **Start Metro** (client only): `cd client` → `npm run start:tunnel` (or `npx expo start`)
4. **Share URL/QR** with client (Expo tunnel URL or QR code)
5. **Client opens app** → app talks to **Render** (backend on the internet)

Your laptop only runs Metro (the app bundle). The server runs on Render.

---

## ✅ What Will Work

- **Backend:** Render (live URL) – no need to run server on your PC
- **Items with images:** Yes, after you deploy the latest code (image normalization fix is in the server)
- **API:** App uses `https://pricelens-1.onrender.com` – everything goes to Render

---

## ⚠️ One Caveat: Render Free Tier Can Still Be Slow

**Render free tier sleeps** after ~15 minutes with no traffic.

- **First request** after sleep can take **30–60 seconds** (cold start).
- So the server **can** still feel slow if no one has hit it for a while.

**To avoid that during the demo:**

**Option A – Right before the call (quick):**  
Open in your browser:  
`https://pricelens-1.onrender.com/stores`  
Wait for it to load (30–60 sec), then start the demo. Server stays awake for a while.

**Option B – Always (free):**  
Use **UptimeRobot**: monitor `https://pricelens-1.onrender.com/stores` every 5 minutes.  
Then Render hardly ever sleeps and responses stay fast.

---

## 📋 Step-by-Step (Do This Now)

### 1. Push to GitHub

```bash
cd c:\Users\MTC\Documents\Pricelens_new
git add .
git status
git commit -m "Image fix + normalization for products"
git push origin main
```

(Use your real branch if it’s not `main`.)

### 2. Deploy on Render

- Go to https://dashboard.render.com
- Open your **pricelens** (or backend) service
- If **Auto-Deploy** is on: deploy will start when you push. Wait until it shows **Live**.
- If not: click **Manual Deploy** → **Deploy latest commit**

### 3. (Optional) Wake Render Before Demo

- Open: `https://pricelens-1.onrender.com/stores`
- Wait until the page loads (JSON response)

### 4. Start Metro and Share with Client

```bash
cd client
npm run start:tunnel
```

- Share the **tunnel URL** or **QR code** with the client.
- Client opens in **Expo Go** (or the link in the browser on phone).

### 5. Confirm API URL in App

- In `client/constants/api.ts`, `DEFAULT_API_BASE_URL` should be:
  `https://pricelens-1.onrender.com`
- No need to change if it’s already that.

---

## ✅ Summary

| Step | Action |
|------|--------|
| 1 | Push code to GitHub |
| 2 | Let Render deploy (or Manual Deploy) |
| 3 | (Optional) Wake Render before demo: open `/stores` in browser |
| 4 | Start Metro: `npm run start:tunnel` |
| 5 | Share Expo URL/QR with client |

**Result:**

- Server on Render (not slow if you woke it or use UptimeRobot).
- Items have images (after deploy with the image fix).
- Client uses the app; everything goes to Render as intended.

The only “but” is: on **free** Render, if you don’t wake it or use UptimeRobot, the **first** load after a long idle can still be slow. Everything else will work the way it’s supposed to.
