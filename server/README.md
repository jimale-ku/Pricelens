# Pricelens Backend API

Backend server for Pricelens - A comprehensive price comparison and tracking platform.

## \ud83d\ude80 Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Copy environment variables
cp .env.sample .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate deploy

# Start development server
npm run start:dev
```

Server runs on `http://localhost:3000`  
API Documentation: `http://localhost:3000/api`

## \ud83d\udcda Documentation

- **[Setup Guide](docs/SETUP.md)** - Complete developer onboarding
- **[Security Checklist](docs/SECURITY-CHECKLIST.md)** - Security measures & production readiness
- **[Architecture Plan](docs/week1-architecture-plan.md)** - System design & roadmap

## \ud83c\udfdb\ufe0f Tech Stack

- **Framework:** NestJS v11
- **Database:** PostgreSQL v15 + Prisma ORM
- **Authentication:** JWT + Google OAuth 2.0
- **Testing:** Jest + Supertest
- **API Docs:** Swagger/OpenAPI
- **Security:** Helmet, CORS, Rate Limiting

## \u2705 Week 1 - Completed Features

### Day 1 - Project Scaffolding
- \u2705 NestJS project initialized with TypeScript
- \u2705 ESLint + Prettier + Husky git hooks
- \u2705 Environment management with Zod validation
- \u2705 Folder structure (modules, config, tests, docs)

### Day 2 - Database & Models
- \u2705 PostgreSQL + Prisma setup
- \u2705 User model with audit fields
- \u2705 RefreshToken model with cascade delete
- \u2705 Migrations framework
- \u2705 Seed script

### Day 3 - Auth Plumbing
- \u2705 Email/password registration
- \u2705 Email/password login
- \u2705 JWT access + refresh tokens
- \u2705 Password hashing (bcrypt)
- \u2705 Input validation (class-validator)
- \u2705 Protected routes (JWT guard)

### Day 4 - OAuth & Session Hardening
- \u2705 Google OAuth integration
- \u2705 Account linking (Google <-> email)
- \u2705 Token rotation on refresh
- \u2705 Token reuse detection
- \u2705 Logout endpoint
- \u2705 Logout-all endpoint
- \u2705 Helmet security headers
- \u2705 CORS policy
- \u2705 Rate limiting (100 req/60s)

### Day 5 - Testing & Documentation
- \u2705 Swagger API documentation
- \u2705 Integration tests (17 test cases)
- \u2705 CI pipeline (GitHub Actions)
- \u2705 Developer setup guide
- \u2705 Security checklist
- \u2705 Lint/test suite passing

## \ud83d\udd10 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create new account |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout (revoke token) |
| POST | `/auth/logout-all` | Logout all devices |
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/google/callback` | Google OAuth callback |
| GET | `/auth/me` | Get current user \ud83d\udd12 |

\ud83d\udd12 = Requires authentication

## \ud83e\uddea Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Test coverage
npm run test:cov

# Lint code
npm run lint
```

**Current Test Coverage:**
- 17/17 integration tests passing \u2705
- Auth flows fully tested
- Token rotation verified
- Security features validated

## \ud83d\udc64 Developer Commands

```bash
# Development
npm run start:dev          # Hot-reload dev server
npm run build              # Build for production
npm run start:prod         # Run production build

# Database
npx prisma studio          # Visual database editor
npx prisma migrate dev     # Create new migration
npx prisma migrate deploy  # Apply migrations
npm run seed               # Seed test data

# Code Quality
npm run format             # Format with Prettier
npm run lint               # Run ESLint
```

## \ud83d\udee1\ufe0f Security Features

- \u2705 Password hashing (bcrypt)
- \u2705 JWT tokens with rotation
- \u2705 Token reuse detection
- \u2705 Rate limiting
- \u2705 Helmet headers
- \u2705 CORS protection
- \u2705 Input validation
- \u2705 SQL injection prevention
- \u2705 Environment validation

See [SECURITY-CHECKLIST.md](docs/SECURITY-CHECKLIST.md) for production deployment requirements.

## \ud83d\udcca CI/CD

GitHub Actions pipeline runs on every push:
1. Lint code
2. Run migrations
3. Run unit tests
4. Run e2e tests
5. Upload coverage reports

## \ud83d\udce6 Project Structure

```
server/
\u251c\u2500\u2500 src/
\u2502   \u251c\u2500\u2500 auth/              # Authentication module
\u2502   \u251c\u2500\u2500 common/            # Shared utilities
\u2502   \u251c\u2500\u2500 config/            # Config & validation
\u2502   \u251c\u2500\u2500 prisma/            # Prisma service
\u2502   \u2514\u2500\u2500 main.ts            # App entry point
\u251c\u2500\u2500 prisma/
\u2502   \u251c\u2500\u2500 schema.prisma      # Database schema
\u2502   \u251c\u2500\u2500 migrations/        # DB migrations
\u2502   \u2514\u2500\u2500 seed.js            # Seed script
\u251c\u2500\u2500 test/                  # E2E tests
\u2514\u2500\u2500 docs/                  # Documentation
```

## \ud83d\udd17 Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Swagger UI](http://localhost:3000/api) (when server is running)

## \ud83d\ude80 Next Steps (Week 2+)

See [week1-architecture-plan.md](docs/week1-architecture-plan.md) for upcoming features:
- Product module
- Price tracking
- Scraping services
- User preferences
- Notifications

## \ud83d\udcdd License

UNLICENSED - Private project

---

**Week 1 Status:** \u2705 Complete  
**Production Ready:** \u26a0\ufe0f Requires security hardening (see checklist)
