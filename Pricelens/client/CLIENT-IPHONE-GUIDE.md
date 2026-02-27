# Getting PriceLens on your iPhone – guide for your client

Use the option that fits how you want to distribute the app.

---

## Option 1: Quick testing with Expo Go (no App Store, no Apple Developer account)

**Best for:** Quick demos and testing. The app runs inside “Expo Go”; it’s not a standalone icon like a normal app.

**What you do:**
1. On your Mac, in the project folder run:  
   `cd Pricelens/client && npx expo start --tunnel`
2. When the QR code appears, share the **project URL** (or a short link to it) with your client.

**What your client does (iPhone):**
1. Open the **App Store** on the iPhone and install **Expo Go** (free).
2. Open **Safari** and go to the link you sent (or open the link from Expo Go if you use a QR code).
3. When prompted, choose **Open in Expo Go**. The app loads inside Expo Go.

**Limitation:** They must have Expo Go installed and open the link from there. Not a standalone “PriceLens” icon.

---

## Option 2: TestFlight (real app on iPhone, beta testing)

**Best for:** Giving the client a real installable app (like a normal iPhone app) without publishing to the public App Store. This is the **easiest “real app”** path for a client with an iPhone.

**What you need:** An **Apple Developer Program** account ($99/year) and your client’s **Apple ID email**.

**What you do:**
1. Build the iOS app for TestFlight:
   ```bash
   cd Pricelens/client
   eas build --profile preview-ios-testflight --platform ios
   ```
2. When the build finishes, submit it to TestFlight:
   ```bash
   eas submit --platform ios --latest
   ```
   (Follow the prompts; use the build you just made.)
3. In **App Store Connect** (appstoreconnect.apple.com) → your app → **TestFlight** → add your client’s **email** as an external tester. They’ll get an invite email.

**What your client does (iPhone):**
1. Install **TestFlight** from the App Store (free).
2. Open the **invite email** from Apple on the iPhone and tap the link (or “View in TestFlight”).
3. In TestFlight, tap **Install** for PriceLens. The app installs like a normal app and appears on the home screen.

After that, when you publish updates (`eas update` or new TestFlight builds), they can update from TestFlight. No need to re-send links.

---

## Option 3: Publish to the App Store (public release)

**Best for:** When testing is done and you want anyone to download “PriceLens” from the App Store.

**What you do:**
1. Build for production and submit for review:
   ```bash
   cd Pricelens/client
   eas build --profile production --platform ios
   # when build completes:
   eas submit --platform ios --latest
   ```
2. In App Store Connect, complete the listing (screenshots, description, etc.) and submit for **App Review**.

**What your client does:** After the app is approved, they open the **App Store**, search for **PriceLens**, and tap **Get** / **Install** like any other app.

---

## Summary

| Goal                         | Easiest path for your client (iPhone) |
|-----------------------------|----------------------------------------|
| Quick test / demo            | **Option 1** – Expo Go + link you send |
| Real app, beta testing      | **Option 2** – You add them in TestFlight; they install via TestFlight |
| Public release              | **Option 3** – Publish to App Store; they search and install |

For “client is testing and we might publish”: use **TestFlight (Option 2)** so they get a real app on their iPhone and you can push updates without going through full App Review each time.
