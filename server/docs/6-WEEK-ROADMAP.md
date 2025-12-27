# PriceLens Backend - 6-Week Compressed Roadmap

## 🎯 Overview

Building a comprehensive price comparison platform covering 36+ categories across 100+ retailers.
Based on Figma design with homepage, category pages, item comparison views, user lists, and analytics.

**Timeline:** 6 weeks (compressed from original 12-week plan)
**Status:** Week 1-2 ✅ Complete | Week 3-6 📋 Planned

---

## ✅ Week 1: Foundation & Authentication - COMPLETED

### Deliverables:
- ✅ NestJS project setup with TypeScript
- ✅ PostgreSQL + Prisma ORM
- ✅ Environment configuration with Zod validation
- ✅ Google OAuth 2.0 integration
- ✅ JWT access + refresh token system
- ✅ Password hashing & security (bcrypt)
- ✅ Helmet, CORS, Rate limiting
- ✅ User registration, login, logout, logout-all
- ✅ Protected routes with JWT guards
- ✅ Database migrations framework
- ✅ Seed scripts
- ✅ **17 integration tests passing**
- ✅ Swagger API documentation
- ✅ Error handling & logging

### Database Models:
- ✅ User
- ✅ RefreshToken

### API Endpoints:
- ✅ POST /auth/register
- ✅ POST /auth/login
- ✅ POST /auth/refresh
- ✅ POST /auth/logout
- ✅ POST /auth/logout-all
- ✅ GET /auth/google
- ✅ GET /auth/google/callback
- ✅ GET /auth/me

---

## ✅ Week 2: Core Price Comparison Platform - COMPLETED

### Deliverables:
- ✅ Categories management (CRUD)
- ✅ Stores management (CRUD)
- ✅ Products catalog (CRUD + search)
- ✅ Multi-store price comparison
- ✅ Mock store integrations (Walmart, Amazon, Target)
- ✅ Product search with filtering
- ✅ Category-based product listing
- ✅ Store-based filtering
- ✅ Price aggregation logic
- ✅ Stock availability tracking
- ✅ Shipping cost calculation
- ✅ **15 integration tests passing**

### Database Models:
- ✅ Category
- ✅ Store
- ✅ Product
- ✅ ProductPrice
- ✅ PriceHistory

### API Endpoints:
- ✅ GET /categories
- ✅ GET /categories/slug/:slug
- ✅ GET /stores
- ✅ GET /stores/slug/:slug
- ✅ GET /products
- ✅ GET /products/:id
- ✅ GET /products/search?q=query&categoryId=id
- ✅ GET /products/search-stores?q=query

---

## 📋 Week 3: User Features & Lists (Dec 30 - Jan 5)

### Goals:
Implement user-specific features matching Figma's "My List" and "Save" functionality.

### Database Models to Add:
- **UserList** - User shopping lists
- **ListItem** - Items in user lists
- **Favorite** - Saved products for quick access
- **SavedComparison** - Saved price comparisons

### API Endpoints to Build:

#### User Lists Management
- POST /users/me/lists - Create new list
- GET /users/me/lists - Get all user lists
- GET /users/me/lists/:id - Get specific list with items
- PATCH /users/me/lists/:id - Update list name
- DELETE /users/me/lists/:id - Delete list

#### List Items Management
- POST /users/me/lists/:id/items - Add product to list
- PATCH /users/me/lists/:id/items/:itemId - Update item (quantity, notes)
- DELETE /users/me/lists/:id/items/:itemId - Remove item from list
- POST /users/me/lists/:id/items/:itemId/mark-purchased - Mark as purchased

#### Favorites Management
- POST /users/me/favorites/:productId - Add to favorites
- GET /users/me/favorites - Get all favorites with current prices
- DELETE /users/me/favorites/:productId - Remove from favorites

#### Saved Comparisons
- POST /users/me/saved-comparisons - Save a price comparison
- GET /users/me/saved-comparisons - Get saved comparisons
- DELETE /users/me/saved-comparisons/:id - Remove saved comparison

