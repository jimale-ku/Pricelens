# Image Storage Guide for PriceLens

## Overview
You need to store:
1. **Product Images** - Photos of items (bananas, milk, etc.)
2. **Store Logos** - Brand logos (Walmart, Target, etc.)
3. **Category Icons** - Icons for groceries, electronics, etc.

---

## Solution Options

### Option 1: Public Folder (Simple - Good for Development)

**Pros:** Free, simple, works immediately  
**Cons:** Not scalable, images in your repo

**Structure:**
```
server/
  public/
    images/
      products/
        organic-bananas.jpg
        whole-milk.jpg
      stores/
        walmart.png
        target.png
        costco.png
        kroger.png
      categories/
        groceries.svg
        electronics.svg
```

**Usage in Database:**
```
Store logo: "/images/stores/walmart.png"
Product image: "/images/products/organic-bananas.jpg"
```

---

### Option 2: Cloud Storage (Recommended for Production)

#### **A. Cloudinary (Free tier: 25GB)**

**Setup:**
```bash
npm install cloudinary multer-storage-cloudinary
```

**Benefits:**
- Auto image optimization
- CDN delivery (fast)
- Image transformations (resize, crop)
- Free tier generous

**URL Format:**
```
https://res.cloudinary.com/your-cloud/image/upload/v1/products/organic-bananas.jpg
```

#### **B. AWS S3**

**Setup:**
```bash
npm install @aws-sdk/client-s3
```

**Benefits:**
- Very cheap ($0.023 per GB)
- Highly scalable
- Reliable

---

### Option 3: Use External URLs (Quick Start)

For stores, use their official logos from the web:
```javascript
const storeLogos = {
  walmart: 'https://logo.clearbit.com/walmart.com',
  target: 'https://logo.clearbit.com/target.com',
  costco: 'https://logo.clearbit.com/costco.com',
  kroger: 'https://logo.clearbit.com/kroger.com',
}
```

For products, PriceAPI returns image URLs - save those!

---

## Recommended Hybrid Approach

1. **Store Logos**: Keep in `public/images/stores/` (they rarely change)
2. **Product Images**: Get from PriceAPI, save URLs in database
3. **Category Icons**: Use a free icon library like Font Awesome

---

## Implementation Steps

### Step 1: Create Public Folder Structure
```bash
mkdir -p public/images/{stores,categories}
```

### Step 2: Download Store Logos
Save logos as:
- `walmart.png`
- `target.png`
- `costco.png`
- etc.

### Step 3: Update Database Seeds
When seeding stores, add logo paths:
```typescript
{
  name: 'Walmart',
  slug: 'walmart',
  logo: '/images/stores/walmart.png',
  websiteUrl: 'https://walmart.com'
}
```

### Step 4: When Getting Products from PriceAPI
```typescript
// Save the image URL from PriceAPI
{
  name: 'Organic Bananas',
  images: [imageUrlFromPriceAPI], // Store the full URL
  ...
}
```

---

## Quick Start: Use This Seed Data

I'll create a seed file with common grocery items and store data for you to test with.
