# 🛒 Amazon Associates Setup - Step by Step

## Overview

You need Amazon Associates credentials to use the Amazon Product Advertising API (which is **FREE** for affiliates). This guide walks you through the entire process.

---

## ✅ Step-by-Step Setup

### Step 1: Sign Up for Amazon Associates

1. **Go to**: https://affiliate-program.amazon.com/
2. **Click**: "Join Now for Free"
3. **Select**: Your country (US recommended for best API access)
4. **Sign in** with your Amazon account (or create one)

### Step 2: Complete Application

When filling out the application:

**Website/App Information:**
- **Website/App Name**: `PriceLens`
- **Description**: `PriceLens – a price comparison app`
- **Website URL**: Your app URL (can be placeholder like `https://pricelens.app` for now)
- **Primary Topic**: Select "Shopping" or "Price Comparison"

**Important Notes:**
- ✅ You can add payment details **later** (not required for API access)
- ✅ Approval usually takes **1-3 business days**
- ✅ You'll get an email when approved

### Step 3: Wait for Approval

- Check your email for approval notification
- Once approved, you can access Associates Central

### Step 4: Get API Credentials

1. **Login** to Associates Central: https://affiliate-program.amazon.com/home
2. **Navigate to**: Tools → **Product Advertising API**
3. **Click**: "Manage Your Account" or "Get Started"
4. **Generate credentials**:
   - You'll see options to create new credentials
   - Click "Generate" or "Create" for each:
     - **Access Key ID**
     - **Secret Access Key**
     - **Associate Tag** (this is your affiliate ID, like `pricelens-20`)

### Step 5: Add Credentials to Your Project

Add to `server/.env`:

```env
# Amazon Product Advertising API
AMAZON_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AMAZON_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AMAZON_ASSOCIATE_TAG=pricelens-20
```

**⚠️ Important**: 
- Keep these credentials **SECRET** (never commit to git)
- The Associate Tag is your unique affiliate ID

---

## 🚨 Common Issues & Solutions

### Issue 1: "Application Pending"
**Solution**: Wait 1-3 business days. Amazon reviews all applications.

### Issue 2: "Application Rejected"
**Common Reasons**:
- Website not ready/accessible
- Missing privacy policy
- Site doesn't meet Amazon's quality standards

**Solution**: 
- Make sure your site is live and functional
- Add a privacy policy page
- Reapply after fixing issues

### Issue 3: "Can't Find Product Advertising API"
**Solution**: 
- Make sure you're logged into Associates Central (not regular Amazon)
- Look for "Tools" menu → "Product Advertising API"
- If you don't see it, you may need to wait for full account activation

### Issue 4: "No Credentials Available"
**Solution**:
- You need to be an **approved** Associate
- Some regions have restrictions
- Contact Amazon Associates support if needed

---

## 🧪 Testing Your Credentials

Once you have credentials, test them:

```bash
cd server
npx ts-node test-amazon-adapter.ts
```

**Expected Output** (if working):
```
✅ Amazon Product Advertising API configured
🧪 Testing Amazon Adapter
📋 Test 1: Check if adapter is enabled
   Enabled: ✅
```

---

## 📋 What You'll Get

After setup, you'll have:

1. **Access Key ID** - Public identifier
2. **Secret Access Key** - Private key (keep secret!)
3. **Associate Tag** - Your affiliate ID (e.g., `pricelens-20`)

These three values are all you need to use the Amazon API.

---

## 💡 Tips

1. **Start with Test Mode**: Amazon has a test environment you can use
2. **Rate Limits**: Free tier has limits (check Amazon docs)
3. **Affiliate Commissions**: You earn commission on sales (optional, but nice!)
4. **Keep Credentials Safe**: Never share or commit to version control

---

## 🔗 Useful Links

- **Amazon Associates**: https://affiliate-program.amazon.com/
- **Product Advertising API Docs**: https://webservices.amazon.com/paapi5/documentation/
- **Associates Central**: https://affiliate-program.amazon.com/home
- **Support**: https://affiliate-program.amazon.com/help/contact

---

## ✅ Checklist

- [ ] Signed up for Amazon Associates
- [ ] Completed application with "PriceLens – a price comparison app"
- [ ] Received approval email
- [ ] Logged into Associates Central
- [ ] Navigated to Tools → Product Advertising API
- [ ] Generated Access Key ID
- [ ] Generated Secret Access Key
- [ ] Got Associate Tag
- [ ] Added all three to `server/.env`
- [ ] Tested with `test-amazon-adapter.ts`

---

**Once you have these credentials, your Amazon adapter will work automatically!** 🎉