### Features to Implement:
- List sharing functionality (optional)
- Real-time price updates for saved items
- Bulk operations (add multiple items)
- Export list functionality (PDF/Email)

### Testing:
- Write 12+ integration tests for user features
- Test authorization (users can only access their own lists)
- Test edge cases (empty lists, duplicate items)

### Estimated Effort:
- 3-4 days implementation
- 1-2 days testing & refinement

---

## 📋 Week 4: Price Insights & Analytics (Jan 6 - Jan 12)

### Goals:
Implement price history tracking, trending products, and analytics features matching Figma's analytics screens.

### Database Models to Add:
- **TrendingSearch** - Track popular searches
- **ProductView** - Track product views
- **PriceAlert** - User price drop alerts
- Enhance **PriceHistory** with analytics queries

### API Endpoints to Build:

#### Price Insights (for Item Comparison View)
- GET /products/:id/price-insights - Calculate lowest, average, highest, savings
- GET /products/:id/price-history?days=30|90 - Historical price data
- GET /products/:id/price-trend - Price trend analysis (going up/down)
- GET /products/:id/best-time-to-buy - AI-powered recommendation

#### Popular & Trending
- GET /products/trending - Trending products across all categories
- GET /categories/:id/popular - Popular items in specific category
- GET /search/trending - Trending search terms
- GET /products/most-saved - Most saved products by users

#### Price Alerts
- POST /users/me/alerts - Create price drop alert
- GET /users/me/alerts - Get user's active alerts
- PATCH /users/me/alerts/:id - Update alert (target price)
- DELETE /users/me/alerts/:id - Delete alert

#### Analytics Dashboard (for Analytics Screen)
- GET /users/me/analytics/savings - Total savings tracked
- GET /users/me/analytics/categories - Most searched categories
- GET /users/me/analytics/stores - Favorite stores by usage
- GET /users/me/analytics/price-drops - Tracked price drops

### Features to Implement:
- Background job for price history snapshots (daily)
- Price alert notifications (email/push)
- Trending algorithm based on views + searches
- Price prediction using historical data
- Statistics calculations (avg, min, max, percentiles)

### Testing:
- Write 10+ tests for analytics endpoints
- Test price calculations accuracy
- Test historical queries performance
- Test background jobs

### Estimated Effort:
- 4 days implementation
- 1-2 days testing
- 1 day performance optimization

---

## 📋 Week 5: Advanced Features & Store Finder (Jan 13 - Jan 19)

### Goals:
Implement ZIP code store finder, advertisements, and prepare for real store integrations.

### Database Models to Add:
- **StoreLocation** - Physical store locations with addresses
- **Advertisement** - Sponsored content by category
- **UserPreference** - User settings (default stores, radius, etc.)
- **ApiUsageLog** - Track third-party API usage

### API Endpoints to Build:

#### Store Finder (ZIP Code Based)
- POST /stores/nearby - Find stores near ZIP code
- GET /stores/:id/locations - Get all locations for a store
- GET /stores/locations/:zip - Get stores by ZIP code
- POST /users/me/preferred-stores - Set preferred stores

#### Advertisements System
- GET /advertisements?category=groceries - Get ads for category
- GET /advertisements/featured - Featured sponsored content
- POST /admin/advertisements - Create ad (admin only)
- PATCH /admin/advertisements/:id - Update ad

#### Advanced Product Features
- GET /products/compare?ids=1,2,3 - Compare multiple products side-by-side
- GET /products/:id/alternatives - Find similar/alternative products
- GET /products/:id/reviews-summary - Aggregate review scores (if available)
- POST /products/:id/report - Report incorrect pricing

#### Integration Preparation
- GET /integrations/status - Check store API status
- GET /integrations/supported-stores - List available integrations
- POST /admin/integrations/:store/sync - Manual sync trigger

