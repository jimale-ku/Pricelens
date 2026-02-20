# Database setup on MacBook Pro (use from both laptops)

Your project uses **PostgreSQL** with **Prisma**. This guide sets up the DB on your MacBook Pro so you can run the server on either laptop and both can use the same database.

---

## 1. Install PostgreSQL on MacBook Pro

**Option A – Homebrew (recommended)**

```bash
# Install Homebrew if you don't have it: https://brew.sh
brew install postgresql@16
brew services start postgresql@16
```

**Option B – Postgres.app (no terminal)**

- Download: https://postgresapp.com  
- Drag to Applications, open it, click “Initialize” to create a server.  
- Add the command-line tools to your PATH (Postgres.app will show instructions).

**Check it’s running**

```bash
psql --version
# Should show something like: psql (PostgreSQL) 16.x
```

---

## 2. Create the database and user (match your Windows setup)

Your current `server/.env` uses:

- User: `postgres`
- Password: `pricelens123`
- Database: `pricelens_db`
- Port: `5432`

On the Mac, create the same database and user.

**If you used Homebrew:**

```bash
# Connect to default postgres (no password first time)
psql postgres

# In the psql prompt, run:
CREATE USER postgres WITH PASSWORD 'pricelens123' SUPERUSER;
CREATE DATABASE pricelens_db OWNER postgres;
\q
```

**If the `postgres` user already exists** (e.g. Postgres.app):

```bash
psql postgres -c "ALTER USER postgres PASSWORD 'pricelens123';"
psql postgres -c "CREATE DATABASE pricelens_db OWNER postgres;"
```

**If you get “role postgres already exists”:**  
Then just set the password and create the DB:

```bash
psql postgres -c "ALTER USER postgres PASSWORD 'pricelens123';"
psql postgres -c "CREATE DATABASE pricelens_db OWNER postgres;"
```

---

## 3. Project setup on the MacBook

1. Clone/copy the repo to the MacBook (same repo as on Windows).
2. In the project root:

```bash
cd server
cp .env.example .env
```

3. Edit `server/.env` and set:

```env
DATABASE_URL="postgresql://postgres:pricelens123@localhost:5432/pricelens_db?schema=public"
```

4. Install deps and run migrations + seed:

```bash
cd server
npm install
npx prisma migrate deploy
npx prisma db seed
```

5. Generate Prisma client (if you run the server locally on Mac):

```bash
npx prisma generate
```

After this, when you run the **server on the MacBook**, it will use the DB on the MacBook (localhost).

---

## 4. Using the same DB from your Windows laptop

So both laptops use **one** database (the one on the MacBook):

- **MacBook:** run PostgreSQL + run the server; `DATABASE_URL` = `localhost` (as above).
- **Windows:** run only the server (and/or client); point `DATABASE_URL` to the MacBook’s IP.

**On the MacBook – allow network connections to PostgreSQL**

1. Find your Mac’s IP on the same Wi‑Fi as the Windows laptop:

```bash
# macOS
ipconfig getifaddr en0
# Or: System Settings → Network → Wi‑Fi → Details → IP (e.g. 192.168.1.105)
```

2. Make PostgreSQL listen on the network and allow your LAN:

**Config location (Homebrew):**

- `pg_hba.conf`: `$(brew --prefix)/var/postgresql@16/pg_hba.conf`
- `postgresql.conf`: `$(brew --prefix)/var/postgresql@16/postgresql.conf`

**Edit `postgresql.conf`:**

```ini
listen_addresses = 'localhost,192.168.1.105'
```

(Replace `192.168.1.105` with your Mac’s actual IP, or use `'*'` to listen on all interfaces.)

**Edit `pg_hba.conf`** – add one line (replace with your Windows machine’s subnet if different):

```
# IPv4 local network (adjust 192.168.1.0/24 to your home/office subnet)
host    pricelens_db    postgres    192.168.1.0/24    scram-sha-256
```

Or allow any IP (only for dev on trusted network):

```
host    pricelens_db    postgres    0.0.0.0/0    scram-sha-256
```

3. Restart PostgreSQL:

```bash
brew services restart postgresql@16
```

**On the Windows laptop**

1. In `server/.env` set the URL to the MacBook’s IP:

```env
DATABASE_URL="postgresql://postgres:pricelens123@192.168.1.105:5432/pricelens_db?schema=public"
```

2. Run the server on Windows as usual. It will use the DB on the MacBook.

**Firewall:** If Windows can’t connect, on the Mac open System Settings → Network → Firewall and allow incoming connections for PostgreSQL (port 5432), or temporarily turn the firewall off to test.

---

## 5. Quick reference

| Where you run the server | DATABASE_URL host |
|--------------------------|--------------------|
| On MacBook               | `localhost`        |
| On Windows (DB on Mac)   | MacBook’s IP, e.g. `192.168.1.105` |

- **One DB on MacBook:** Install Postgres on Mac only, run migrations/seed on Mac once, then either run the server on Mac (localhost) or on Windows (point to Mac’s IP).
- **Same codebase:** Use the same `server/.env` values except the host in `DATABASE_URL` (localhost vs Mac IP) depending on which machine runs the server.

If you want, we can add a small script or two to switch `DATABASE_URL` between “local” and “remote Mac” on the Windows laptop.
