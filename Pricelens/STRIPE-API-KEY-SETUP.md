# Stripe API Key Setup

Your client shared a Stripe API key. Here’s what to do with it.

---

## ⚠️ Two different keys – you need the **secret** one for the server

| Key type       | Starts with | Where it goes        | Safe to share? |
|----------------|-------------|----------------------|----------------|
| **Publishable**| `pk_live_` or `pk_test_` | Client app only (if needed) | ✅ Yes – can be in app code |
| **Secret**     | `sk_live_` or `sk_test_` | **Server `.env` only**      | ❌ No – never in client or git |

- **If the key starts with `pk_`** → that’s the **publishable** key. It is **not** used for creating checkout sessions or charging cards on the server. You still need the **secret** key for the backend.
- **If the key starts with `sk_`** → that’s the **secret** key. That’s the one that goes in the server `.env`.

**What to ask your client:**  
*“I need the **Secret key** (starts with `sk_live_` for live or `sk_test_` for testing), not the Publishable key. In Stripe Dashboard it’s under Developers → API keys → ‘Secret key’ (click ‘Reveal’).”*

---

## How to get the test secret key (`sk_test_...`)

Test keys are **free** and available as soon as you (or your client) have a Stripe account.

1. Go to **[dashboard.stripe.com](https://dashboard.stripe.com)** and log in (use your client's account if they own the Stripe account).
2. Turn **Test mode** ON (toggle in the top-right – when ON, the dashboard uses test keys and test data only).
3. Go to **Developers** → **API keys** (or [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys)).
4. You'll see:
   - **Publishable key** – starts with `pk_test_...`
   - **Secret key** – starts with `sk_test_...` (hidden by default).
5. Click **Reveal** next to the **Secret key** and copy it. That's your `sk_test_...` key.

Use this test secret key in `STRIPE_SECRET_KEY` to try checkout with test cards (e.g. `4242 4242 4242 4242`) without moving real money. For real payments later, use the **live** secret key (`sk_live_...`) from the same page with Test mode OFF.

---

## 1. Add the **secret** key on the **server** (backend)

The **secret** key is used only on the server, never in the client app.

1. Get the **Secret key** (e.g. `sk_test_...` from the steps above, or `sk_live_...` from your client).
2. Open the **server** folder and create or edit the `.env` file (copy from `.env.example` if needed).
3. Add or update:

```env
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxx
```

- Use the **Secret key** (`sk_...`), **not** the Publishable key (`pk_...`).
- For testing: `sk_test_...`
- For live payments: `sk_live_...`

4. Restart the server so it picks up the new env var.

After this, the backend can create checkout sessions and handle subscriptions. You may still add **Stripe Price IDs** and a **webhook secret** for the full flow.

---

## 2. Optional: Webhook secret (recommended for production)

So Stripe can notify your server when a payment succeeds:

1. In [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks** → **Add endpoint**.
2. Endpoint URL: `https://your-backend-url.com/subscriptions/webhook`  
   (e.g. `https://your-app.railway.app/subscriptions/webhook`).
3. Select events:  
   `checkout.session.completed`,  
   `customer.subscription.created`,  
   `customer.subscription.updated`,  
   `customer.subscription.deleted`.
4. Copy the **Signing secret** (starts with `whsec_`).
5. In server `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

Restart the server again.

---

## 3. Optional: Price IDs (for specific plans)

To charge for **Basic / Pro / Premium** plans:

1. In Stripe Dashboard → **Products** → create products (e.g. “Basic”, “Pro”, “Premium”).
2. For each product, add **Prices** (e.g. monthly and yearly).
3. Copy each Price ID (starts with `price_`).
4. In server `.env`:

```env
STRIPE_PRICE_ID_BASIC_MONTHLY=price_xxxx
STRIPE_PRICE_ID_BASIC_YEARLY=price_xxxx
STRIPE_PRICE_ID_PRO_MONTHLY=price_xxxx
STRIPE_PRICE_ID_PRO_YEARLY=price_xxxx
STRIPE_PRICE_ID_PREMIUM_MONTHLY=price_xxxx
STRIPE_PRICE_ID_PREMIUM_YEARLY=price_xxxx
```

5. Run the seed so the DB has these price IDs:

```bash
cd server
npx prisma db seed
```

If these are not set, the app can still create checkout sessions if the database `SubscriptionPlan` rows already have `stripePriceId` / `stripePriceIdYearly` set (e.g. from a previous seed with env vars).

---

## 4. Client app: publishable vs secret

- **Publishable key (`pk_...`)** – Safe to use in the client (e.g. Stripe.js, Payment Sheet). Your app does **not** need it for the current flow: the app only calls your backend, and the backend opens Stripe Checkout.
- **Secret key (`sk_...`)** – Must **never** be in the client or in git. Only in server `.env` as `STRIPE_SECRET_KEY`.

---

## 5. Summary

| What you have         | Starts with | Where it goes                          |
|-----------------------|------------|----------------------------------------|
| **Secret key** (need this for server) | `sk_`      | Server `.env` → `STRIPE_SECRET_KEY`    |
| Publishable key       | `pk_`      | Client only if you add Stripe.js later |
| Webhook secret        | `whsec_`   | Server `.env` → `STRIPE_WEBHOOK_SECRET`|
| Price IDs             | `price_`   | Server `.env` (optional) or DB seed   |

**Minimum to get payments working:** set **`STRIPE_SECRET_KEY`** (the **secret** key, `sk_...`) in the server `.env` and restart the server. The key that starts with `pk_` is the publishable key and is **not** used for `STRIPE_SECRET_KEY`.
