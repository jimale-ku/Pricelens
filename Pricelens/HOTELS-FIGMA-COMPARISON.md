# Hotels Category - Figma Design Comparison

## 🎯 Purpose
This document helps you compare your current Hotels implementation with the Figma design to identify what needs to be changed.

---

## 📋 **Questions to Ask Your AI (Figma Design Builder)**

Since your current implementation is **card-based** but the codebase expects **Pattern B (table)**, you need to clarify what the Figma design shows.

### **Critical Questions:**

```
For the Hotels category in the Figma design:

1. LAYOUT FORMAT (Most Important):
   Does the Figma design show:
   A) Card-based layout (individual cards per booking site) - matches current implementation
   B) Table format (rows and columns like a spreadsheet) - matches codebase Pattern B
   C) Hybrid format (table with expandable cards)
   
   ⚠️ This determines if we keep current implementation or refactor to table.

2. SEARCH FIELDS:
   Current implementation has:
   - Destination (text input, placeholder: "City or Hotel Name")
   - Guests (number input, default: 2)
   - Check-in Date (date picker)
   - Check-out Date (date picker)
   
   Does the Figma design include:
   - ZIP code field? (Currently NOT in implementation)
   - Any other fields?
   - What are the exact placeholder texts?

3. RESULTS DISPLAY:
   If Figma shows CARDS (like current):
   - Are booking site logos shown? (Current: Yes, from Clearbit API)
   - Are "Book Now" buttons included? (Current: Yes, blue gradient)
   - How are prices displayed? (Current: per night + total)
   - Are rank badges shown? (Current: Yes, #1, #2, #3)
   - Is "Best Price" badge shown? (Current: Yes, only for #1)
   
   If Figma shows TABLE:
   - What are the exact column headers?
   - What information is in each column?
   - Are there action buttons in the table?

4. VISUAL ELEMENTS:
   Current implementation includes:
   - Hotel image (128x128px, Unsplash, cyan border)
   - Booking site logos (32x32px, Clearbit API)
   - Star rating (5 stars)
   - Summary cards (Lowest Price, Average Price, Potential Savings)
   - Gradient styling (cyan/purple for #1, blue for buttons)
   
   Does Figma design show:
   - Same visual elements?
   - Different styling/colors?
   - Additional elements not in current implementation?

5. SEARCH FORM LAYOUT:
   Current: 2x2 grid
   - Does Figma show the same layout?
   - Are icons shown for each field? (Current: MapPin, Users, Calendar)
   - Same field order?

6. SUMMARY SECTION:
   Current: 3 summary cards (Lowest Price, Average Price, Potential Savings)
   - Does Figma show these?
   - Different summary information?
```

---

## 🔄 **Decision Matrix**

Based on your AI's answers, here's what to do:

### **Scenario 1: Figma Shows Cards (Matches Current)**
✅ **Action:** Create custom `HotelsLayout.tsx` component
- Keep current card-based implementation
- Change `hotels: 'B'` to custom layout in `[slug].tsx`
- Create `HotelsLayout.tsx` similar to `TiresLayout.tsx`
- Update to match Figma styling exactly

### **Scenario 2: Figma Shows Table (Different from Current)**
⚠️ **Action:** Refactor to table format
- Keep `hotels: 'B'` in `categoryPatterns.ts`
- Refactor frontend to use `PatternBLayout.tsx`
- Update backend to return table-compatible data
- Match Figma table design exactly

### **Scenario 3: Figma Shows Hybrid (Table + Cards)**
🔄 **Action:** Create custom layout with both
- Create custom `HotelsLayout.tsx`
- Implement table with expandable cards
- More complex but matches design

---

## 📝 **Implementation Checklist**

Once you get answers from your AI:

### **If Figma Shows Cards:**
- [ ] Create `client/components/category/HotelsLayout.tsx`
- [ ] Update `client/app/category/[slug].tsx` to use `HotelsLayout` for hotels
- [ ] Match all visual elements to Figma (colors, spacing, fonts)
- [ ] Verify search fields match Figma (add ZIP code if needed)
- [ ] Test booking site logos and "Book Now" buttons
- [ ] Verify summary cards match Figma design

### **If Figma Shows Table:**
- [ ] Keep `hotels: 'B'` in `categoryPatterns.ts`
- [ ] Update table columns in `[slug].tsx` to match Figma
- [ ] Refactor results display to table format
- [ ] Update backend API if needed
- [ ] Match table styling to Figma (colors, borders, spacing)
- [ ] Test table functionality

### **If Figma Shows Hybrid:**
- [ ] Create custom `HotelsLayout.tsx`
- [ ] Implement table with expandable row functionality
- [ ] Match both table and card designs to Figma
- [ ] Test expand/collapse functionality

---

## 🎨 **Current Implementation Summary**

| Aspect | Current Implementation | Needs Figma Verification |
|--------|----------------------|-------------------------|
| **Layout** | ✅ Card-based vertical list | Verify if Figma matches |
| **Search Fields** | ✅ 4 fields (Destination, Guests, Dates) | Verify placeholders, add ZIP if needed |
| **ZIP Code** | ❌ Not included | Ask if Figma includes it |
| **Results Format** | ✅ Booking site cards | Verify card design matches Figma |
| **Visual Elements** | ✅ Images, logos, badges, buttons | Verify styling matches Figma |
| **Summary Cards** | ✅ 3 cards (Lowest, Average, Savings) | Verify if Figma shows these |

---

## 💡 **Next Steps**

1. **Ask your AI the questions above** to understand what Figma shows
2. **Document the answers** in this file
3. **Make decision** based on Scenario 1, 2, or 3 above
4. **Implement** the chosen approach
5. **Test** thoroughly to ensure it matches Figma design

---

## 📌 **Key Points to Remember**

- Current implementation is **card-based** (not table)
- Codebase expects **Pattern B (table)** - this is a mismatch
- Need to clarify with AI what Figma actually shows
- If Figma shows cards → Create custom layout (recommended)
- If Figma shows table → Refactor to table format
- ZIP code is currently **NOT** included - ask if Figma includes it
