# Quick Guide: Share App with Client

## 🚀 Fastest Way (Expo Go - Right Now)

### Step 1: Start Expo with Tunnel Mode
```bash
cd client
npm start
```
Then press `s` → select `tunnel` (or type `tunnel`)

### Step 2: Share the Link
- Copy the **URL** shown in terminal (looks like `exp://...`)
- Or share the **QR code** (client scans with Expo Go app)
- Or press `e` to email the link

### Step 3: Client Installs Expo Go
- **iOS**: [App Store - Expo Go](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Play Store - Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Step 4: Client Opens Link
- They scan QR code OR
- They open the link on their phone (it will open in Expo Go)

---

## ⚠️ Important: Backend Must Be Running

Your app needs the backend server running. Options:

### Option A: You Run Backend Locally + Tunnel
1. Start backend: `cd server && npm run start:dev`
2. Use ngrok to expose it:
   ```bash
   ngrok http 3000
   ```
3. Update `client/constants/api.ts` with ngrok URL temporarily

### Option B: Deploy Backend First (Better)
Deploy backend to Railway/Render/Vercel, then update API URL.

---

## 🎯 Better Option: EAS Build Preview

For a more professional experience:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build preview (creates shareable link)
eas build --platform android --profile preview
# or
eas build --platform ios --profile preview
```

This creates an installable app that works without Expo Go!

---

## 📱 Publishing Checklist

Before publishing to stores:
- [ ] Deploy backend to production
- [ ] Update API URL in `constants/api.ts`
- [ ] Test on real devices
- [ ] Prepare app store screenshots
- [ ] Get Apple Developer account ($99/year)
- [ ] Get Google Play Developer account ($25 one-time)
