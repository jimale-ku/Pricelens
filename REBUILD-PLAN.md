# 🚀 PriceLens Clean Rebuild Plan

## ⏱️ Estimated Time: 30-60 minutes

---

## 📋 Step-by-Step Checklist

### **Step 1: Create Login Page** (5 mins)
- [ ] Create `app/(auth)/login.tsx`
- [ ] Match Figma design specs
- [ ] Add navigation to homepage after login

### **Step 2: Clean Homepage** (10 mins)
- [ ] Update `app/(tabs)/index.tsx`
- [ ] Add horizontal scrolling category pills (36 categories)
- [ ] Implement active state for selected category
- [ ] Add click navigation to category pages
- [ ] Keep working components (Navbar, HeroSearch, etc.)

### **Step 3: Create Shared Category Layout** (15 mins)
- [ ] Create `components/category/CategoryLayout.tsx`
- [ ] Design for reuse across all 36 categories
- [ ] Add customizable sections (header, filters, product grid)
- [ ] Make it flexible for category-specific needs

### **Step 4: Update Category Page** (10 mins)
- [ ] Clean `app/category/[slug].tsx`
- [ ] Use the shared CategoryLayout component
- [ ] Load category data dynamically based on slug
- [ ] Test with 2-3 categories first

### **Step 5: Test & Polish** (10 mins)
- [ ] Test navigation flow: Login → Home → Category
- [ ] Verify category pills scroll and highlight
- [ ] Ensure all 36 categories work with one layout
- [ ] Fix any styling issues

---

## 🎯 Key Strategy

**ONE category page for ALL 36 categories**
- Single file: `app/category/[slug].tsx`
- Shared layout component
- Category-specific data from constants
- Customize per category using config/props

---

## 📁 Files to Create/Update

1. ✅ `app/(auth)/login.tsx` - NEW
2. ✅ `app/(tabs)/index.tsx` - UPDATE
3. ✅ `components/category/CategoryLayout.tsx` - NEW
4. ✅ `app/category/[slug].tsx` - UPDATE

---

## ✅ Current Status

**Waiting for:** Figma specs for login page

**Next:** Create login page once specs are shared
