# Quick EAS Build Setup (5 Minutes)

## 🚀 Fastest Way to Share App

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login
```bash
eas login
```
(Create account at https://expo.dev/signup if needed)

### 3. Build Android APK
```bash
cd client
eas build --profile preview --platform android
```

### 4. Wait 10-20 minutes
- Build happens in cloud
- You'll get email when done
- Download APK from Expo dashboard

### 5. Share APK
- Upload to Google Drive/Dropbox
- Send link to client
- Client installs on Android phone

## ✅ Done!

**Your laptop can be OFF** - app works independently!

**Backend:** Already on Render ✅  
**App:** Standalone APK ✅  
**Sharing:** Just send download link ✅

## 📱 For iOS Users

If client has iPhone:
```bash
eas build --profile preview --platform ios
```
(Requires Apple Developer account - $99/year)

## 🔄 Update App Later

When you make changes:
1. Update code
2. Run `eas build --profile preview --platform android` again
3. Share new APK
