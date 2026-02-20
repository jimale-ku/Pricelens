# Development Workflow Guide

## 🎯 **Recommended Workflow: Work Locally, Deploy When Ready**

### **Why Work Locally First?**
- ✅ **Faster** - No Render cold starts (instant responses)
- ✅ **Free** - No API rate limits during testing
- ✅ **Easier debugging** - See server logs in your terminal
- ✅ **No deployment delays** - Test changes immediately

---

## 📋 **Two Development Modes**

### **1. Local Development Mode** (Recommended for daily work)
**Use this when:**
- Making code changes
- Testing features
- Debugging issues
- Iterating quickly

**Setup:**
1. **Backend:** Run `cd server && npm run start:dev` (keeps running)
2. **Frontend:** Run `cd client && npx expo start` (in another terminal)
3. **App connects to:** `http://192.168.201.105:3000` (your local PC)

**Configuration:**
- File: `client/.env`
- Set: `EXPO_PUBLIC_API_URL=http://192.168.201.105:3000`

---

### **2. Render Production Mode** (For client testing)
**Use this when:**
- Client needs to test the app
- Sharing QR code with others
- Final testing before launch
- Demo/presentation

**Setup:**
1. **Push code to GitHub:** `git add . && git commit -m "..." && git push`
2. **Render auto-deploys** (takes 2-5 minutes)
3. **App connects to:** `https://pricelens-1.onrender.com`

**Configuration:**
- File: `client/.env`
- Comment out local URL, uncomment Render URL:
  ```env
  # EXPO_PUBLIC_API_URL=http://192.168.201.105:3000
  EXPO_PUBLIC_API_URL=https://pricelens-1.onrender.com
  ```
- **Restart Metro:** Stop and restart `npx expo start` after changing `.env`

---

## 🔄 **Switching Between Modes**

### **Switch to Local:**
1. Edit `client/.env` → Set `EXPO_PUBLIC_API_URL=http://192.168.201.105:3000`
2. Make sure backend is running: `cd server && npm run start:dev`
3. Restart Metro: Stop `npx expo start` (Ctrl+C) and run it again

### **Switch to Render:**
1. Edit `client/.env` → Set `EXPO_PUBLIC_API_URL=https://pricelens-1.onrender.com`
2. Comment out the local URL line
3. Restart Metro: Stop `npx expo start` (Ctrl+C) and run it again
4. **Note:** First request to Render may take 30-60 seconds (cold start)

---

## 📝 **Typical Workflow**

### **Daily Development:**
```
1. Start local backend: cd server && npm run start:dev
2. Start Metro: cd client && npx expo start
3. Make changes to code
4. Test immediately (no deployment needed!)
5. Fix bugs, iterate
6. When ready, push to GitHub
```

### **Before Client Testing:**
```
1. Make sure all changes are committed
2. Push to GitHub: git push
3. Wait for Render to deploy (2-5 min)
4. Switch .env to Render URL
5. Restart Metro
6. Share QR code with client
```

---

## ⚠️ **Important Notes**

1. **`.env` file is NOT committed to GitHub** (it's in `.gitignore`)
   - Each developer has their own `.env` file
   - Render uses environment variables set in Render dashboard

2. **After changing `.env`, always restart Metro:**
   - Stop: `Ctrl+C` in Metro terminal
   - Start: `npx expo start` again

3. **IP Address Changes:**
   - Your PC's IP (`192.168.201.105`) may change if you:
     - Switch Wi-Fi networks
     - Restart router
     - Use mobile hotspot
   - **Fix:** Run `ipconfig` and update `.env` with new IP

4. **Render Cold Starts:**
   - First request after 15 min inactivity = 30-60 second delay
   - Subsequent requests = fast
   - Local server = always fast (no cold starts)

---

## 🚀 **Quick Commands**

```bash
# Start local backend
cd server && npm run start:dev

# Start Expo (in another terminal)
cd client && npx expo start

# Push changes to GitHub (deploys to Render)
git add .
git commit -m "Your message"
git push

# Check your PC's IP (Windows)
ipconfig | findstr IPv4

# Check your PC's IP (Mac/Linux)
ifconfig | grep "inet "
```

---

## ✅ **Current Setup**

- **Local IP:** `192.168.201.105`
- **Render URL:** `https://pricelens-1.onrender.com`
- **Current Mode:** Check `client/.env` file

---

## 🎯 **Best Practice**

**Work locally 90% of the time, only switch to Render when:**
- Client needs to test
- You want to verify production behavior
- Final testing before launch

This saves time, API costs, and makes development much faster!
