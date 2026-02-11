# Expo App Sharing & Publishing Guide

## 🚀 Quick Options for Sharing with Clients

### Option 1: Expo Go (Easiest - What You're Using Now)

**Best for:** Quick testing, development, clients who just need to see the app

**How to share:**
1. Start your Expo dev server:
   ```bash
   cd client
   npm start
   ```

2. Choose one of these methods:
   - **Tunnel Mode** (works from anywhere): Press `s` to switch to tunnel mode, then share the QR code
   - **LAN Mode** (same WiFi): Share the QR code or URL shown
   - **Share URL**: Press `s` → `e` to email the link, or copy the URL from terminal

3. Client needs:
   - Install **Expo Go** app from App Store/Play Store
   - Scan QR code or open the link

**Limitations:**
- Client must have Expo Go installed
- Some native modules may not work
- Not suitable for production

---

### Option 2: EAS Build Preview (Recommended for Client Testing)

**Best for:** Professional testing, closer to production experience

**Setup:**
1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo:
   ```bash
   eas login
   ```

3. Configure EAS (creates `eas.json`):
   ```bash
   eas build:configure
   ```

4. Create a preview build:
   ```bash
   # For iOS (TestFlight)
   eas build --platform ios --profile preview
   
   # For Android (APK)
   eas build --platform android --profile preview
   ```

5. Share the build link - EAS provides a shareable URL!

**Benefits:**
- Works without Expo Go
- More production-like experience
- Can be installed directly on device
- Shareable link for easy distribution

---

### Option 3: Expo Updates (Over-the-Air Updates)

**Best for:** Updating published apps without app store approval

After publishing, you can push updates instantly:
```bash
eas update --branch production --message "Bug fixes"
```

---

## 📱 Publishing to App Stores

### Prerequisites

1. **Apple Developer Account** ($99/year) - for iOS
2. **Google Play Developer Account** ($25 one-time) - for Android
3. **EAS Build** account (free tier available)

### Step-by-Step Publishing

#### 1. Configure EAS

Create/update `eas.json` in your `client` folder:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "ios": {
        "bundleIdentifier": "com.pricelens.app"
      },
      "android": {
        "package": "com.pricelens.app"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

#### 2. Update app.json for Production

Make sure your `app.json` has:
- ✅ App name
- ✅ Bundle identifier/package name
- ✅ Version number
- ✅ Icons and splash screens
- ✅ Privacy permissions (if needed)

#### 3. Build for Production

```bash
cd client

# Build for both platforms
eas build --platform all --profile production

# Or build separately
eas build --platform ios --profile production
eas build --platform android --profile production
```

#### 4. Submit to App Stores

**iOS (App Store):**
```bash
eas submit --platform ios
```

**Android (Google Play):**
```bash
eas submit --platform android
```

EAS will guide you through:
- App Store Connect setup
- Google Play Console setup
- App metadata (description, screenshots, etc.)

---

## 🔧 Important: Backend Configuration

Your app currently points to a local IP (`192.168.201.105:3000`). For sharing/publishing:

### Option A: Deploy Backend (Recommended)

Deploy your NestJS backend to:
- **Vercel** (serverless)
- **Railway**
- **Render**
- **AWS/Google Cloud**
- **Heroku**

Then update `client/constants/api.ts`:
```typescript
const DEFAULT_API_BASE_URL = 'https://your-backend-url.com';
```

### Option B: Use Environment Variables

1. Create `.env` in `client` folder:
   ```
   EXPO_PUBLIC_API_URL=https://your-backend-url.com
   ```

2. Update `app.json` to use env:
   ```json
   {
     "expo": {
       "extra": {
         "apiUrl": process.env.EXPO_PUBLIC_API_URL
       }
     }
   }
   ```

### Option C: Development Tunnel (Temporary)

For quick testing, use **ngrok** or **localtunnel**:
```bash
# Install ngrok
npm install -g ngrok

# In your server directory
ngrok http 3000

# Use the ngrok URL in your API config
```

---

## 📋 Quick Checklist Before Publishing

- [ ] Backend deployed and accessible publicly
- [ ] API URLs updated to production
- [ ] App icons and splash screens added
- [ ] App name and description finalized
- [ ] Version number set in `app.json`
- [ ] Privacy policy URL added (if required)
- [ ] Test on physical devices
- [ ] Screenshots prepared for app stores
- [ ] App Store/Play Store accounts ready

---

## 🎯 Recommended Workflow

1. **Development**: Use Expo Go (what you're doing now)
2. **Client Testing**: Use EAS Build Preview builds
3. **Production**: Use EAS Build + Submit for app stores

---

## 💡 Pro Tips

- Use **EAS Update** for quick bug fixes without rebuilding
- Set up **staging** and **production** environments
- Use **environment variables** for different API endpoints
- Test on both iOS and Android before submitting
- Prepare app store screenshots early (they're required)

---

## 🆘 Common Issues

**"Can't connect to backend"**
- Make sure backend is deployed and accessible
- Check API URL in `constants/api.ts`
- Verify CORS settings on backend

**"Expo Go can't load the app"**
- Use tunnel mode: `npm start` → press `s` → select `tunnel`
- Check internet connection
- Verify Expo CLI is updated

**"Build fails"**
- Check `eas.json` configuration
- Verify all dependencies are compatible
- Check EAS build logs for specific errors

---

## 📚 Resources

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [Expo Updates](https://docs.expo.dev/eas-update/introduction/)
- [App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
