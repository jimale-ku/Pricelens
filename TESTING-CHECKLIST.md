# Testing Checklist - Client Feedback Fixes

Test each item and check the box when confirmed working.

---

## HOME SCREEN / ALL RETAILERS

- [ ] **#1: All retailers price comparison search error**
  - Test: Search for a product in "All Retailers" section
  - Expected: No "search error" message
  - If timeout: Should show friendly message "Server may be starting up..."

- [ ] **#2: Featured categories same size**
  - Test: Go to home screen, check featured category boxes
  - Expected: All category boxes (including Clothing) are the same size
  - Check: Clothing box should not be smaller than others

- [ ] **#3: Price comparison boxes same size**
  - Test: Search for "Amazon Echo" in All Retailers, open product
  - Expected: All price comparison boxes are the same height
  - Check: No boxes should be taller/shorter than others

- [ ] **#4: More stores shown**
  - Test: Search for a popular product in All Retailers
  - Expected: Should show more than 3 stores (ideally 10+)
  - Note: If only 3 show, may be SerpAPI data limitation

- [ ] **#5: Headphones search - popular brands first**
  - Test: Search "headphones" in All Retailers
  - Expected: Apple, Bose, Sony brands appear first (not random brands)
  - Expected: More than 5 results shown
  - Expected: Store images appear next to prices

- [ ] **#6: "Search for a store" removed**
  - Test: Open any product comparison page
  - Expected: No "Search for a store" input field visible

- [ ] **#7: Zip code UI disabled**
  - Test: Open product comparison page
  - Expected: No zip code input or "Find store near you" option
  - Expected: No "Nearest Store" sort option

- [ ] **#8: Product image stays visible**
  - Test: Open a product from category page
  - Expected: Product image in top-left corner stays visible (doesn't disappear)
  - Check: Image should persist even when scrolling

- [ ] **#9: Ad space in All Retailers**
  - Test: Go to All Retailers section, scroll to bottom
  - Expected: Ad card appears at bottom of page

- [ ] **#10: Popular items logic**
  - Test: Check any category page
  - Expected: Popular items section shows products
  - Note: Logic is backend-based (sorted by search/view count)

---

## GROCERIES

- [ ] **#11: Groceries layout simplified**
  - Test: Go to Groceries category
  - Expected: No "Browse by category" section visible
  - Expected: Layout is Search bar → Popular items → Ad

- [ ] **#12: Search "Apple" - classic apples first**
  - Test: Search "Apple" in Groceries category
  - Expected: Classic apples (Gala, Honeycrisp, Fuji) appear first
  - Expected: Major retailers (Walmart, Target, Amazon) prioritized
  - Expected: Exotic apples (Miami Fruit, Hidden Rose) appear later

---

## ELECTRONICS

- [ ] **#13: Electronics layout simplified**
  - Test: Go to Electronics category
  - Expected: No "Browse by category" section visible
  - Expected: Layout is Search bar → Popular items → Ad

- [ ] **#14: "Lenovo computer" - multiple stores**
  - Test: Search "Lenovo computer" in Electronics
  - Expected: Should show prices from Best Buy, Amazon, Target, Walmart
  - Note: If only 1 store shows, may be SerpAPI data limitation

---

## KITCHEN

- [ ] **#15: Price comparison boxes same size**
  - Test: Go to Kitchen category, open any product
  - Expected: All price comparison boxes are the same height

- [ ] **#16: + icon works**
  - Test: Go to Kitchen category, click + icon on any product card
  - Expected: Success alert "Added to list" appears
  - Expected: Icon changes to checkmark temporarily

---

## HOME ACCESSORIES

- [ ] **#17: Product images show**
  - Test: Go to Home Accessories category
  - Expected: Product images appear on main page
  - Expected: If no image from backend, category placeholder shows

- [ ] **#18: Product details capitalized**
  - Test: Go to Home Accessories category
  - Expected: Product names are capitalized (e.g., "Decorative Pillow Set")
  - Expected: Category names are capitalized (e.g., "Home Accessories")

---

## CLOTHING, MEDICINE & HEALTH

- [ ] **#19: Images and capitalization**
  - Test: Go to Clothing category, then Medicine & Health
  - Expected: Product images appear on main page
  - Expected: Product names and categories are properly capitalized

---

## ADDITIONAL FIXES (Not in original list)

- [ ] **Delivery Speed sort option disabled**
  - Test: Open any product comparison page
  - Expected: No "Delivery Speed" sort option in dropdown
  - Expected: Only price sorting (automatic)

- [ ] **Images load immediately**
  - Test: Navigate to any category with products
  - Expected: Images load without delay
  - Expected: Category placeholder shows if no product image

---

## Testing Notes

- **Backend dependency:** Some fixes depend on backend returning correct data
- **SerpAPI limitations:** If only 1-3 stores show, may be SerpAPI data limitation
- **Render backend:** First request may take 50-60s if backend is sleeping (free tier)

---

**Total Items: 19 + 2 additional fixes**