### Features to Implement:
- Third-party geolocation API integration (Geocoding)
- Distance calculation algorithm (ZIP to store)
- Ad rotation and impression tracking
- Rate limiting per third-party API
- Fallback mechanisms for failed integrations
- Store adapter pattern refinement

### Testing:
- Write 8+ tests for new features
- Test geolocation accuracy
- Test ad delivery logic
- Test integration fallbacks

### Estimated Effort:
- 3 days implementation
- 2 days third-party integrations
- 1-2 days testing

---

## 📋 Week 6: Real Store Integrations, Optimization & Deployment (Jan 20 - Jan 26)

### Goals:
Integrate real store APIs (or third-party services), optimize performance, and prepare for production deployment.

### Store Integration Strategy:

#### Option A: Third-Party Services (Fast - Recommended for MVP)
- **PriceAPI** - Aggregates Amazon, Walmart, Target, etc.
  - Cost: $50-150/month
  - Integration time: 2-3 days
  - Immediate access to 100+ retailers
  
- **ScraperAPI** - Fallback for stores without APIs
  - Cost: $50-100/month
  - Handles proxies and rate limiting

#### Option B: Official APIs (Long-term)
- **Amazon Product Advertising API**
  - Requires Associates account (2-4 weeks approval)
  - Free but strict rate limits
  
- **Walmart Open API**
  - Requires developer account (1-2 weeks approval)
  - Free with generous limits

#### Hybrid Approach (Recommended):
- Start with PriceAPI for immediate functionality
- Apply for official APIs in parallel
- Migrate store-by-store as approvals come

### Implementation Tasks:

#### Store Integration Module
- Create unified adapter interface
- Implement PriceAPI adapter (priority)
- Implement ScraperAPI fallback
- Add retry logic with exponential backoff
- Cache API responses (Redis integration)
- Queue-based price updates (Bull Queue)

#### Background Jobs
- Hourly price update job (all active products)
- Daily price history snapshot
- Price alert checking (every 15 minutes)
- Trending products calculation (daily)
- Cleanup old data (weekly)

#### Performance Optimization
- Database indexing review
- Query optimization (N+1 problem fixes)
- Redis caching layer
  - Search results: 5 min TTL
  - Product details: 10 min TTL
  - Store API responses: 1 min TTL
  - Popular items: 1 hour TTL
- API response compression
- Pagination optimization

#### Deployment Preparation
- Environment variables documentation
- Production database migration scripts
- Monitoring setup (error tracking)
- API rate limiting configuration
- HTTPS/SSL configuration
- CORS production settings
- Health check endpoints
- Database backup strategy

### API Endpoints to Complete:

#### Health & Monitoring
- GET /health - System health check
- GET /health/db - Database connection check
- GET /health/integrations - Store API status
- GET /metrics - Performance metrics (admin)

#### Admin Panel APIs
- GET /admin/stats/overview - Dashboard stats
- GET /admin/products/update-queue - Pending updates
- POST /admin/products/sync-all - Force full sync
- GET /admin/logs/errors - Recent errors
- GET /admin/users/stats - User statistics

### Testing & Quality Assurance:
- Load testing (100+ concurrent users)
- Integration tests for all store adapters
- End-to-end user journey tests
- Security audit & penetration testing
- API documentation completeness review
- Code coverage target: 80%+

### Deployment:
- Deploy to staging environment
- Performance benchmarking
- Security hardening checklist
- Production deployment
- Smoke tests in production
- Rollback plan documentation

### Estimated Effort:
- 2-3 days store integrations
- 1-2 days background jobs
- 1-2 days optimization
- 1 day deployment

---

## 📊 Summary: 6-Week Deliverables

### Total Features:
- ✅ **Week 1-2:** Authentication + Core Price Comparison (DONE)
- 📋 **Week 3:** User Lists + Favorites
- 📋 **Week 4:** Price Insights + Analytics + Alerts
- 📋 **Week 5:** Store Finder + Advertisements + Advanced Features
- 📋 **Week 6:** Real Integrations + Optimization + Deployment

