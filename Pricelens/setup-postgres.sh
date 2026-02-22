#!/bin/bash
# PriceLens PostgreSQL setup - run this AFTER Homebrew is installed
set -e

echo "==> Installing PostgreSQL 15..."
brew install postgresql@15

echo "==> Linking PostgreSQL..."
brew link postgresql@15 --force 2>/dev/null || true

echo "==> Starting PostgreSQL service..."
brew services start postgresql@15

echo "==> Waiting for PostgreSQL to be ready..."
sleep 3

echo "==> Creating database pricelens_db..."
createdb pricelens_db 2>/dev/null || echo "(database may already exist)"

echo "==> Adding PostgreSQL to PATH for this session..."
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
export PATH="/usr/local/opt/postgresql@15/bin:$PATH"

echo ""
echo "==> PostgreSQL is ready."
echo "    Database: pricelens_db"
echo "    User: $(whoami) (your Mac user, no password)"
echo ""

# Create .env from sample if missing
SERVER_DIR="$(dirname "$0")/server"
if [ ! -f "$SERVER_DIR/.env" ]; then
  cp "$SERVER_DIR/.env.sample" "$SERVER_DIR/.env"
  # Use current user, no password (standard Homebrew setup)
  DB_USER=$(whoami)
  if sed --version 2>/dev/null | grep -q GNU; then
    sed -i "s|postgresql://postgres:yourpassword@localhost:5432/pricelens_db|postgresql://${DB_USER}@localhost:5432/pricelens_db|" "$SERVER_DIR/.env"
  else
    sed -i '' "s|postgresql://postgres:yourpassword@localhost:5432/pricelens_db|postgresql://${DB_USER}@localhost:5432/pricelens_db|" "$SERVER_DIR/.env"
  fi
  echo "==> Created server/.env with DATABASE_URL for user $DB_USER"
else
  echo "==> server/.env already exists (not overwritten)"
fi

echo ""
echo "==> Run Prisma migrations from server folder:"
echo "    cd server && npx prisma generate && npx prisma migrate deploy"
echo ""
