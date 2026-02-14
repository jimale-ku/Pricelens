# Render: Auth + Google Sign-In Setup

Your backend on Render needs the right **environment variables** for **registration/login** and **Google Sign-In** to work. If these are missing or wrong, sign up and “Sign in with Google” will fail.

---

## 1. Required for **registration and login** (email/password)

In **Render Dashboard** → your **Web Service** → **Environment** tab, add:

| Key | Value | Notes |
|-----|--------|--------|
| `DATABASE_URL` | `postgresql://...` | Your Render PostgreSQL (or external) connection string. **Required** – without it, register/login will fail with DB errors. |
| `JWT_SECRET` | A long random string | e.g. `openssl rand -base64 32`. Used to sign access tokens. |
| `JWT_REFRESH_SECRET` | Another long random string | e.g. `openssl rand -base64 32`. Used to sign refresh tokens. |

Optional (defaults are fine if not set):

- `JWT_EXPIRES_IN` = `7d`
- `JWT_REFRESH_EXPIRES_IN` = `30d`

**If register/sign up fails:**

- **Database:** Confirm `DATABASE_URL` is set and that Render has run **migrations** (e.g. in Build Command: `npx prisma generate && npx prisma migrate deploy` before `npm run build`, or run migrations in a one-off job).
- **Network:** From the app, requests go to `https://pricelens-1.onrender.com` (or your Render URL). Ensure the app’s API base URL is that URL (see client `constants/api.ts` or `EXPO_PUBLIC_API_URL`).
- **CORS:** Backend allows `*` or your frontend origin; normally no extra CORS env is needed unless you restrict `CORS_ORIGIN`.

---

## 2. Required for **Google Sign-In**

Without these on Render, “Sign in with Google” will not work (redirect or 500). Add them in **Render** → **Environment**:

| Key | Value |
|-----|--------|
| `GOOGLE_CLIENT_ID` | Your Google OAuth 2.0 Client ID (e.g. `xxxxx.apps.googleusercontent.com`) |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth 2.0 Client Secret |
| `GOOGLE_CALLBACK_URL` | **Your Render backend URL** + `/auth/google/callback` |

**Important:** `GOOGLE_CALLBACK_URL` must be the **backend** URL on Render, not the app deep link. Example:

- If your Render service URL is `https://pricelens-1.onrender.com`, set:
  - **GOOGLE_CALLBACK_URL** = `https://pricelens-1.onrender.com/auth/google/callback`

Use **HTTPS** and the exact URL Render gives you (no trailing slash).

---

## 3. Google Cloud Console: Authorized redirect URI

Google only allows redirects to URIs you configure.

1. Open [Google Cloud Console](https://console.cloud.google.com/) → your project.
2. Go to **APIs & Services** → **Credentials**.
3. Open your **OAuth 2.0 Client ID** (Web client or the one you use for the backend).
4. Under **Authorized redirect URIs** add:
   - **Production:** `https://pricelens-1.onrender.com/auth/google/callback`  
     (replace with your real Render URL if different.)
   - **Local:** `http://localhost:3000/auth/google/callback` (for local testing).
5. Save.

If this URI is missing or wrong, Google will show “redirect_uri_mismatch” and sign-in will fail.

---

## 4. Optional: Frontend redirect (web)

If you use a web frontend URL after Google sign-in, set on Render:

- `FRONTEND_URL` = your web app URL (e.g. `https://yourapp.com` or Expo web URL).

---

## 5. Checklist

- [ ] **Render** → Environment: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` set.
- [ ] **Render** → Migrations: Prisma migrations run (e.g. in build or a release command).
- [ ] **Render** → Environment: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` set for Google Sign-In.
- [ ] **Google Cloud Console** → Credentials → Your OAuth client → **Authorized redirect URIs** includes `https://YOUR-RENDER-URL.onrender.com/auth/google/callback`.
- [ ] **App** → Uses Render URL as API base (e.g. `EXPO_PUBLIC_API_URL` or default in `client/constants/api.ts`).

After changing env vars on Render, **redeploy** the service so they take effect.

---

## 6. Quick test

- **Register:** From the app, try sign up with email + password (6+ chars). If you see “Registration Failed” with a message, that message is from the backend (e.g. “Email already in use”, validation error, or DB error).
- **Google:** In the app tap “Sign in with Google”. It opens your Render URL (`/auth/google`). If Google env vars are missing on Render, you may get a blank page or 500; add the three Google variables and the redirect URI in Google Console, then try again.
