# Week 3: User Features & Lists - Detailed To-Do

**Timeline:** Dec 30 - Jan 5
**Goal:** Implement "My List" and "Save" functionality from Figma

---

## 📋 Phase 1: Database Schema (Day 1 - Monday)

### Models to Create:

#### 1. UserList Model
```prisma
model UserList {
  id          String     @id @default(uuid())
  userId      String
  name        String
  description String?
  isDefault   Boolean    @default(false)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items       ListItem[]
  
  @@index([userId])
}
```

#### 2. ListItem Model
```prisma
model ListItem {
  id          String    @id @default(uuid())
  listId      String
  productId   String
  quantity    Int       @default(1)
  notes       String?
  isPurchased Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  list        UserList  @relation(fields: [listId], references: [id], onDelete: Cascade)
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@unique([listId, productId])
  @@index([listId])
  @@index([productId])
}
```

#### 3. Favorite Model
```prisma
model Favorite {
  id        String   @id @default(uuid())
  userId    String
  productId String
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@unique([userId, productId])
  @@index([userId])
  @@index([productId])
}
```

#### 4. SavedComparison Model
```prisma
model SavedComparison {
  id        String   @id @default(uuid())
  userId    String
  productId String
  notes     String?
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([productId])
}
```

### Tasks:
- [ ] Update schema.prisma with new models
- [ ] Add relations to User model (lists, favorites, savedComparisons)
- [ ] Add relations to Product model (listItems, favorites, savedComparisons)
- [ ] Create migration: `npx prisma migrate dev --name week3_user_features`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Update seed.js with sample lists/favorites

---

## 📋 Phase 2: DTOs & Entities (Day 1-2)

### DTOs to Create:

#### lists/dto/
- [ ] `create-list.dto.ts`
- [ ] `update-list.dto.ts`
- [ ] `add-item.dto.ts`
- [ ] `update-item.dto.ts`

#### favorites/dto/
- [ ] `create-favorite.dto.ts` (just productId)

#### comparisons/dto/
- [ ] `save-comparison.dto.ts`

### Entities to Create:

#### lists/entities/
- [ ] `user-list.entity.ts`
- [ ] `list-item.entity.ts`

#### favorites/entities/
- [ ] `favorite.entity.ts`

---

## 📋 Phase 3: Services (Day 2-3)

### Lists Service (`src/lists/lists.service.ts`)

Methods to implement:
- [ ] `createList(userId, dto)` - Create new list
- [ ] `getUserLists(userId)` - Get all user's lists with item counts
- [ ] `getListById(userId, listId)` - Get specific list with all items and prices
- [ ] `updateList(userId, listId, dto)` - Update list name/description
- [ ] `deleteList(userId, listId)` - Delete list and all items
- [ ] `addItemToList(userId, listId, productId, quantity, notes)` - Add product
- [ ] `updateListItem(userId, listId, itemId, dto)` - Update quantity/notes
- [ ] `removeItemFromList(userId, listId, itemId)` - Remove item
- [ ] `markItemPurchased(userId, listId, itemId, isPurchased)` - Toggle purchased
- [ ] `getTotalEstimatedCost(listId)` - Calculate total cost using lowest prices

### Favorites Service (`src/favorites/favorites.service.ts`)

Methods to implement:
- [ ] `addFavorite(userId, productId)` - Add to favorites
- [ ] `getUserFavorites(userId)` - Get all favorites with current prices
- [ ] `removeFavorite(userId, productId)` - Remove from favorites
- [ ] `isFavorite(userId, productId)` - Check if product is favorited

### Comparisons Service (`src/comparisons/comparisons.service.ts`)

Methods to implement:
- [ ] `saveComparison(userId, productId, notes)` - Save comparison
- [ ] `getUserComparisons(userId)` - Get saved comparisons
- [ ] `deleteComparison(userId, comparisonId)` - Remove saved comparison

---

## 📋 Phase 4: Controllers (Day 3-4)

### Lists Controller (`src/lists/lists.controller.ts`)

Endpoints to implement:
- [ ] `POST /lists` - Create list
- [ ] `GET /lists` - Get all user lists
- [ ] `GET /lists/:id` - Get specific list with items
- [ ] `PATCH /lists/:id` - Update list
- [ ] `DELETE /lists/:id` - Delete list
- [ ] `POST /lists/:id/items` - Add item to list
- [ ] `PATCH /lists/:id/items/:itemId` - Update item
- [ ] `DELETE /lists/:id/items/:itemId` - Remove item
- [ ] `POST /lists/:id/items/:itemId/purchase` - Mark purchased/unpurchased

