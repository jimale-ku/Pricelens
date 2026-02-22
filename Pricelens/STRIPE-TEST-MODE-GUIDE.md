# Stripe Test Mode – How to Enable & Use

## Where to find Test Mode in Stripe

### 1. Stripe Dashboard

1. Go to **https://dashboard.stripe.com**
2. Log in.
3. In the **top-right** you’ll see a toggle: **"Test mode"** (or "Live mode").
4. Switch it to **Test mode** (it turns orange when on).

When Test mode is ON:
- All data is test data.
- No real money is charged.
- You use **test API keys** (see below).

---

## Use test API keys in your app

### 2. Get test keys

1. In Stripe Dashboard, make sure **Test mode** is ON (top-right).
2. Go to **Developers → API keys**.
3. Copy:
   - **Secret key** (starts with `sk_test_...`) → use in **server `.env`**
   - Publishable key (starts with `pk_test_...`) → only if you use Stripe.js in the client

### 3. Set server `.env`

In `server/.env`:

```env
# Test mode – no real charges (paste keys from Stripe Dashboard)
STRIPE_SECRET_KEY=<your sk_test_... key>
STRIPE_WEBHOOK_SECRET=<your whsec_... key>
```

- Use the **test** secret key (`sk_test_...`).
- Use the **test** webhook signing secret (`whsec_...`) from Developers → Webhooks (with Test mode ON).

### 4. Test webhook (for local dev)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli  
2. Login: `stripe login`  
3. Forward events to your server:  
   `stripe listen --forward-to localhost:3000/subscriptions/webhook`  
4. Copy the `whsec_...` from the CLI and put it in `STRIPE_WEBHOOK_SECRET` in `.env`.

---

## See “Test mode” in the app

When the server uses a **test** secret key (`sk_test_...`), the Plus screen shows:

**“Stripe Test Mode — no real charges”** (orange banner at the top).

So:
- **Dashboard:** Turn **Test mode** ON (top-right).
- **Backend:** Use `sk_test_...` (and test `whsec_...`) in `server/.env`.
- **App:** You’ll see the test mode banner on the Plus tab.

No real payments will be made while test keys are used.
