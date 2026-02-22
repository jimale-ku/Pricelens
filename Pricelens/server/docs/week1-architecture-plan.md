# PriceLens Backend – Week 1 Architecture Plan

## 1. Technology Stack

### Backend Framework
- **NestJS** with TypeScript
  - Modular architecture
  - Built-in dependency injection
  - Strong typing and validation
  - Excellent for scalable APIs

### Database
- **PostgreSQL**
  - Relational data (users, products, stores, prices)
  - Time-series data (price history)
  - Full-text search capabilities
  - ACID compliance for data integrity

### ORM
- **Prisma** (recommended) or **TypeORM**
  - Type-safe database queries
  - Migration management
  - Auto-generated types

### Authentication
- **JWT** (JSON Web Tokens)
- **Google OAuth 2.0** via Passport.js
- Refresh token mechanism

### Caching & Background Jobs
- **Redis** (caching layer)
- **Bull Queue** (background job processing)

---

## 2. Service Boundaries

### Auth Service
- User registration/login
- Google Sign-In integration
- JWT token generation/validation
- Password hashing (bcrypt)

### Products Service
- Product search (full-text search)
- Product details retrieval
- Product aggregation (lowest price, store count)

### Stores Service
- Store management (Amazon, Walmart, Target)
- Store adapter pattern (modular integration)
- Price fetching from store APIs
- Rate limiting per store

### Price Tracking Service
- Current price storage
- Price history (30/90 days)
- Price statistics calculation
- Price update scheduling

### Favorites Service
- Save/remove favorites
- Fetch user favorites
- Favorites with current prices

### Alerts Service
- Create price drop alerts
- Monitor price changes
- Trigger notifications

---

## 3. Request/Response Flow

### Example: Product Search Flow
1. Client → `GET /api/products/search?q=iPhone`
2. Auth middleware validates JWT (if required)
3. Check Redis cache (5min TTL)
4. If cache miss:
   - Query PostgreSQL with full-text search
   - Aggregate prices from `product_prices` table
   - Calculate lowest price and store count
5. Cache result in Redis
6. Return JSON response

### Example: Price Update Flow (Background Job)
1. Bull Queue job runs hourly
2. For each active product:
   - Call store adapters (Amazon, Walmart, Target APIs)
   - Update `product_prices` table
   - Insert daily snapshot into `price_history`
3. Check `price_alerts` table
4. If price dropped below target → trigger notification

---

## 4. Third-Party Integrations

### Store APIs
- **Amazon Product Advertising API**
  - Requires Associates account approval (2-4 weeks)
  - Rate limit: 1 req/sec
- **Walmart Open API**
  - Requires developer account approval (1-2 weeks)
- **Target Product API**
  - May require partnership
- **Fallback:** Third-party aggregators (PriceAPI, ScraperAPI)

### Google OAuth
- OAuth 2.0 flow
- Server-side token verification
- User profile retrieval

---

## 5. Database Schema Overview

### Core Tables
- **users** - User accounts (email, Google ID, profile)
- **products** - Product catalog (name, description, images, category)
- **stores** - Store information (name, API endpoints, enabled status)
- **product_prices** - Current prices per store
- **price_history** - Time-series price data (daily snapshots)
- **favorites** - User-product relationships
- **price_alerts** - User price drop alerts

### Indexes
- Full-text search on product names
- Indexes on foreign keys (product_id, store_id, user_id)
- Date indexes for price history queries

---

## 6. Security Measures

- **HTTPS** only in production
- **JWT** tokens with expiration
- **Rate limiting** (100 req/min per IP)
- **CORS** configuration
- **Input validation** (DTOs with class-validator)
- **SQL injection** prevention (parameterized queries)
- **Environment variables** for sensitive data

---

## 7. Deployment Strategy

### Development
- Docker Compose (PostgreSQL + Redis + Backend)
- Hot reload with `nest start --watch`

### Production Options
- **AWS:** EC2 + RDS + ElastiCache
- **Firebase:** Cloud Functions + Cloud SQL + Memorystore
- **Heroku:** PostgreSQL addon + Redis addon

---

## 8. Week 1 Deliverables

✅ Project setup (NestJS + TypeScript)
✅ Folder structure (modules, common, config, database, utils)
✅ Environment configuration with validation (Zod)
✅ Docker development environment
✅ Error handling & logging (Pino)
✅ CI/CD pipeline (GitHub Actions)
✅ Architecture documentation (this document)

---

## 9. Next Steps (Week 2+)

- Database setup with Prisma/TypeORM
- User authentication (email/password + Google)
- Product search API
- Store integration setup
- Price tracking system







