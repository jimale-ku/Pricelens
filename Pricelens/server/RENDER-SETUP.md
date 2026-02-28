# Deploying the backend to Render

**Why it worked yesterday but not on Render:** Yesterday your app was running on your MacBook and the server used a database on the same machine (`localhost:5432`). On Render, the server runs on Render’s servers—they cannot reach “localhost” on your laptop. So Render needs a database that lives on the internet (e.g. a PostgreSQL instance on Render). Render does **not** use your repo’s `.env`; it only uses environment variables you set in the Render dashboard.

---

## 1. Check if you already have a database on Render

1. Log in at [dashboard.render.com](https://dashboard.render.com).
2. On the **Dashboard**, look at the list of services.
3. Find any service whose **Type** is **PostgreSQL** (name might be something like `pricelens-db` or `postgres-xxxx`).

- **If you see a PostgreSQL service** → go to [2. Get the database URL](#2-get-the-database-url-from-your-render-postgres).
- **If you don’t see any PostgreSQL** → go to [3. Create a new PostgreSQL on Render](#3-create-a-new-postgresql-on-render).

---

## 2. Get the database URL from your Render Postgres

1. In the Render dashboard, click the **PostgreSQL** service (not the web service).
2. In the left sidebar, open **Info** (or the main overview).
3. Find **Connection** (or **Databases**). You’ll see:
   - **Internal Database URL** – use this one for your web service (recommended).
   - External URL – only if you need to connect from outside Render.
4. Click **Copy** next to **Internal Database URL**. It looks like:
   - `postgresql://USER:PASSWORD@dpg-xxxxx-a.oregon-postgres.render.com/DATABASE_NAME`
5. Keep this tab open; you’ll paste this into the web service in step 4.

---

## 3. Create a new PostgreSQL on Render (if you don’t have one)

1. In the Render dashboard, click **New +** → **PostgreSQL**.
2. Set **Name** (e.g. `pricelens-db`), **Region**, and **Plan** (free is fine to start).
3. Click **Create Database**.
4. When it’s ready, open that PostgreSQL service and get the **Internal Database URL** as in section 2 above.

---

## 4. Give the URL to your web service

**Reminder:** Use the **Internal Database URL** only (from priceLens-db → Info → Connections). Do **not** use the External Database URL for `DATABASE_URL`.

- [ ] I saw and copied the **Internal Database URL** from priceLens-db (Connections section).

1. In the Render dashboard, open your **Web Service** (the backend, e.g. pricelens-qvvj).
2. Go to **Environment** (left sidebar).
3. Find **Environment Variables**.
   - If **DATABASE_URL** already exists, click **Edit** and replace its value with the **Internal Database URL** you copied.
   - If it doesn’t exist, click **Add Environment Variable**:
     - **Key:** `DATABASE_URL`
     - **Value:** paste the full Internal Database URL (from step 2 or 3).
   - Alternatively, use **“Add from Render”** and select your PostgreSQL service; Render will add `DATABASE_URL` for you.
4. Click **Save Changes**. Render will redeploy the web service.
5. After deploy, the start command runs `prisma migrate deploy` and `prisma db seed`, so the Render database will be set up. Then categories and search should work.

---

## 5. Required environment variables (or deploy exits with status 1)

The app **validates env on startup**. If any **required** variable is missing or invalid, the process exits with code 1 and you’ll see “Exited with status 1” on Render.

**Required in Render → Environment:**

| Key | Description |
|-----|-------------|
| `DATABASE_URL` | **Internal Database URL** from your Render PostgreSQL (Info → Connections). Must start with `postgresql://`. |
| `JWT_SECRET` | Any long random string (e.g. `openssl rand -base64 32`). |
| `JWT_REFRESH_SECRET` | Another long random string. |

**Optional but recommended:** `SERPER_API_KEY`, `PRICESAPI_KEY`, `BARCODE_LOOKUP_API_KEY`, `CORS_ORIGIN`, `FRONTEND_URL`.

**How to see the real error:** In Render dashboard → your Web Service → **Logs**. Scroll to the end of the deploy; look for a line like `❌ Error starting Nest application:` and the line below it (e.g. missing `DATABASE_URL`, invalid `JWT_SECRET`, or Prisma connection error). That tells you exactly which env var or step failed.

---

## Run backend locally on your MacBook (optional)

- Install PostgreSQL (e.g. `brew install postgresql@15`), start it, create a DB.
- In `server/.env` set `DATABASE_URL` to that local DB (e.g. `postgresql://youruser@localhost:5432/pricelens_db?schema=public`).
- Run `npx prisma migrate deploy` and `npm run start:dev`.
