# ✅ Setup Checklist - For Client Presentation

Use this checklist to ensure everything is set up correctly before your presentation.

---

## 📋 Pre-Setup

- [ ] **Node.js installed** (v20+)
  - Check: `node --version`
  - Download: https://nodejs.org/

- [ ] **PostgreSQL installed** (v15+)
  - Check: PostgreSQL service is running
  - Download: https://www.postgresql.org/download/

- [ ] **Git installed** (optional, if using Git)
  - Check: `git --version`

- [ ] **Expo Go app** installed on phone
  - iOS: https://apps.apple.com/app/expo-go/id982107779
  - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

---

## 🗄️ Database Setup

- [ ] **PostgreSQL running**
  - Check: Service is started
  - Windows: Services → PostgreSQL
  - Mac: `brew services start postgresql`

- [ ] **Database created**
  - Database name: `pricelens_db`
  - Created via pgAdmin or SQL command

---

## ⚙️ Backend Setup

- [ ] **Navigated to server folder**
  ```bash
  cd server
  ```

- [ ] **Dependencies installed**
  ```bash
  npm install --legacy-peer-deps
  ```
  - No errors in terminal

- [ ] **`.env` file created**
  - Location: `server/.env`
  - Contains: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
  - PRICEAPI_KEY (if available)

- [ ] **Prisma client generated**
  ```bash
  npx prisma generate
  ```
  - No errors

- [ ] **Database migrations run**
  ```bash
  npx prisma migrate deploy
  ```
  - Success message shown

- [ ] **Backend server running**
  ```bash
  npm run start:dev
  ```
  - Terminal shows: `✅ Server running on http://localhost:3000`
  - Can access: `http://localhost:3000/api` (Swagger docs)

---

## 📱 Frontend Setup

- [ ] **Navigated to client folder**
  ```bash
  cd client
  ```

- [ ] **Dependencies installed**
  ```bash
  npm install --legacy-peer-deps
  ```
  - No errors in terminal

- [ ] **API URL updated**
  - File: `client/constants/api.ts`
  - Changed: `API_BASE_URL` to your IP address
  - Example: `'http://192.168.1.5:3000'`
  - **NOT** `localhost` (won't work from phone)

- [ ] **Expo started**
  ```bash
  npm start
  ```
  - QR code displayed
  - Metro bundler running

---

## 📲 Phone Connection

- [ ] **Phone and computer on same WiFi**
  - Both connected to same network
  - No VPN blocking connection

- [ ] **Expo Go app opened**
  - App installed and opened

- [ ] **QR code scanned**
  - iOS: Camera app or Expo Go
  - Android: Expo Go app

- [ ] **App loaded**
  - Home screen visible
  - No connection errors

---

## 🧪 Testing

- [ ] **Backend API works**
  - Open: `http://localhost:3000/api`
  - Swagger documentation loads

- [ ] **Frontend loads**
  - Home screen displays
  - Categories visible

- [ ] **Search works**
  - Try searching: "laptop" or "iPhone"
  - Results appear
  - Product images show

- [ ] **Store logos show**
  - Product cards display store logos
  - Not placeholders

- [ ] **Category navigation works**
  - Can navigate to different categories
  - Products display correctly

---

## 🎯 Presentation Ready

- [ ] **Both terminals running**
  - Terminal 1: Backend (`npm run start:dev`)
  - Terminal 2: Frontend (`npm start`)

- [ ] **App connected**
  - Phone showing app in Expo Go
  - No errors

- [ ] **Demo flow tested**
  - Home → Category → Search → Product
  - All working smoothly

- [ ] **Backup plan ready**
  - Screenshots/videos if needed
  - Alternative demo method

---

## ⚠️ Common Issues to Check

- [ ] **Firewall not blocking port 3000**
- [ ] **PostgreSQL service running**
- [ ] **Database password correct in .env**
- [ ] **IP address correct in api.ts**
- [ ] **Phone and computer on same WiFi**
- [ ] **No VPN interfering**

---

## ✅ Final Check

Before presenting:

1. ✅ Backend running and accessible
2. ✅ Frontend running and connected
3. ✅ App loads on phone
4. ✅ Can search for products
5. ✅ Images and logos display
6. ✅ No errors in terminals

---

## 🎉 Ready to Present!

**Everything checked?** You're ready to show your client the app! 🚀

**Good luck with your presentation!**










