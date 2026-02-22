# 📦 Software Requirements - PriceLens Project

**Complete list of all software and tools you need to download and install for the PriceLens project.**

---

## ✅ **ESSENTIAL SOFTWARE** (Required)

### 1. **Git** 🔧
- **What it is:** Version control system
- **Why needed:** Clone repository, track changes
- **Download:** https://git-scm.com/downloads
- **macOS:** Already installed (or install via Xcode Command Line Tools)
- **Install Command:**
  ```bash
  # macOS - Install Xcode Command Line Tools (includes Git)
  xcode-select --install
  ```

### 2. **Node.js** ⚡
- **Version:** v20.x or higher (LTS recommended)
- **What it is:** JavaScript runtime for backend and frontend
- **Why needed:** Runs NestJS backend and React Native frontend
- **Download:** https://nodejs.org/
- **Verify Installation:**
  ```bash
  node --version  # Should show v20.x or higher
  npm --version    # Should show 10.x or higher
  ```

### 3. **PostgreSQL** 🗄️
- **Version:** v15 or higher
- **What it is:** Database for storing products, users, prices
- **Why needed:** Backend requires PostgreSQL database
- **Download:** https://www.postgresql.org/download/
- **macOS:** Use Homebrew or download from website
- **Install Command (macOS with Homebrew):**
  ```bash
  brew install postgresql@15
  brew services start postgresql@15
  ```
- **After Installation:**
  - Create database: `createdb pricelens_db`
  - Or use pgAdmin (GUI tool included)

### 4. **npm** (Comes with Node.js) 📦
- **What it is:** Package manager for Node.js
- **Why needed:** Install project dependencies
- **Included:** Automatically installed with Node.js
- **Verify:** `npm --version`

---

## 📱 **FRONTEND DEVELOPMENT** (Required for Mobile App)

### 5. **Expo CLI** 🚀
- **What it is:** Command-line tool for Expo/React Native development
- **Why needed:** Run and test React Native app
- **Install Command:**
  ```bash
  npm install -g expo-cli
  # Or use npx (no install needed)
  npx expo --version
  ```

### 6. **Expo Go App** (Mobile) 📲
- **What it is:** Mobile app to test your React Native app
- **Why needed:** Test app on your phone without building
- **Download:**
  - **iOS:** https://apps.apple.com/app/expo-go/id982107779
  - **Android:** https://play.google.com/store/apps/details?id=host.exp.exponent
- **Note:** Install on your phone, not computer

---

## 🔧 **OPTIONAL BUT RECOMMENDED**

### 7. **VS Code** (Code Editor) 💻
- **What it is:** Popular code editor
- **Why recommended:** Great for TypeScript, React Native, debugging
- **Download:** https://code.visualstudio.com/
- **Recommended Extensions:**
  - ESLint
  - Prettier
  - Prisma
  - React Native Tools
  - TypeScript and JavaScript Language Features

### 8. **Postman** (API Testing) 🧪
- **What it is:** Tool to test API endpoints
- **Why helpful:** Test backend API without frontend
- **Download:** https://www.postman.com/downloads/
- **Alternative:** Use `curl` or browser (Postman not required)

### 9. **Docker** (For Redis - Optional) 🐳
- **What it is:** Containerization platform
- **Why needed:** Run Redis for caching/background jobs (optional)
- **Download:** https://www.docker.com/products/docker-desktop/
- **When needed:** Only if you want Redis caching/background jobs
- **Install Redis with Docker:**
  ```bash
  docker run -d -p 6379:6379 --name redis redis:alpine
  ```

### 10. **Redis** (Optional - For Caching) ⚡
- **What it is:** In-memory data store for caching
- **Why needed:** Optional - improves performance, enables background jobs
- **Install Options:**
  - **Via Docker:** `docker run -d -p 6379:6379 redis:alpine`
  - **macOS:** `brew install redis` then `brew services start redis`
  - **Note:** Project works without Redis, but some features need it

---

## 🍎 **iOS DEVELOPMENT** (Optional - Only if building iOS app)

### 11. **Xcode** (macOS only) 🍎
- **What it is:** Apple's development environment
- **Why needed:** Build iOS app, run iOS Simulator
- **Download:** Mac App Store (free, ~12GB)
- **Note:** Only needed if you want to:
  - Build iOS app (not just test with Expo Go)
  - Run iOS Simulator on Mac
  - Submit to App Store

### 12. **CocoaPods** (iOS dependency manager)
- **What it is:** Dependency manager for iOS
- **Why needed:** Install iOS native dependencies
- **Install:** `sudo gem install cocoapods`
- **Note:** Only needed for native iOS builds

---

## 🤖 **ANDROID DEVELOPMENT** (Optional - Only if building Android app)

### 13. **Android Studio** 🤖
- **What it is:** Google's Android development environment
- **Why needed:** Build Android app, run Android Emulator
- **Download:** https://developer.android.com/studio
- **Size:** ~3GB download, ~8GB installed
- **Note:** Only needed if you want to:
  - Build Android app (not just test with Expo Go)
  - Run Android Emulator
  - Submit to Google Play Store

### 14. **Java Development Kit (JDK)**
- **What it is:** Java runtime for Android development
- **Why needed:** Required by Android Studio
- **Included:** Usually comes with Android Studio
- **Version:** JDK 17 or higher

---

## 🔑 **API KEYS & SERVICES** (Not software, but needed)

These are **API keys** you'll need to get from external services:

