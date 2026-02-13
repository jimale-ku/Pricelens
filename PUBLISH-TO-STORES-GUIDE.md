# Publishing to Google Play Store & Apple App Store

## 🎯 Overview

**You DON'T need AWS!** Your backend is already on Render, which works perfectly for production.

**What you need:**
- ✅ Backend: Already on Render (`https://pricelens-1.onrender.com`) ✅
- ✅ Google Play Console: $25 one-time fee (Android)
- ✅ Apple Developer Account: $99/year (iOS)

---

## 📱 Google Play Store (Android)

### Step 1: Create Google Play Developer Account

1. Go to: https://play.google.com/console/signup
2. Pay **$25 one-time fee** (lifetime)
3. Complete account setup

### Step 2: Prepare App for Production

**Update `app.json` if needed:**
- App name, version, description
- Icons, splash screen
- Privacy policy URL (required!)

### Step 3: Build Production APK/AAB

**Option A: Using EAS Build (Recommended)**

```bash
cd client
eas build --profile production --platform android
```

**This creates:**
- **AAB (Android App Bundle)** - preferred by Google Play
- Or APK if you specify

### Step 4: Create App in Google Play Console

1. Go to: https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - App name: "PriceLens"
   - Default language: English
   - App or game: App
   - Free or paid: Free
   - Accept terms

### Step 5: Complete Store Listing

**Required:**
- ✅ App name
- ✅ Short description (80 chars)
- ✅ Full description (4000 chars)
- ✅ App icon (512x512)
- ✅ Feature graphic (1024x500)
- ✅ Screenshots (at least 2)
- ✅ Privacy policy URL (REQUIRED!)

**Privacy Policy:**
- Create a simple privacy policy page
- Host it (GitHub Pages, Render, etc.)
- Add URL in Play Console

### Step 6: Upload Build

1. Go to "Production" → "Create new release"
2. Upload AAB file from EAS Build
3. Add release notes
4. Review and roll out

### Step 7: Submit for Review

1. Complete content rating questionnaire
2. Set up pricing (Free)
3. Select countries
4. Submit for review

**Review time:** 1-7 days typically

---

## 🍎 Apple App Store (iOS)

### Step 1: Apple Developer Account

1. Sign up: https://developer.apple.com/programs/
2. Pay **$99/year**
3. Wait for approval (24-48 hours)

### Step 2: Prepare App for Production

**Update `app.json`:**
- Bundle identifier: `com.pricelens.app` (already set ✅)
- Version number
- Icons, splash screen
- Privacy policy URL

### Step 3: Build Production IPA

```bash
cd client
eas build --profile production --platform ios
```

### Step 4: Submit to App Store Connect

**Option A: Using EAS Submit (Easiest)**

```bash
eas submit --platform ios
```

**Option B: Manual Upload**

1. Download IPA from EAS Build
2. Use Transporter app (Mac) or Xcode
3. Upload to App Store Connect

### Step 5: Create App in App Store Connect

1. Go to: https://appstoreconnect.apple.com
2. Click "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: "PriceLens"
   - Primary language: English
   - Bundle ID: `com.pricelens.app`
   - SKU: `pricelens-001`

### Step 6: Complete App Store Listing

**Required:**
- ✅ App name
- ✅ Subtitle
- ✅ Description
- ✅ Keywords
- ✅ Support URL
- ✅ Privacy policy URL (REQUIRED!)
- ✅ App icon (1024x1024)
- ✅ Screenshots (required for each device size)
- ✅ App preview videos (optional but recommended)

### Step 7: Submit for Review

1. Select build from TestFlight
2. Answer export compliance questions
3. Add app review information
4. Submit for review

**Review time:** 1-3 days typically

---

## 🔧 EAS Build Configuration

Your `eas.json` already has production profile:

```json
{
  "build": {
    "production": {
      "distribution": "store"
    }
  }
}
```

**Build commands:**

