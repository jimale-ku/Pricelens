# Quick iOS Setup for iPhone Users

## 🍎 If Client Has iPhone

### Option 1: TestFlight (Best - Recommended) ⭐

**Requirements:**
- Apple Developer Account ($99/year) - **You need this**
- Takes 24-48 hours to get approved

**Steps:**

1. **Sign up:** https://developer.apple.com/programs/
2. **Wait for approval** (24-48 hours)
3. **Build iOS app:**
   ```bash
   cd client
   eas build --profile preview-ios-testflight --platform ios
   ```
4. **Submit to TestFlight:**
   ```bash
   eas submit --platform ios
   ```
5. **Add client as tester** in App Store Connect
6. **Client installs TestFlight** app (free from App Store)
7. **Client installs your app** from TestFlight

**Result:** Professional app sharing, automatic updates, works without your laptop!

---

### Option 2: Ad-Hoc Build (Quick but Limited)

**Requirements:**
- Apple Developer Account ($99/year)
- Client's iPhone UDID

**Steps:**

1. **Get client's iPhone UDID:**
   - Settings → General → About → Identifier (UDID)
   - Or: https://udid.tech (client visits on iPhone)

2. **Add UDID** to Apple Developer Portal

3. **Build:**
   ```bash
   cd client
   eas build --profile preview --platform ios
   ```

4. **Share IPA:**
   - Upload to https://www.diawi.com
   - Send link to client
   - Client installs via Safari

**Limitation:** Max 100 devices, requires UDID for each

---

## 💰 Cost

**Both options require:** Apple Developer Account ($99/year)

**TestFlight is better** because:
- ✅ Easier to share
- ✅ Automatic updates
- ✅ Professional experience
- ✅ Up to 10,000 testers

---

## 🎯 Recommended Approach

**If client has iPhone:**

1. **Immediate:** Build Android APK (if they have Android too)
2. **Meanwhile:** Set up Apple Developer account
3. **Then:** Build TestFlight version
4. **Share:** TestFlight link

**Best of both worlds!**

---

## ⚡ Quick Commands

```bash
# Build for TestFlight
cd client
npm run build:ios:testflight

# Submit to TestFlight
npm run submit:ios

# Or manually:
eas build --profile preview-ios-testflight --platform ios
eas submit --platform ios
```

---

## 📱 Client Experience (TestFlight)

1. Receives email invitation
2. Opens "View in TestFlight"
3. Installs TestFlight app (if needed)
4. Taps "Install" in TestFlight
5. App works like normal app!

**No laptop needed!** ✅
