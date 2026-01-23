# PriceLens Architecture & Design Documentation (Condensed)

## 1. NAVIGATION FLOW
- User opens app
- Checks localStorage for 'pricelens-authenticated'
- If NOT authenticated: show Login.tsx (Sign In / Sign Up / Demo Login)
- If authenticated: show Homepage (App.tsx)
  - Sticky Header (Logo + Plus Badge)
  - 42 Tab Pills (horizontal scroll)
  - Dynamic Content Area (switches based on active tab)

## Homepage Structure
- Header: PriceLens Logo, Tagline, Plus Member Badge
- Main Content: Tabs Bar (42 category pills)
  - Active: blue→purple gradient, white text, shadow
  - Inactive: transparent, slate text
- Tab Content: Only matching TabsContent visible

## 2. CATEGORY PATTERNS
- Pattern A: Two-Level System (25+ categories)
  - Level 1: Category Grid (6-8 subcategories)
  - Level 2: Popular Items (8-12 products with price comparisons)
- Pattern B: Direct Comparison Table (10+ categories)
  - Search Form, Comparison Table, Savings Calculator
- Pattern C: Service Listings (7+ categories)
  - Service Type Selector, Location Search, Service Cards

## 3. STATE MANAGEMENT
- Global State: isAuthenticated, userEmail, zipcode, sortBy, customStores, groceryList, isPlusSubscriber, activeTab, searchQuery, generalSearchQuery, selectedCategory, selectedStores
- localStorage Keys: 'pricelens-authenticated', 'pricelens-user', 'pricelens-zipcode', 'pricelens-custom-stores', 'pricelens-grocery-list', 'pricelens-plus-subscription'

## 4. RECOMMENDED BUILD ORDER
- Week 1: Foundation (Project setup, core UI, login, app shell, globals.css, navigation)
- Week 2: Core Patterns (Pattern A/B/C templates)
- Week 3-4: Clone Patterns (all categories)
- Week 5: Advanced Features (search, list, plus, profile)
- Week 6: Supporting Features (location, ads, analytics)
- Week 7: Polish (responsive, animations, testing)

## 5. CODE REUSABILITY
- Shared Styling Classes: .gradient-text, .glass-card, .gradient-bg-blue, .gradient-bg-purple
- Shared Components: Header pattern, Best Price Badge, Plus Upsell
- Shared Utilities: calculateSavings, findBestPrice, formatCurrency, filterByQuery

## 6. MOBILE (React Native) TRANSLATION
- Web: Single Page App with Tabs
- Mobile: Stack Navigation, HomeScreen (category grid), 39 Category Screens
- AsyncStorage for persistence, FlatList for lists, StyleSheet for styles

## 7. TECHNICAL DECISIONS
- Tabs vs Routing: Instant switching, maintains state
- localStorage vs Backend: No server costs, works offline
- Separate Components: Unique needs, easier maintenance
- Mock Data: Instant load, no APIs needed

## 8. PRODUCTION ENHANCEMENTS
- Mock Data → Real APIs
- localStorage → PostgreSQL + Redis
- Client-only → Backend API
- Single device → Cross-device sync
- Static prices → Real-time price updates

## 9. SUMMARY
- 1 Login page
- 1 Homepage with 42 tabs
- 39+ Category comparison pages
- 3 Reusable patterns (A, B, C)
- 10+ Supporting features
- Complete client-side persistence
- 65+ React components
- 11 state variables
- 8 event handlers
- 6 useEffect hooks
- Blue-purple-cyan gradient theme
- Web: 7 weeks (170 hours)
- Mobile: +4-5 weeks (100 hours)
- Total: ~11-12 weeks full app

Architecture is scalable, maintainable, and production-ready with API integration! 🚀
