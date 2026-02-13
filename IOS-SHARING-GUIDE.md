# iOS/iPhone Sharing Guide - EAS Build

## 🍎 For iPhone Users

If your client uses an iPhone, you have **3 options**:

---

## Option 1: TestFlight (Recommended - Best Experience) ⭐

**Best for:** Professional sharing, automatic updates, easy installation

### Requirements:
- ✅ Apple Developer Account ($99/year) - **You need this**
- ✅ Client needs TestFlight app (free from App Store)

### Steps:

#### 1. Get Apple Developer Account
- Sign up at: https://developer.apple.com/programs/
- Cost: $99/year
- Takes 24-48 hours for approval

#### 2. Configure EAS for iOS

```bash
cd client
eas build:configure
```

Select:
- **Platform:** iOS
- **Build profile:** preview (or production)
- **Distribution:** App Store (for TestFlight)

#### 3. Build for iOS

```bash
eas build --profile preview --platform ios
```

#### 4. Submit to TestFlight

After build completes:

```bash
eas submit --platform ios
```

Or manually:
1. Go to https://appstoreconnect.apple.com
2. Create app (if first time)
3. Upload build via Xcode or Transporter
4. Add to TestFlight

#### 5. Add Testers

In App Store Connect:
1. Go to TestFlight tab
2. Add internal testers (up to 100)
3. Add external testers (up to 10,000) - requires App Review
4. Send invitation email to client

#### 6. Client Installation

**Client receives email:**
1. Opens email on iPhone
2. Taps "View in TestFlight"
3. Installs TestFlight app (if not installed)
4. Taps "Install" in TestFlight
5. App installs like normal app!

**Benefits:**
- ✅ Professional experience
- ✅ Automatic updates (you rebuild, they get notified)
- ✅ Works without your laptop
- ✅ Easy to share with many people
- ✅ No "Unknown Sources" needed

---

## Option 2: Ad-Hoc Build (Limited Sharing)

**Best for:** Quick sharing to specific devices (up to 100)

### Requirements:
- ✅ Apple Developer Account ($99/year)
- ✅ Client's iPhone UDID (device identifier)

### Steps:

#### 1. Get Client's iPhone UDID

**Client sends you:**
- iPhone Settings → General → About → Scroll to "Identifier (UDID)"
- Or use: https://udid.tech (client visits on iPhone)

#### 2. Add UDID to Apple Developer Portal

1. Go to: https://developer.apple.com/account/resources/devices/list
2. Click "+" → Register device
3. Enter UDID and name
4. Save

#### 3. Build Ad-Hoc

Update `eas.json`:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false,
        "buildConfiguration": "Release"
      }
    }
  }
}
```

Build:
```bash
eas build --profile preview --platform ios
```

#### 4. Share IPA File

After build:
1. Download IPA from Expo dashboard
2. Upload to: https://www.diawi.com (free file hosting for iOS)
3. Send link to client

#### 5. Client Installation

**Client on iPhone:**
1. Opens link in Safari (not Chrome!)
2. Taps "Install"
3. Goes to Settings → General → VPN & Device Management
4. Trusts your developer certificate
5. App installs!

**Limitations:**
- ⚠️ Limited to 100 devices
- ⚠️ Requires UDID for each device
- ⚠️ Certificate expires after 1 year
- ⚠️ More complex than TestFlight

---

## Option 3: Expo Go (Not Recommended for Sharing)

**Why not:** Requires your laptop running (defeats the purpose)

---

## 💰 Cost Comparison

| Method | Cost | Max Users | Laptop Needed? | Best For |
|--------|------|-----------|----------------|----------|
| **TestFlight** | $99/year | 10,000 | ❌ No | Professional sharing |
| **Ad-Hoc** | $99/year | 100 | ❌ No | Quick testing |
| **Expo Go** | Free | Unlimited | ✅ Yes | Development only |

---

## 🎯 Recommended Approach

### If Client Has iPhone:

1. **Short term:** Use Android APK (if client has Android phone too)
2. **Long term:** Get Apple Developer account → Use TestFlight

### If Multiple People Need Access:

**TestFlight is best:**
- Add all testers in App Store Connect
- They get email invitation
- Install via TestFlight app
- Automatic updates when you rebuild

---

## 📋 Quick TestFlight Setup Checklist

- [ ] Sign up for Apple Developer Program ($99/year)
- [ ] Wait for approval (24-48 hours)
- [ ] Run `eas build:configure` for iOS
- [ ] Build: `eas build --profile preview --platform ios`
- [ ] Submit: `eas submit --platform ios`
- [ ] Add testers in App Store Connect
- [ ] Send TestFlight invitations
- [ ] Client installs TestFlight app
- [ ] Client installs your app from TestFlight

---

## 🚨 Important Notes

1. **Apple Developer Account:** Required for any iOS distribution (TestFlight or Ad-Hoc)
2. **App Review:** External TestFlight testers require App Review (takes 24-48 hours)
3. **Internal Testers:** Up to 100, no review needed
4. **Updates:** Rebuild and resubmit to TestFlight - users get automatic notification
5. **Backend:** Already on Render ✅ - works independently

---

## 💡 Alternative: Hybrid Approach

**If client has both iPhone and Android:**

1. Build Android APK (free, immediate)
2. Share APK for immediate testing
3. Meanwhile, set up Apple Developer account
4. Build iOS TestFlight version
5. Share TestFlight link when ready

**Best of both worlds!**

---

## 📞 Need Help?

- EAS Build Docs: https://docs.expo.dev/build/introduction/
- TestFlight Guide: https://developer.apple.com/testflight/
- Apple Developer: https://developer.apple.com/programs/
