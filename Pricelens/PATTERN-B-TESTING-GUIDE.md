# 🧪 Pattern B Testing Guide - Complete Checklist

## 📋 **Pattern B Overview**

**Pattern B** is for **location-based comparison** categories that show results in a **table format**.

**Categories Using Pattern B (13 total):**
1. `gas-stations` - Gas prices by location
2. `gym` - Gym memberships
3. `car-insurance` - Car insurance quotes
4. `renters-insurance` - Renters insurance quotes
5. `tires` - Tire prices by shop
6. `mattresses` - Mattress prices by store
7. `oil-changes` - Oil change prices
8. `car-washes` - Car wash prices
9. `rental-cars` - Rental car prices
10. `hotels` - Hotel prices
11. `airfare` - Flight prices
12. `storage` - Storage unit prices
13. `meal-kits` - Meal kit prices

---

## 🎯 **What to Test**

### **Test 1: Page Load & Layout**

**Steps:**
1. Navigate to any Pattern B category (e.g., `/category/gas-stations`)
2. Check the page loads without errors

**What to Verify:**
- [ ] Page loads without crashes
- [ ] Header shows correct category name
- [ ] Category icon displays with gradient
- [ ] Category description shows
- [ ] Search form appears
- [ ] No loading spinner stuck

**Expected Result:** ✅ Page loads, shows header and search form

---

### **Test 2: Category Header Section**

**What to Check:**
- [ ] **Background Card**
  - Dark background: `rgba(15, 23, 42, 0.6)`
  - Border radius: 16px
  - Border: 1px, subtle color
  - Gradient overlay visible

- [ ] **Icon Container**
  - Size: 64x64px
  - Border radius: 12px
  - Gradient background matches category colors
  - Icon centered and visible

- [ ] **Title Text**
  - Font size: 24px
  - Font weight: 700 (bold)
  - Gradient text effect (masked view)
  - Shows category name

- [ ] **Description Text**
  - Font size: 14px
  - Color: `#94A3B8` (slate-400)
  - Shows category description

**Figma Match:** ✅ / ❌  
**Notes:** ________________

---

### **Test 3: Search Form Section**

**What to Check:**
- [ ] **Section Container**
  - Background: `rgba(15, 23, 42, 0.6)`
  - Border radius: 16px
  - Padding: 24px
  - Border: 1px, subtle

- [ ] **Section Title**
  - Text: "Search {Category Name}"
  - Font size: 18px
  - Font weight: 600
  - Color: `#E2E8F0` (slate-200)

- [ ] **ZIP Code Field** (Always present)
  - Label: "ZIP Code"
  - Input field:
    - Background: `rgba(255, 255, 255, 0.05)`
    - Border: 1px, `rgba(255, 255, 255, 0.1)`
    - Border radius: 12px
    - Padding: 16px horizontal, 12px vertical
    - Placeholder: "Enter ZIP code"
    - Text color: `#FFFFFF`
    - Font size: 16px

- [ ] **Category-Specific Fields** (Check based on category)
  
  **Gas Stations:**
  - [ ] Fuel Type dropdown appears
  - [ ] Options: Regular (87), Mid-Grade (89), Premium (91+), Diesel
  - [ ] Dropdown is clickable

  **Gym:**
  - [ ] Membership Type dropdown appears
  - [ ] Options: Basic, Premium, Family
  - [ ] Dropdown is clickable

  **Mattresses:**
  - [ ] Mattress Size dropdown appears
  - [ ] Options: Twin, Full, Queen, King
  - [ ] Dropdown is clickable

  **Hotels:**
  - [ ] Check-in Date field appears
  - [ ] Check-out Date field appears
  - [ ] Guests field appears

  **Airfare:**
  - [ ] Origin field appears
  - [ ] Destination field appears
  - [ ] Dates field appears
  - [ ] Passengers field appears

- [ ] **Search Button**
  - Gradient background (matches category colors)
  - Border radius: 12px
  - Padding: 14px vertical
  - Text: "Search Prices"
  - Search icon visible
  - Button is clickable

**Figma Match:** ✅ / ❌  
**Notes:** ________________

---

### **Test 4: Search Functionality**

**Steps:**
1. Enter a ZIP code (e.g., 90210)
2. Fill in category-specific fields (if any)
3. Click "Search Prices" button

**What to Verify:**
- [ ] Button shows loading spinner when clicked
- [ ] Loading state works correctly
- [ ] After search, shows "Coming Soon" alert (expected - not implemented yet)
- [ ] Results section appears (even if empty)
- [ ] No crashes or errors

**Expected Result:** ⚠️ Shows "Coming Soon" alert (this is expected - backend not implemented)

**Notes:** ________________

---

### **Test 5: Results Section**

**What to Check (When Results Are Available):**
- [ ] **Results Container**
  - Background: `rgba(15, 23, 42, 0.6)`
  - Border radius: 16px
  - Padding: 24px
  - Appears after search

- [ ] **Empty State** (Currently shown)
  - [ ] Information icon visible
  - [ ] Text: "No results found. Try adjusting your search criteria."
  - [ ] Color: `#94A3B8` (slate-400)
  - [ ] Centered alignment

- [ ] **Results Table** (When implemented)
  - [ ] Table header row visible
  - [ ] Table rows for each result
  - [ ] Columns match category requirements (see below)
  - [ ] Results sorted by price (lowest first)
  - [ ] Distance shown (if applicable)

**Category-Specific Table Columns:**

