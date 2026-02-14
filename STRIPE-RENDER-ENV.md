# Stripe on Render – Environment Variables

## Confirm Stripe is wired in the app

The backend already uses Stripe for:

- **GET /subscriptions/config** – returns `{ stripeTestMode: true }` when the secret key starts with `sk_test_`
- **GET /subscriptions/plans** – returns subscription plans (Free, Basic, Pro, Premium)
- **POST /subscriptions/checkout** – creates a Stripe Checkout session (requires auth)
- **POST /subscriptions/webhook** – receives Stripe events (requires `STRIPE_WEBHOOK_SECRET`)

The Plus screen in the app calls `/subscriptions/config` and shows a “Stripe Test Mode” banner when `stripeTestMode` is true.

---

## Add these in Render

1. Go to **Render Dashboard** → your **Web Service** (e.g. pricelens-1) → **Environment**.
2. Add the variables below. Use your **test** keys for development; use **live** keys only for production.

### Required for subscriptions and Plus screen

| Key | Value | Notes |
|-----|--------|--------|
| **STRIPE_SECRET_KEY** | Your Stripe **secret** key | Test: `sk_test_...` from [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys). Never use the publishable key here. |

### Optional (for webhooks)

| Key | Value | Notes |
|-----|--------|--------|
| **STRIPE_WEBHOOK_SECRET** | Your webhook **signing secret** | Only needed if you use Stripe webhooks (e.g. subscription updated/canceled). From [Developers → Webhooks](https://dashboard.stripe.com/webhooks) → add endpoint `https://pricelens-1.onrender.com/subscriptions/webhook` → copy “Signing secret” (`whsec_...`). |

### Optional (for specific price IDs)

If you want to use Stripe Price IDs for Basic/Pro/Premium (so checkout uses your exact prices):

- **STRIPE_PRICE_ID_BASIC_MONTHLY**
- **STRIPE_PRICE_ID_BASIC_YEARLY**
- **STRIPE_PRICE_ID_PRO_MONTHLY**
- **STRIPE_PRICE_ID_PRO_YEARLY**
- **STRIPE_PRICE_ID_PREMIUM_MONTHLY**
- **STRIPE_PRICE_ID_PREMIUM_YEARLY**

If these are not set, the app still works; checkout uses the plan’s default price from the database.

---

## After saving

1. Click **Save Changes** in the Environment section.
2. **Redeploy** the service (e.g. **Manual Deploy** → **Deploy latest commit**) so the new env vars are loaded.
3. Wait until the deploy is **Live**.

---

## How to confirm Stripe is working

1. **Config (no auth):**  
   Open in a browser or with curl:
   ```text
   https://pricelens-1.onrender.com/subscriptions/config
   ```
   You should see JSON, e.g.:
   ```json
   { "stripeTestMode": true }
   ```
   If you see that, `STRIPE_SECRET_KEY` is set and Stripe is active (test mode if the key is `sk_test_...`).

2. **In the app:**  
   Open the **Plus** tab. If the backend returns `stripeTestMode: true`, you should see the “Stripe Test Mode — no real charges” (or similar) banner.

3. **Checkout (optional):**  
   Log in, go to Plus, pick a paid plan and start checkout. If a Stripe Checkout page opens (or redirects to it), Stripe is working end-to-end.

---

## Security

- Do **not** commit `.env` or paste secret keys in the repo or in chat.
- Add **STRIPE_SECRET_KEY** (and **STRIPE_WEBHOOK_SECRET** if used) only in **Render → Environment**.
- For production, create **live** keys in the Stripe Dashboard and set the **live** secret key on Render.