```bash
# Android (Google Play)
eas build --profile production --platform android

# iOS (App Store)
eas build --profile production --platform ios

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

---

## 💰 Costs Summary

| Service | Cost | Frequency |
|---------|------|-----------|
| **Google Play** | $25 | One-time (lifetime) |
| **Apple App Store** | $99 | Per year |
| **Backend (Render)** | Free tier available | Per month |
| **EAS Build** | Free tier available | Per build |

**Total first year:** ~$124 (Android) or ~$199 (iOS) or ~$223 (both)

---

## 🚀 Production Checklist

### Before Publishing:

- [ ] **Backend deployed** ✅ (Already on Render)
- [ ] **API URL set** ✅ (`https://pricelens-1.onrender.com`)
- [ ] **Privacy policy created** (REQUIRED!)
- [ ] **App icons** (all sizes)
- [ ] **Screenshots** (at least 2-5)
- [ ] **App description** written
- [ ] **Version number** set in `app.json`
- [ ] **Bundle ID** configured
- [ ] **Test thoroughly** on real devices

### Privacy Policy Requirements:

**Must include:**
- What data you collect
- How you use data
- Third-party services (Render, Serper API, etc.)
- User rights
- Contact information

**Host it:**
- GitHub Pages (free)
- Render static site (free)
- Your own domain

---

## 📋 Quick Commands

```bash
# Build for production
cd client

# Android
eas build --profile production --platform android

# iOS
eas build --profile production --platform ios

# Submit to stores
eas submit --platform android
eas submit --platform ios

# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]
```

---

## 🔄 Update Process

**When you update the app:**

1. **Update version** in `app.json`
2. **Build new version:**
   ```bash
   eas build --profile production --platform android
   ```
3. **Submit to store:**
   ```bash
   eas submit --platform android
   ```
4. **Users get automatic update** via Play Store/App Store

---

## 🌐 Backend (Render) - Production Ready

**Your backend is already production-ready:**

- ✅ Deployed on Render
- ✅ HTTPS enabled
- ✅ Persistent URL: `https://pricelens-1.onrender.com`
- ✅ Environment variables configured
- ✅ Database (PostgreSQL) connected

**No AWS needed!** Render works perfectly for production apps.

**If you need to scale later:**
- Render has paid plans for more resources
- Or migrate to AWS/Google Cloud if needed
- But Render free tier is fine for starting out

---

## 📱 Store Listing Tips

### Google Play Store:

**Good description includes:**
- What the app does
- Key features
- Benefits to users
- Screenshots showing UI

**Screenshots:**
- At least 2 required
- Show main features
- Use real device screenshots

### Apple App Store:

**Good description includes:**
- Compelling headline
- Feature list
- Benefits
- Keywords for search

**Screenshots:**
- Required for each device size (iPhone, iPad)
- Show key features
- Use real device screenshots

---

## 🎯 Recommended Timeline

**Week 1:**
- Set up Google Play Developer account ($25)
- Set up Apple Developer account ($99)
- Create privacy policy
- Prepare screenshots

**Week 2:**
- Build production versions
- Complete store listings
- Submit for review

**Week 3:**
- Address any review feedback
- App goes live! 🎉

---

## 💡 Pro Tips

1. **Start with Android** (cheaper, faster review)
2. **Test thoroughly** before submitting
3. **Privacy policy is mandatory** - create it first
4. **Screenshots matter** - make them look professional
5. **Update regularly** - users expect updates
6. **Monitor reviews** - respond to user feedback

---

## 🚨 Common Issues

**Google Play:**
- Privacy policy missing → Rejected
- Screenshots too small → Rejected
- App crashes → Rejected

**Apple App Store:**
- Privacy policy missing → Rejected
- Missing screenshots → Rejected
- App crashes → Rejected
- Guideline violations → Rejected

**Solution:** Test thoroughly, follow guidelines, provide all required info!

---

## 📞 Resources

- **Google Play Console:** https://play.google.com/console
- **App Store Connect:** https://appstoreconnect.apple.com
- **EAS Build Docs:** https://docs.expo.dev/build/introduction/
- **Privacy Policy Generator:** https://www.privacypolicygenerator.info/

---

## ✅ Summary

**You DON'T need AWS!**

- ✅ Backend: Render (already set up)
- ✅ Android: Google Play ($25 one-time)
- ✅ iOS: App Store ($99/year)
- ✅ Build: EAS Build (free tier available)
- ✅ Submit: EAS Submit (automated)

**Your app can be in stores in 1-2 weeks!** 🚀