| Category | Table Columns Expected |
|--------|----------------------|
| Gas Stations | Station Name \| Address \| Price \| Distance |
| Gym | Gym Name \| Address \| Price \| Distance |
| Car Insurance | Company \| Monthly Price \| Coverage \| Rating |
| Renters Insurance | Company \| Monthly Price \| Coverage \| Rating |
| Tires | Shop Name \| Address \| Price \| Distance |
| Mattresses | Store Name \| Address \| Price \| Distance |
| Oil Changes | Shop Name \| Address \| Price \| Distance |
| Car Washes | Location \| Address \| Price \| Distance |
| Rental Cars | Company \| Price \| Dates \| Car Type |
| Hotels | Hotel Name \| Address \| Price/Night \| Rating \| Distance |
| Airfare | Airline \| Price \| Departure \| Arrival \| Duration |
| Storage | Facility \| Address \| Price \| Size \| Distance |
| Meal Kits | Service \| Price \| Meals/Week \| Delivery |

**Figma Match:** ✅ / ❌  
**Notes:** ________________

---

### **Test 6: Category-Specific Testing**

#### **Test Gas Stations:**
- [ ] ZIP Code field works
- [ ] Fuel Type dropdown works
- [ ] Can select different fuel types
- [ ] Search button triggers search
- [ ] Results section appears

#### **Test Gym:**
- [ ] ZIP Code field works
- [ ] Membership Type dropdown works
- [ ] Can select different membership types
- [ ] Search button triggers search

#### **Test Hotels:**
- [ ] ZIP Code field works
- [ ] Check-in Date field appears
- [ ] Check-out Date field appears
- [ ] Guests field appears
- [ ] Date pickers work (if implemented)

#### **Test Airfare:**
- [ ] Origin field works
- [ ] Destination field works
- [ ] Dates field works
- [ ] Passengers field works

**Result:** ✅ / ❌  
**Notes:** ________________

---

### **Test 7: Error Handling**

**Steps:**
1. Click "Search Prices" without entering ZIP code
2. Enter invalid ZIP code
3. Try to search with missing required fields

**What to Verify:**
- [ ] Shows alert: "Please enter a ZIP code to search"
- [ ] Form validation works
- [ ] No crashes on invalid input
- [ ] Error messages are clear

**Result:** ✅ / ❌  
**Notes:** ________________

---

### **Test 8: Responsive Design**

**What to Check:**
- [ ] Layout fits mobile screen
- [ ] Text is readable
- [ ] Buttons are tappable
- [ ] Form fields are accessible
- [ ] No horizontal scroll
- [ ] Table (when implemented) is scrollable

**Result:** ✅ / ❌  
**Notes:** ________________

---

## 📝 **Testing Checklist by Category**

### **Simple Categories (ZIP + 1 Field):**
- [ ] **Gas Stations** - ZIP + Fuel Type
- [ ] **Gym** - ZIP + Membership Type
- [ ] **Mattresses** - ZIP + Mattress Size
- [ ] **Storage** - ZIP + Unit Size
- [ ] **Meal Kits** - ZIP + Meal Type

### **Medium Categories (ZIP + 2 Fields):**
- [ ] **Tires** - ZIP + Tire Size + Vehicle
- [ ] **Car Insurance** - ZIP + Car Type + Coverage
- [ ] **Renters Insurance** - ZIP + Apartment Size + Coverage
- [ ] **Oil Changes** - ZIP + Vehicle Type + Service Level
- [ ] **Car Washes** - ZIP + Service Type + Vehicle Size

### **Complex Categories (Multiple Fields + Dates):**
- [ ] **Rental Cars** - ZIP + Car Type + Dates
- [ ] **Hotels** - ZIP + Check-in/out + Guests
- [ ] **Airfare** - Origin + Destination + Dates + Passengers

---

## 🐛 **Common Issues to Check**

- [ ] Page crashes when navigating to Pattern B category
- [ ] Search form doesn't appear
- [ ] Dropdowns don't work (for select fields)
- [ ] Search button doesn't respond
- [ ] Loading spinner gets stuck
- [ ] Results section doesn't appear after search
- [ ] Wrong search fields for category
- [ ] Missing category-specific fields

---

## 📊 **Test Results Summary**

**Category Tested:** ________________  
**Date:** ________________  
**Tester:** ________________  

**Overall Status:** ✅ Working / ⚠️ Needs Fixes / ❌ Major Issues

**Key Issues Found:**
1. ________________
2. ________________
3. ________________

**What Works Well:**
1. ________________
2. ________________
3. ________________

**Missing Features:**
1. ________________
2. ________________
3. ________________

---

## 🚀 **Next Steps After Testing**

**If Everything Works:**
- ✅ Pattern B layout is ready
- ⚠️ Need to implement backend API for real results
- ⚠️ Need to implement results table component

**If Issues Found:**
- Report specific issues (e.g., "Gas Stations dropdown doesn't work")
- I'll fix them before moving to Pattern C

**If Missing Features:**
- Tell me what search fields are missing
- Tell me what table columns are needed
- I'll add them

---

## 💡 **Quick Test (5 Minutes)**

**Fastest way to test Pattern B:**

1. Open app
2. Navigate to `gas-stations` category
3. Check:
   - [ ] Header shows "Gas Stations"
   - [ ] Search form has ZIP + Fuel Type
   - [ ] Search button works
   - [ ] Shows "Coming Soon" alert (expected)

**If this works, all Pattern B categories should work!** ✅

---

**Ready to test? Start with Gas Stations and work through the list!** 🚀







