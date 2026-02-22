# Testing Guide - Price Alerts & Barcode Scanner

## 🧪 Testing Checklist

### Prerequisites
1. ✅ Backend server is running (`cd server && npm run start:dev`)
2. ✅ Frontend app is running (`cd client && npm start`)
3. ✅ You're logged in (have JWT token)

---

## 1. Price Drop Alerts Testing

### Test Steps:

#### A. Access Alerts Screen
1. Open the app in Expo Go
2. Go to **Plus** tab (bottom nav)
3. Scroll down to **"Price Drop Alerts"** section
4. Tap **"Manage Alerts"** button
5. ✅ Should navigate to Alerts screen

#### B. Create an Alert
1. On Alerts screen, tap the **"+"** button (top right)
2. You'll see a modal with:
   - Product ID field
   - Target Price field
3. **To get a Product ID:**
   - Go to any category (e.g., Groceries)
   - Tap on a product card
   - Look at the URL or check browser DevTools Network tab when loading product
   - Copy the product ID (UUID format)
4. Enter:
   - **Product ID**: `[paste product ID here]`
   - **Target Price**: `19.99` (or any price lower than current)
5. Tap **"Create Alert"**
6. ✅ Should show success message
7. ✅ Alert should appear in the list

#### C. View Alerts
1. ✅ Alert card should show:
   - Product name
   - Current lowest price
   - Target price
   - Store name with current price
2. ✅ If price reached target, should show "TRIGGERED" badge

#### D. Edit Alert
1. Tap the **pencil icon** on an alert
2. Enter new target price
3. Tap **"Update"**
4. ✅ Alert should update with new target price

#### E. Delete Alert
1. Tap the **trash icon** on an alert
2. Confirm deletion
3. ✅ Alert should be removed from list

#### F. Refresh
1. Pull down to refresh
2. ✅ Alerts should reload from backend

---

## 2. Barcode Scanner Testing

### Test Steps:

#### A. Access Scanner Screen
1. Go to **Plus** tab
2. Scroll to **"Barcode Scanner"** section
3. Tap **"Scan Barcode"** button
4. ✅ Should navigate to Barcode Scanner screen

#### B. Manual Barcode Entry
1. On Scanner screen, you'll see:
   - Manual entry field
   - "Compare Prices" button
   - Camera scanner (disabled, coming soon)
2. **Test with a real barcode:**
   - Find a product with a barcode (UPC/EAN)
   - Common test barcodes:
     - `0123456789012` (13 digits - EAN-13)
     - `123456789012` (12 digits - UPC-A)
     - `01234567890` (11 digits)
   - Or use a real product barcode from your home
3. Enter barcode in the field (8-14 digits)
4. Tap **"Compare Prices"**
5. ✅ Should search for product
6. ✅ If found: Navigate to product comparison page
7. ✅ If not found: Show "Not Found" alert

#### C. Error Handling
1. Try entering:
   - Empty field → Should show error
   - Less than 8 digits → Should show error
   - More than 14 digits → Should show error
   - Non-numeric → Should be filtered to numbers only
2. ✅ All should show appropriate error messages

#### D. Camera Scanner (Placeholder)
1. Tap **"Scan with Camera"** button
2. ✅ Should show alert saying "Coming soon"

---

## 🐛 Common Issues & Fixes

### Issue: "Login Required" when accessing Alerts
**Fix:** Make sure you're logged in. Check if JWT token is stored.

### Issue: "Product not found" when creating alert
**Fix:** 
- Make sure Product ID is correct (UUID format)
- Product must exist in database
- Try searching for a product first, then use its ID

### Issue: Barcode scanner says "Not Found"
**Fix:**
- Barcode might not be in database
- Try a different barcode
- Check backend logs to see if API is being called
- Verify backend supports GTIN search

### Issue: Navigation fails after barcode scan
**Fix:**
- Check console logs for route errors
- Make sure product has category slug
- Verify compare API returns product name

### Issue: Alerts don't refresh
**Fix:**
- Pull down to refresh
- Check network tab for API calls
- Verify backend `/alerts` endpoint is working

---

## 📝 Test Data

### Sample Product IDs (if you have products in DB):
- Check your database: `SELECT id, name FROM "Product" LIMIT 5;`
- Or create a product via API first

### Sample Barcodes to Test:
- `0123456789012` (EAN-13 format)
- `123456789012` (UPC-A format)
- `01234567890` (11 digits)

---

## ✅ Success Criteria

### Price Alerts:
- ✅ Can create alert with valid product ID
- ✅ Can view list of alerts
- ✅ Can edit target price
- ✅ Can delete alert
- ✅ Shows current price vs target
- ✅ Shows "TRIGGERED" when price reached

### Barcode Scanner:
- ✅ Can enter barcode manually
- ✅ Validates barcode format (8-14 digits)
- ✅ Searches for product using GTIN
- ✅ Navigates to comparison page if found
- ✅ Shows error if not found
- ✅ Camera placeholder shows "Coming soon"

---

## 🔍 Debugging Tips

1. **Check Network Requests:**
   - Open React Native Debugger
   - Check Network tab
   - Verify API calls are being made
   - Check response data

2. **Check Console Logs:**
   - Look for errors in Metro bundler
   - Check backend logs for API errors
   - Verify JWT token is being sent

3. **Test Backend Directly:**
   ```bash
   # Test alerts endpoint
   curl -H "Authorization: Bearer YOUR_JWT" http://localhost:3000/alerts
   
   # Test barcode search
   curl "http://localhost:3000/products/compare/multi-store?q=0123456789012&searchType=gtin"
   ```

4. **Verify Database:**
   - Check if products exist
   - Check if alerts are being created
   - Verify product IDs match

---

## 📞 Next Steps After Testing

Once both features are tested and working:
1. ✅ Note any bugs or issues
2. ✅ Test edge cases (empty states, errors, etc.)
3. ✅ Verify UI/UX is smooth
4. ✅ Then we'll build Coupon Finder & Cashback backends
