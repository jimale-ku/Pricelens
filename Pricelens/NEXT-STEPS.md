# 🎯 Next Steps After Installing Node.js

**Follow these steps to complete setup:**

---

## ✅ **Step 1: Verify Node.js Installation**

After the installer finishes, **close the installer window** and run:

```bash
node --version
npm --version
```

**Expected output:**
```
v24.13.1
10.9.2
```

If you see version numbers, Node.js is installed! ✅

---

## ✅ **Step 2: Install Expo CLI**

Run this command:

```bash
npm install -g expo-cli
```

**This will download ~5MB** and install Expo CLI globally.

**Verify:**
```bash
expo --version
```

---

## ✅ **Step 3: Set Up Supabase (Cloud Database)**

**Go to:** https://supabase.com

1. Click "Start your project" (free)
2. Sign up (GitHub/Google/Email)
3. Create new project:
   - Name: `pricelens-dev`
   - Password: (create strong password, save it!)
   - Region: Choose closest
4. Wait 2 minutes
5. Go to: **Settings** → **Database**
6. Copy **Connection string** → **URI**

**Save the database URL!** You'll need it for `.env` file.

---

## ✅ **Step 4: Install Project Dependencies**

### **Backend:**
```bash
cd /Users/g/Documents/priceLens_mac/Pricelens/server
npm install --legacy-peer-deps
```

**This downloads ~200MB** (one-time)

### **Frontend:**
```bash
cd /Users/g/Documents/priceLens_mac/Pricelens/client
npm install --legacy-peer-deps
```

**This downloads ~300MB** (one-time)

---

## ✅ **Step 5: Create Backend `.env` File**

Create file: `server/.env`

```env
# Database (from Supabase)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET="paste-generated-secret-here"
JWT_REFRESH_SECRET="paste-another-generated-secret-here"

# Server Port
PORT=3000
NODE_ENV=development
```

**Generate JWT secrets:**
```bash
openssl rand -base64 32
```
Run twice to get two secrets.

---

## ✅ **Step 6: Set Up Database**

```bash
cd /Users/g/Documents/priceLens_mac/Pricelens/server
npx prisma generate
npx prisma migrate deploy
```

---

## ✅ **Step 7: Start Backend**

```bash
cd /Users/g/Documents/priceLens_mac/Pricelens/server
npm run start:dev
```

**Keep this terminal open!**

---

## ✅ **Step 8: Configure Frontend API URL**

Edit: `client/constants/api.ts`

Find your IP address:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Update the file:
```typescript
export const API_BASE_URL = 'http://YOUR_IP_ADDRESS:3000';
```

---

## ✅ **Step 9: Start Frontend**

**Open NEW terminal:**

```bash
cd /Users/g/Documents/priceLens_mac/Pricelens/client
npm start
```

**Scan QR code with Expo Go app!** 📱

---

## 📊 **Data Usage So Far:**

- ✅ Node.js: 86.6MB (downloaded)
- ⏳ Expo CLI: ~5MB (next)
- ⏳ Backend deps: ~200MB (after Expo CLI)
- ⏳ Frontend deps: ~300MB (after backend)

**Total remaining: ~505MB**

---

## 🎉 **You're Almost There!**

After Step 2 (Expo CLI), you'll have everything essential installed!

Then just:
1. Set up Supabase (no download)
2. Install dependencies (~500MB total)
3. Configure and run!

**Let me know when Node.js installation is done, and I'll help with the next steps!** 🚀
