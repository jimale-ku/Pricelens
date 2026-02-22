# 🔒 Stripe Test Keys Setup Guide

## ⚠️ CRITICAL: Never Use Live Keys for Testing!

**Using `pk_live_...` or `sk_live_...` keys will charge REAL MONEY!**

---

## 🔑 Understanding Stripe Keys

### Two Types of Keys:

1. **Publishable Keys** (`pk_test_...` or `pk_live_...`)
   - Used in **frontend/client** code
   - Safe to expose publicly
   - Starts with `pk_`

2. **Secret Keys** (`sk_test_...` or `sk_live_...`)
   - Used in **backend/server** code
   - **NEVER expose publicly**
   - Starts with `sk_`

### Two Environments:

1. **Test Mode** (`pk_test_...` / `sk_test_...`)
   - ✅ **Use for development/testing**
   - ✅ **No real charges**
   - ✅ **Free to use**
   - ✅ **Test cards work**

2. **Live Mode** (`pk_live_...` / `sk_live_...`)
   - ❌ **Only for production**
   - ❌ **Charges REAL money**
   - ❌ **Never use for testing**

---

## 🎯 What You Need to Do

### Step 1: Get Test Keys from Stripe Dashboard

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com
2. **Make sure you're in TEST MODE** (toggle in top right should say "Test mode")
3. **Go to**: Developers → API keys
4. **Copy these keys**:
   - **Publishable key**: `pk_test_...` (for frontend)
   - **Secret key**: `sk_test_...` (for backend) ← **This is what you need!**

### Step 2: Update Your `.env` File

**Current (WRONG):**
```env
STRIPE_SECRET_KEY=pk_live_51STOiJBOX0c6JlshEjzFYucNLqJ3oUNDC3p0r8B3IrjjonUM1T5eKSgMl5lmoeFOvOBO2M0eIXPHfdcI0VYUsC3P00Rk2eQGS5
```

**Should be (CORRECT):**
```env
# Use TEST secret key (sk_test_...) for development
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE

# Optional: Webhook secret for testing (get from Stripe Dashboard → Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

**Important Notes:**
- ✅ Use `sk_test_...` (test secret key) for development
- ✅ Your backend code expects `STRIPE_SECRET_KEY` (not publishable key)
- ❌ Never use `pk_live_...` or `sk_live_...` for testing

---

## 🧪 Testing Stripe Functionality

### Test Cards (Use in Test Mode Only)

Stripe provides test card numbers that work with test keys:

**Successful Payment:**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Declined Payment:**
```
Card Number: 4000 0000 0000 0002
```

**More Test Cards**: https://stripe.com/docs/testing

### How to Test:

1. **Use test keys** (`sk_test_...`)
2. **Use test card numbers** (like `4242 4242 4242 4242`)
3. **No real charges** will be made
4. **Check Stripe Dashboard** → Payments (in Test mode) to see test transactions

---

## 📋 Complete Setup Checklist

### For Development/Testing:

- [ ] Get `sk_test_...` secret key from Stripe Dashboard (Test mode)
- [ ] Update `server/.env` with `STRIPE_SECRET_KEY=sk_test_...`
- [ ] Get `pk_test_...` publishable key (for frontend if needed)
- [ ] Test with test card `4242 4242 4242 4242`
- [ ] Verify no real charges in Stripe Dashboard (should show test transactions)

### For Production (Later):

- [ ] Switch Stripe Dashboard to **Live mode**
- [ ] Get `sk_live_...` secret key
- [ ] Update production `.env` with `STRIPE_SECRET_KEY=sk_live_...`
- [ ] Get `pk_live_...` publishable key for frontend
- [ ] Set up webhook endpoint with live webhook secret
- [ ] Test with small real transaction first

---

## 🔍 How to Verify You're Using Test Keys

### Check Your Code:

1. **Backend** (`server/.env`):
   ```env
   STRIPE_SECRET_KEY=sk_test_...  ✅ Correct
   # NOT: pk_live_... ❌ Wrong
   # NOT: sk_live_... ❌ Wrong (for testing)
   ```

2. **Check Stripe Dashboard**:
   - Make sure toggle says "Test mode"
   - Test transactions will appear in Payments section
   - No real money will be charged

### Test It:

1. Start your backend: `cd server && npm run start:dev`
2. Check logs - should see: `✅ Stripe initialized`
3. Make a test payment with card `4242 4242 4242 4242`
4. Check Stripe Dashboard → Payments (Test mode) - should see test transaction

---

## 🚨 Common Mistakes

### ❌ Wrong:
```env
STRIPE_SECRET_KEY=pk_live_51STOiJBOX0c6JlshEjzFYucNLqJ3oUNDC3p0r8B3IrjjonUM1T5eKSgMl5lmoeFOvOBO2M0eIXPHfdcI0VYUsC3P00Rk2eQGS5
```
- Using publishable key (`pk_`) instead of secret key (`sk_`)
- Using live key (`live`) instead of test key (`test`)

### ✅ Correct:
```env
STRIPE_SECRET_KEY=<your test secret key from Stripe Dashboard>
```
Use the key that starts with `sk_test_` from Stripe Dashboard → Developers → API keys.
- Using secret key (`sk_`)
- Using test key (`test`)

---

## 📚 Additional Resources

- **Stripe Test Cards**: https://stripe.com/docs/testing
- **Stripe API Keys**: https://stripe.com/docs/keys
- **Stripe Dashboard**: https://dashboard.stripe.com/test/apikeys

---

## 💡 Quick Answer to Your Question

**Q: Can I use `pk_live_...` to test if Stripe is functional?**

**A: NO! Here's why:**
1. ❌ `pk_live_...` is a **publishable key** - your backend needs a **secret key** (`sk_...`)
2. ❌ `pk_live_...` is a **live key** - will charge **real money**
3. ✅ Use `sk_test_...` (test secret key) for testing
4. ✅ Test keys are **free** and **won't charge real money**

**To test Stripe:**
1. Get `sk_test_...` from Stripe Dashboard (Test mode)
2. Add to `server/.env`: `STRIPE_SECRET_KEY=sk_test_...`
3. Use test card `4242 4242 4242 4242` for payments
4. Check Stripe Dashboard (Test mode) to see test transactions

---

## 🎯 Next Steps

1. **Get test keys** from Stripe Dashboard (Test mode)
2. **Update** `server/.env` with `STRIPE_SECRET_KEY=sk_test_...`
3. **Test** with test card `4242 4242 4242 4242`
4. **Verify** no real charges (check Stripe Dashboard in Test mode)
5. **Keep live keys** (`pk_live_...` / `sk_live_...`) for production only
