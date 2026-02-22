# Pricelens Backend - Developer Setup Guide

## Prerequisites

- **Node.js**: v20.x or higher
- **PostgreSQL**: v15 or higher
- **npm**: v10.x or higher

## Environment Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd Pricelens/server
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

> **Note:** We use `--legacy-peer-deps` due to NestJS v11 compatibility with some packages.

### 3. Configure environment variables

Copy the sample environment file:

```bash
cp .env.sample .env
```

Edit `.env` and fill in your values:

```env
# Database
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/pricelens_db?schema=public"

# JWT Secrets (generate secure random strings)
JWT_SECRET="your-secure-jwt-secret-min-32-chars"
JWT_REFRESH_SECRET="your-secure-refresh-secret-min-32-chars"

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"
```

**Generate secure JWT secrets:**

```bash
# On Linux/Mac:
openssl rand -base64 32

# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 4. Set up the database

**Create PostgreSQL database:**

```sql
CREATE DATABASE pricelens_db;
```

**Run migrations:**

```bash
npx prisma migrate deploy
```

**Generate Prisma client:**

```bash
npx prisma generate
```

**Seed the database (optional):**

```bash
npm run seed
```

### 5. Start the development server

```bash
npm run start:dev
```

Server will start on `http://localhost:3000`

## Testing

### Run all tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Run linter

```bash
npm run lint
```

### Format code

```bash
npm run format
```

## API Documentation

Once the server is running, visit:

**Swagger UI:** `http://localhost:3000/api`

Interactive API documentation with:
- All available endpoints
- Request/response schemas
- Try-it-out functionality
- Authentication setup

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Start production server |
| `npm run start:dev` | Start dev server with hot-reload |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run integration tests |
| `npm run test:cov` | Run tests with coverage |
| `npm run seed` | Seed database with test data |

## Project Structure

```
server/
├── src/
│   ├── auth/              # Authentication module
│   │   ├── dto/           # Data transfer objects
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── jwt.strategy.ts
│   │   └── google.strategy.ts
│   ├── prisma/            # Prisma service
│   ├── config/            # Configuration & validation
│   ├── common/            # Shared utilities
│   └── main.ts            # Application entry point
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seed.js            # Seed script
├── test/                  # E2E tests
└── docs/                  # Documentation
```

## Authentication Flow

### Email/Password Authentication

1. **Register:** `POST /auth/register`
2. **Login:** `POST /auth/login`
3. **Refresh tokens:** `POST /auth/refresh`
4. **Logout:** `POST /auth/logout`
5. **Logout all devices:** `POST /auth/logout-all`

### Google OAuth

1. **Initiate:** `GET /auth/google`
2. **Callback:** `GET /auth/google/callback`

### Protected Routes

Use JWT token in Authorization header:

```
Authorization: Bearer <access_token>
```

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT access + refresh tokens
- ✅ Token rotation on refresh
- ✅ Token reuse detection
- ✅ Rate limiting (100 req/60s per IP)
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Input validation
- ✅ SQL injection prevention (Prisma)

## Troubleshooting

### Database connection fails

- Check PostgreSQL is running: `pg_isready`
- Verify `DATABASE_URL` in `.env`
- Ensure database exists: `psql -l`

### Tests fail

- Clear test database: `npx prisma migrate reset`
- Regenerate Prisma client: `npx prisma generate`

### Port 3000 already in use

```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (Windows)
taskkill /PID <process_id> /F
```

## Next Steps

See [week1-architecture-plan.md](./week1-architecture-plan.md) for Week 2 roadmap.

## Support

For issues or questions, please create an issue in the repository.