### Total API Endpoints: 60+
- ✅ 8 Auth endpoints
- ✅ 8 Product/Store/Category endpoints
- 📋 12 User Lists & Favorites endpoints
- 📋 15 Analytics & Insights endpoints
- 📋 10 Store Finder & Ads endpoints
- 📋 7 Admin & Health endpoints

### Database Models: 15+
- ✅ User, RefreshToken
- ✅ Category, Store, Product, ProductPrice, PriceHistory
- 📋 UserList, ListItem, Favorite, SavedComparison
- 📋 TrendingSearch, ProductView, PriceAlert
- 📋 StoreLocation, Advertisement, UserPreference, ApiUsageLog

### Testing Coverage:
- ✅ Week 1: 17 tests passing
- ✅ Week 2: 15 tests passing
- 📋 Week 3: 12+ tests
- 📋 Week 4: 10+ tests
- 📋 Week 5: 8+ tests
- 📋 Week 6: E2E + Load tests
- **Total Target: 70+ integration tests**

---

## 🎯 What's Covered from Figma Design:

### Homepage:
- ✅ Universal Search (search-stores endpoint)
- 📋 Trending Searches (Week 4)
- ✅ Category Grid (categories endpoint)
- 📋 Stats Bar (Week 4 analytics)

### Category Pages (e.g., Groceries):
- ✅ Store Multi-Select Filters (implemented)
- ✅ Product Search with filters
- 📋 Popular Items Section (Week 4)
- ✅ Price Comparison Grid
- 📋 ZIP Code Store Finder (Week 5)
- 📋 Advertisement Section (Week 5)

### Item Comparison View:
- ✅ Product Details
- 📋 Price Insight Cards (Lowest/Average/Savings) - Week 4
- ✅ Ranked Retailer List
- 📋 Save button functionality (Week 3)
- 📋 Price History Chart (Week 4)

### My List Page:
- 📋 User Shopping Lists (Week 3)
- 📋 Add/Remove Items (Week 3)
- 📋 Mark as Purchased (Week 3)

### Analytics Pages:
- 📋 User Savings Dashboard (Week 4)
- 📋 Category Usage Stats (Week 4)
- 📋 Favorite Stores (Week 4)
- 📋 Price Drop Tracking (Week 4)

### Profile/Settings:
- ✅ User Info (auth/me)
- 📋 Preferred Stores (Week 5)
- 📋 Notification Settings (Week 4)

---

## 🚀 Success Criteria

By end of Week 6, you will have:

1. **Fully Functional Backend** covering 90%+ of Figma requirements
2. **60+ REST API endpoints** with Swagger documentation
3. **70+ Integration tests** with 80%+ code coverage
4. **Real store integrations** (via PriceAPI or official APIs)
5. **Background job system** for automated price updates
6. **Production deployment** on AWS/Firebase with monitoring
7. **Performance optimized** with Redis caching
8. **Security hardened** and production-ready
9. **Complete API documentation** for frontend team
10. **Mobile-ready** backend supporting your 36+ category Figma design

---

## 💡 Key Differences from Original 12-Week Plan

**Compressed by:**
- Combining related features in same week
- Parallel development of complementary features
- Using third-party services instead of waiting for API approvals
- Streamlined testing (continuous instead of dedicated test weeks)
- Aggressive caching to handle scale early

**Trade-offs:**
- Less time for experimentation
- More focused scope (core features first)
- Phased rollout of all 36 categories (start with 10-15)
- Some advanced features may be simplified

**Maintained:**
- Code quality standards
- Security best practices
- Test coverage targets
- Production readiness

---

## 📅 Next Steps

**Immediate (Week 3 Prep):**
1. Review this roadmap and confirm priorities
2. Set up development environment for Week 3
3. Create database migration for User Lists models
4. Plan frontend-backend integration points

**Weekly Cadence:**
1. Monday: Plan week, review Figma requirements
2. Tuesday-Thursday: Implementation
3. Friday: Testing & code review
4. Weekend: Documentation & prep for next week

---

**Let's build this! 🚀**
