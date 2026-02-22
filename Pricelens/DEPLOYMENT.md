# Deploying to Render and connecting frontend to backend

## 1. Push code to GitHub (so Render can deploy)

From your project root (e.g. `priceLens_mac` or where the repo lives):

```bash
# Add the Pricelens app (if not already tracked)
git add Pricelens/

# Optional: add any other files you need
git add .

# Commit
git commit -m "Add Pricelens app for Render deployment"

# Push to GitHub (Render will use this repo for auto-deploy)
git push -u origin main
```

If your default branch is `master`, use `git push -u origin master` instead.

- **Render**: In the Render dashboard, connect the GitHub repo and set the **Root Directory** to `Pricelens/server` (or wherever your NestJS app lives) so Render runs the server, not the monorepo root.
- Set **Build Command** and **Start Command** per Render’s NestJS guide (e.g. `npm install && npx prisma generate && npm run build` and `npm run start:prod` or your start script).

---

## 2. Backend on Render – environment variables

In the Render service → **Environment** tab, set at least:

| Variable        | Example / purpose |
|----------------|-------------------|
| `DATABASE_URL` | Your Postgres connection string (Render Postgres or external). |
| `CORS_ORIGIN`  | Frontend origins that may call the API, comma-separated. For Expo/React Native: `*` for dev, or your Expo web URL / production app URL when you have it. |
| `FRONTEND_URL` | Used for auth redirects and Stripe success/cancel. Dev: `http://localhost:8081`. Production: your Expo web URL or production app URL. |
| (Others)       | Any other vars your server needs (e.g. Stripe, Serper, etc.) from your current `server/.env`. |

After saving, redeploy so the backend uses these values.

---

## 3. Frontend – connect to the Render backend

The client uses **one env variable** to talk to the backend: `EXPO_PUBLIC_API_URL`.

### 3.1 Point the app at the Render backend

1. **Create or edit** `Pricelens/client/.env` (do not commit this file if it contains secrets; `.env` is usually in `.gitignore`).

2. **Set the Render backend URL** (no trailing slash):

   ```env
   EXPO_PUBLIC_API_URL=https://YOUR-RENDER-SERVICE-NAME.onrender.com
   ```

   Replace `YOUR-RENDER-SERVICE-NAME` with the actual host from your Render service URL.

3. **Restart Expo** and **rebuild** the app:
   - In dev: stop the Expo server and run `npx expo start` again.
   - For a production build (EAS or similar), run a new build so `EXPO_PUBLIC_API_URL` is baked in.

Expo embeds `EXPO_PUBLIC_*` at build time, so any change to this URL requires a new build to take effect.

### 3.2 Checklist – frontend ↔ backend

- [ ] **Backend URL**: `Pricelens/client/.env` has `EXPO_PUBLIC_API_URL=https://...onrender.com` (your real Render URL).
- [ ] **No trailing slash** on `EXPO_PUBLIC_API_URL`.
- [ ] **Backend is live**: Open `https://YOUR-RENDER-SERVICE.onrender.com/health` (or `/api`) in a browser and confirm you get a response.
- [ ] **CORS**: If the app runs in a browser (Expo web), ensure `CORS_ORIGIN` on Render includes that origin, or use `*` for dev.
- [ ] **Auth redirects**: If you use Google (or other) login, set `FRONTEND_URL` on Render to the URL where the app runs after login (e.g. Expo web URL or deep link base).

---

## 4. Optional – production default in code

If you always use the same Render URL in production, you can set a fallback in `Pricelens/client/constants/api.ts` (e.g. when `EXPO_PUBLIC_API_URL` is unset and you detect production). For most setups, using only `.env` is enough.

---

## 5. Quick test

1. Backend: visit `https://YOUR-RENDER-SERVICE.onrender.com/health` or `https://YOUR-RENDER-SERVICE.onrender.com/stores` – you should see JSON.
2. Frontend: ensure `EXPO_PUBLIC_API_URL` is set, rebuild/restart, then open a category or search – products should load from the Render API.

If categories stay empty or you see network errors, double-check the URL in `client/.env`, that the backend is deployed and healthy, and that CORS allows your frontend origin.
