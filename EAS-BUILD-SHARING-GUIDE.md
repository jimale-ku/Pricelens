# EAS Build Guide - Share App Without Your Laptop Running

## 🎯 Goal
Create a standalone app file (APK for Android, IPA for iOS) that your client can install and share with others **without your laptop needing to be on**.

## ✅ Prerequisites
1. ✅ Backend is already deployed on Render (`https://pricelens-1.onrender.com`)
2. ✅ App configuration is set up in `app.json`
3. ✅ API URL is already pointing to Render backend

## 📱 Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

## 🔐 Step 2: Login to Expo Account

```bash
eas login
```

If you don't have an Expo account, create one at: https://expo.dev/signup

## 🏗️ Step 3: Configure EAS Build

The `eas.json` file is already created. You can customize it if needed.

## 📦 Step 4: Build Android APK (Recommended for Quick Sharing)

```bash
cd client
eas build --profile preview --platform android
```

**What happens:**
- EAS will build your app in the cloud
- Takes 10-20 minutes
- You'll get a download link for the APK file

## 📥 Step 5: Download and Share the APK

1. **After build completes**, you'll get a URL like:
   ```
   https://expo.dev/artifacts/xxxxx.apk
   ```

2. **Download the APK** to your computer

3. **Share with your client:**
   - Upload to Google Drive / Dropbox / WeTransfer
   - Send the download link to your client
   - Client downloads and installs on Android phones

## 📱 Step 6: Client Installation (Android)

**For your client's father/friends (Android):**

1. Download the APK file
2. On Android phone: Settings → Security → Enable "Install from Unknown Sources"
3. Open the APK file
4. Tap "Install"
5. Open the app - it will connect to Render backend automatically!

## 🍎 Step 7: Build iOS (Optional - More Complex)

For iOS, you need an Apple Developer account ($99/year):

```bash
eas build --profile preview --platform ios
```

**iOS Sharing Options:**
- **TestFlight** (requires Apple Developer account) - easiest for sharing
- **Ad-hoc build** - install via link (limited to 100 devices)
- **Enterprise build** - requires Enterprise account

## 🔄 Step 8: Update and Rebuild

When you make changes:

1. **Update code**
2. **Rebuild:**
   ```bash
   cd client
   eas build --profile preview --platform android
   ```
3. **Share new APK** with client

## 💡 Pro Tips

### Option A: Android APK (Easiest)
- ✅ No account needed for testers
- ✅ Works on any Android phone
- ✅ Can share via link/download
- ⚠️ Users need to enable "Unknown Sources"

### Option B: TestFlight (iOS - Best Experience)
- ✅ Easy installation via TestFlight app
- ✅ Automatic updates
- ✅ Professional experience
- ⚠️ Requires Apple Developer account ($99/year)

### Option C: Expo Go (Current - Temporary)
- ✅ Fast for testing
- ❌ Requires your laptop running
- ❌ Requires same network/tunnel

## 🎯 Recommended Workflow

1. **For immediate testing:** Use Expo Go + tunnel (current method)
2. **For client sharing:** Build APK with EAS Build (this guide)
3. **For production:** Use TestFlight (iOS) or Google Play Internal Testing (Android)

## 📋 Quick Commands

```bash
# Build Android APK
cd client
eas build --profile preview --platform android

# Check build status
eas build:list

# View build logs
eas build:view [BUILD_ID]
```

## 🚨 Important Notes

1. **Backend URL:** Already set to `https://pricelens-1.onrender.com` ✅
2. **No laptop needed:** Once APK is built, your laptop can be off ✅
3. **Updates:** When you update the app, rebuild and share new APK
4. **Android:** APK works on any Android device (no Google Play needed)
5. **iOS:** Requires Apple Developer account for TestFlight

## 📞 Support

If build fails:
- Check `eas.json` configuration
- Ensure `app.json` has correct bundle identifier
- Check Expo dashboard: https://expo.dev/accounts/[your-account]/projects/pricelens/builds