All endpoints require JWT authentication.

### Favorites Controller (`src/favorites/favorites.controller.ts`)

Endpoints to implement:
- [ ] `POST /favorites/:productId` - Add to favorites
- [ ] `GET /favorites` - Get all favorites
- [ ] `DELETE /favorites/:productId` - Remove from favorites

### Comparisons Controller (`src/comparisons/comparisons.controller.ts`)

Endpoints to implement:
- [ ] `POST /comparisons` - Save comparison
- [ ] `GET /comparisons` - Get saved comparisons
- [ ] `DELETE /comparisons/:id` - Remove comparison

---

## 📋 Phase 5: Modules Setup (Day 4)

### Create Modules:
- [ ] `nest g module lists`
- [ ] `nest g module favorites`
- [ ] `nest g module comparisons`

### Import Dependencies:
- [ ] Import PrismaModule in each
- [ ] Import JwtAuthGuard for protected routes
- [ ] Export services if needed

### Update App Module:
- [ ] Import ListsModule
- [ ] Import FavoritesModule
- [ ] Import ComparisonsModule

---

## 📋 Phase 6: Swagger Documentation (Day 4)

### Add API Tags:
- [ ] `@ApiTags('lists')` on ListsController
- [ ] `@ApiTags('favorites')` on FavoritesController
- [ ] `@ApiTags('comparisons')` on ComparisonsController

### Add Response Decorators:
- [ ] `@ApiOperation()` on each endpoint
- [ ] `@ApiResponse()` for success/error cases
- [ ] `@ApiBearerAuth('JWT-auth')` for protected routes

---

## 📋 Phase 7: Testing (Day 5-6)

### Integration Tests (`test/week3.e2e-spec.ts`)

Test cases to write:
- [ ] Create user list successfully
- [ ] Get all user lists with item counts
- [ ] Add multiple items to list
- [ ] Update item quantity and notes
- [ ] Mark item as purchased
- [ ] Calculate total list cost correctly
- [ ] Delete item from list
- [ ] Delete entire list
- [ ] Add product to favorites
- [ ] Get favorites with current prices
- [ ] Remove from favorites
- [ ] Save price comparison
- [ ] Verify authorization (can't access other user's lists)
- [ ] Handle duplicate items in list (should update quantity)
- [ ] Handle adding non-existent product

**Target: 12+ tests passing**

---

## 📋 Phase 8: Advanced Features (Optional - Day 6-7)

### If time permits:

#### List Sharing:
- [ ] Add `isShared` and `sharedWith` fields to UserList
- [ ] `POST /lists/:id/share` - Generate shareable link
- [ ] `GET /lists/shared/:token` - View shared list (read-only)

#### Bulk Operations:
- [ ] `POST /lists/:id/items/bulk` - Add multiple items at once
- [ ] `DELETE /lists/:id/items/bulk` - Remove multiple items

#### Export Functionality:
- [ ] `GET /lists/:id/export?format=pdf` - Export as PDF
- [ ] `POST /lists/:id/email` - Email list to user

---

## 🎯 Success Criteria

By end of Week 3, you should have:

1. ✅ 4 new database models with proper relations
2. ✅ 3 new modules (Lists, Favorites, Comparisons)
3. ✅ 12+ new API endpoints
4. ✅ 12+ integration tests passing
5. ✅ Swagger documentation for all endpoints
6. ✅ Proper JWT authorization on all routes
7. ✅ Seed data for testing

---

## 📝 Daily Breakdown

### Monday (Dec 30):
- Morning: Database schema design & migration
- Afternoon: DTOs & Entities creation

### Tuesday (Dec 31):
- Morning: Lists Service implementation
- Afternoon: Favorites & Comparisons Services

### Wednesday (Jan 1):
- Morning: Controllers implementation
- Afternoon: Module setup & wiring

### Thursday (Jan 2):
- Morning: Swagger documentation
- Afternoon: Start writing tests

### Friday (Jan 3):
- Full day: Testing & bug fixes

### Weekend (Jan 4-5):
- Refinement, edge cases, optional features

---

## 🚨 Common Pitfalls to Avoid

1. **Authorization:** Always verify userId matches the list owner
2. **Cascading Deletes:** Ensure items are deleted when list is deleted
3. **Duplicate Items:** Handle adding same product to list twice (update quantity instead)
4. **Price Updates:** Fetch current prices when displaying lists/favorites
5. **Pagination:** Add pagination to lists endpoint if user has many lists
6. **Validation:** Validate productId exists before adding to list

---

**Ready to start Week 3! 🚀**