### 15. **PriceAPI Key** 💰
- **What it is:** API for product price comparison
- **Where to get:** https://www.priceapi.com/
- **Cost:** Free tier available
- **Add to:** `server/.env` as `PRICEAPI_KEY`

### 16. **SERPAPI Key** (Optional) 🔍
- **What it is:** API for Google search results
- **Where to get:** https://serpapi.com/
- **Cost:** Free tier available
- **Add to:** `server/.env` as `SERPAPI_KEY`

### 17. **Apify API Key** (Optional) 🤖
- **What it is:** Web scraping platform
- **Where to get:** https://apify.com/
- **Cost:** Free tier available
- **Add to:** `server/.env` as `APIFY_API_KEY`
- **Used for:** Gas station prices scraping

### 18. **OilPriceAPI Key** (Optional) ⛽
- **What it is:** API for oil/gas prices
- **Where to get:** https://www.oilpriceapi.com/
- **Cost:** Free tier available
- **Add to:** `server/.env` as `OILPRICEAPI_KEY`

### 19. **Google OAuth Credentials** (Optional) 🔐
- **What it is:** For Google Sign-In authentication
- **Where to get:** https://console.cloud.google.com/
- **Cost:** Free
- **Add to:** `server/.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### 20. **Stripe API Keys** (Optional - For Payments) 💳
- **What it is:** Payment processing
- **Where to get:** https://stripe.com/
- **Cost:** Free (pay per transaction)
- **Add to:** `server/.env` as `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`

---

## 📋 **INSTALLATION CHECKLIST**

### **Minimum Setup (To Get Started):**
- [ ] ✅ Git installed
- [ ] ✅ Node.js v20+ installed
- [ ] ✅ PostgreSQL v15+ installed and running
- [ ] ✅ npm working (`npm --version`)
- [ ] ✅ Expo CLI installed (`npm install -g expo-cli`)
- [ ] ✅ Expo Go app on your phone

### **Recommended Setup (Better Development Experience):**
- [ ] ✅ VS Code installed with extensions
- [ ] ✅ Postman installed (for API testing)
- [ ] ✅ Docker installed (for Redis)

### **Full Setup (Production Ready):**
- [ ] ✅ Redis installed (via Docker or native)
- [ ] ✅ All API keys obtained and configured
- [ ] ✅ Xcode installed (for iOS builds)
- [ ] ✅ Android Studio installed (for Android builds)

---

## 🚀 **QUICK INSTALL COMMANDS** (macOS)

### **Install Everything Essential:**
```bash
# 1. Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Node.js (via Homebrew)
brew install node@20

# 3. Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# 4. Install Expo CLI
npm install -g expo-cli

# 5. Install Docker (for Redis - optional)
brew install --cask docker

# 6. Install Redis (optional)
brew install redis
brew services start redis

# 7. Install Xcode Command Line Tools (includes Git)
xcode-select --install
```

### **Verify Installations:**
```bash
# Check versions
git --version      # Should show git version
node --version     # Should show v20.x
npm --version      # Should show 10.x
psql --version     # Should show PostgreSQL 15.x
expo --version     # Should show Expo CLI version
docker --version   # Should show Docker version (if installed)
redis-cli --version # Should show Redis version (if installed)
```

---

## 📱 **MOBILE SETUP**

### **For Testing (Easiest - Recommended):**
1. Install **Expo Go** app on your phone
2. Run `npm start` in `client` folder
3. Scan QR code with Expo Go
4. **Done!** No need for Xcode or Android Studio

### **For Building Native Apps (Advanced):**
- **iOS:** Need Xcode + Apple Developer Account ($99/year)
- **Android:** Need Android Studio + Google Play Developer Account ($25 one-time)

---

## 🎯 **WHAT YOU ACTUALLY NEED TO START**

### **Absolute Minimum:**
1. ✅ **Git** - Clone repository
2. ✅ **Node.js** - Run backend and frontend
3. ✅ **PostgreSQL** - Database
4. ✅ **Expo Go** - Test app on phone

### **That's it!** You can start developing with just these 4 things.

Everything else is optional and can be added later as needed.

---

## 🆘 **TROUBLESHOOTING**

### **"Command not found: git"**
- **macOS:** Run `xcode-select --install`
- **Windows:** Download from https://git-scm.com/downloads

### **"Command not found: node"**
- Install Node.js from https://nodejs.org/
- Or use Homebrew: `brew install node@20`

### **"Cannot connect to PostgreSQL"**
- Make sure PostgreSQL is running: `brew services start postgresql@15`
- Check if service is running: `brew services list`

### **"Expo Go can't connect"**
- Make sure phone and computer are on same WiFi
- Check firewall isn't blocking port 19000
- Try `expo start --tunnel` for better connectivity

---

## 📚 **USEFUL LINKS**

- **Node.js:** https://nodejs.org/
- **PostgreSQL:** https://www.postgresql.org/download/
- **Expo:** https://expo.dev/
- **VS Code:** https://code.visualstudio.com/
- **Docker:** https://www.docker.com/products/docker-desktop/
- **Git:** https://git-scm.com/downloads

---

## ✅ **NEXT STEPS**

After installing everything:

1. **Clone repository:** `git clone https://github.com/jimale-ku/Pricelens.git`
2. **Follow:** `CLIENT-SETUP-GUIDE.md` for detailed setup instructions
3. **Start backend:** `cd server && npm install && npm run start:dev`
4. **Start frontend:** `cd client && npm install && npm start`

**Good luck!** 🚀
