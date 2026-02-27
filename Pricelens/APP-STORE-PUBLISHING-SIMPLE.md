# What You Need to Publish the App (Simple Guide)

Two lists: one for **iOS (App Store)** and one for **Android (Play Store)**.

---

## iOS (App Store)

### 1. Apple Developer Account
- Sign up at [developer.apple.com](https://developer.apple.com)
- **Cost:** $99/year (Apple charges this)
- If it’s a **company** app: you need an Apple Developer **Organization** account and a **D-U-N-S number** (free from Apple/D&B)
- Turn on **two-factor authentication** on the Apple ID used for this account

### 2. What We Need From You
- **App name** (as it appears in the store and on the phone)
- **App icon** — one image, **1024×1024 pixels**, no rounded corners (Apple does that)
- **Screenshots** — we’ll tell you the exact sizes; you can send phone screenshots and we’ll resize if needed
- **Short description** of the app (for the store listing)
- **Support URL** — e.g. your website or a simple “Contact us” page
- **Privacy Policy URL** — required by Apple (one webpage explaining what data the app collects)

### 3. You’ll Need to Do in App Store Connect
- Accept the **Apple Developer Program License Agreement**
- Add **bank and tax info** so Apple can pay you if you ever sell the app or in‑app purchases
- When we send the build, you (or we with your permission) submit it for **review**

**Summary:** Pay $99/year, get the account, give us name/icon/screenshots/descriptions and a privacy policy URL. We handle the technical build and can guide you through submitting.

---

## Android (Play Store)

### 1. Google Play Developer Account
- Sign up at [play.google.com/console](https://play.google.com/console)
- **Cost:** One-time $25 registration fee (Google charges this)
- Use a **Google account** that you’ll keep for the long term (e.g. your company Gmail)

### 2. What We Need From You
- **App name** (same as iOS or your choice for Android)
- **App icon** — **512×512 pixels** (we can reuse the 1024×1024 from iOS and resize)
- **Screenshots** — we’ll tell you the exact sizes; you can send phone screenshots and we’ll resize if needed
- **Short description** (for the store listing)
- **Full description** (longer text about the app)
- **Support email** — where users can contact you
- **Privacy Policy URL** — required by Google (same page as iOS is fine)

### 3. You’ll Need to Do in Play Console
- Complete your **developer profile** (name, contact)
- Set up **payment profile** if you will sell the app or use in‑app purchases (bank/tax details)
- When we send the build, you (or we with your permission) upload it and send it for **review**

**Summary:** Pay $25 once, create the account, give us name/icon/screenshots/descriptions and a privacy policy URL. We handle the technical build and can guide you through submitting.

---

## Same for Both (You Provide Once)

| Item | Notes |
|------|--------|
| **Privacy Policy** | One webpage URL. Say what data the app collects (e.g. account, usage) and how you use it. |
| **App icon** | One high-res image; we use it for both stores (sizes above). |
| **Company / contact info** | Legal name, address, support email, website — for store listings and legal. |

---

## Backend (Already Decided)

- **Server:** On Render (you or we keep it running).
- **Database:** Must be **online** (e.g. Render PostgreSQL or another cloud DB), not on a single computer, so the app works for all users after release.

---

## Quick Checklist

**iOS**
- [ ] Apple Developer account ($99/year)
- [ ] App name, icon (1024×1024), screenshots, description, support URL
- [ ] Privacy Policy URL
- [ ] Bank/tax in App Store Connect (if selling or IAP)

**Android**
- [ ] Google Play Developer account ($25 once)
- [ ] App name, icon (512×512), screenshots, short + full description
- [ ] Privacy Policy URL + support email
- [ ] Payment profile in Play Console (if selling or IAP)

**Both**
- [ ] Backend and database live on the cloud (e.g. Render + cloud DB)

That’s it. Once you have the accounts and the items above, we can get the app built and submitted for both stores.
