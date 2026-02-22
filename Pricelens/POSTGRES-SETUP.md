# PostgreSQL setup for PriceLens

Run these in **Cursor’s terminal** (or Terminal.app) in order.

---

## Step 1: Install Homebrew (one-time)

You’ll be asked for your Mac password.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

When it finishes, it will show “Next steps” with two commands like:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Run those two lines so `brew` works in this terminal. Then run:

```bash
brew --version
```

---

## Step 2: Install and set up PostgreSQL

From your project root:

```bash
cd ~/Documents/priceLens_mac/Pricelens
chmod +x setup-postgres.sh
./setup-postgres.sh
```

This installs PostgreSQL, starts it, creates the `pricelens_db` database, and creates `server/.env` if it doesn’t exist.

---

## Step 3: Run Prisma migrations

```bash
cd ~/Documents/priceLens_mac/Pricelens/server
npx prisma generate
npx prisma migrate deploy
```

Optional (seed data):

```bash
npx prisma db seed
```

---

## Step 4: Check PostgreSQL

```bash
psql -l
```

You should see `pricelens_db` in the list.

---

## If `psql` or `createdb` not found

Add PostgreSQL to your PATH. For Apple Silicon (M1/M2):

```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

For Intel Mac:

```bash
echo 'export PATH="/usr/local/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

---

## Useful commands

| Command | Purpose |
|--------|--------|
| `brew services start postgresql@15` | Start PostgreSQL |
| `brew services stop postgresql@15` | Stop PostgreSQL |
| `brew services list` | See status |
| `psql pricelens_db` | Open DB shell |

Done. You can start the server with `npm run start:dev` from the `server` folder.
