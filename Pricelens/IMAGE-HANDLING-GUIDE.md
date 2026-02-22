# Image Handling Guide for PriceLens

## 1. Backend Schema (Prisma)
- **Store**: `logo` (string, URL to image)
- **Product**: `images` (array of strings, URLs to images)
- **User**: `avatarUrl` (string, URL to image)
- **Advertisement**: `imageUrl` (string, URL to ad image)

## 2. How to Use Images in Production

### A. Image Storage
- Upload all images (store logos, product images, ad banners, user avatars) to a CDN or object storage (e.g. AWS S3, Cloudinary, Supabase Storage, etc.).
- The backend should store the public URL for each image in the appropriate field.

### B. API Returns Image URLs
- When you fetch a store, product, user, or ad from your API, the response includes the image URL.
- Example for a store:
  ```json
  {
    "id": "costco",
    "name": "Costco",
    "logo": "https://cdn.yourapp.com/stores/costco.png"
  }
  ```
- Example for a product:
  ```json
  {
    "id": "prod123",
    "name": "Milk",
    "images": ["https://cdn.yourapp.com/products/milk1.png", ...]
  }
  ```

### C. Frontend Usage
- Use the image URL from the API directly in your `<Image source={{ uri: ... }} />` components.
- No need to hardcode or manually update images in the frontend.

## 3. How to Add/Update Images
- Upload the image to your CDN/storage.
- Save the public URL in the backend (via admin panel, script, or direct DB update).
- The frontend will automatically show the new image when it fetches data.

## 4. Development/Testing
- You can use placeholder images or a constants file until your backend and CDN are ready.
- Once ready, switch to using the URLs from your API.

## 5. Deployment
- When deploying to AWS/Supabase:
  - Use S3/Supabase Storage for image hosting.
  - Make sure your backend returns the correct URLs.
  - No code changes needed in the frontend except to use the API data.

---

# How to Upload Images to a CDN

## Option 1: AWS S3
1. Create an S3 bucket (public or with signed URLs).
2. Upload your images via AWS Console, CLI, or SDK.
3. Get the public URL for each image (e.g. `https://your-bucket.s3.amazonaws.com/image.png`).
4. Store this URL in your backend database.

## Option 2: Cloudinary
1. Create a Cloudinary account.
2. Upload images via the Cloudinary dashboard or API.
3. Get the secure URL (e.g. `https://res.cloudinary.com/your-cloud/image/upload/v12345/image.png`).
4. Store this URL in your backend database.

## Option 3: Supabase Storage
1. Create a Supabase project.
2. Use the Storage feature to create a bucket and upload images.
3. Get the public URL for each image.
4. Store this URL in your backend database.

---

## Example: Using Image URLs in React Native
```tsx
<Image source={{ uri: store.logo }} style={{ width: 64, height: 64 }} />
<Image source={{ uri: product.images[0] }} style={{ width: 128, height: 128 }} />
<Image source={{ uri: ad.imageUrl }} style={{ width: '100%', height: 128 }} />
```

---

**Summary:**
- Always store and use image URLs from your backend.
- Upload images to a CDN or storage service.
- Update your backend with the new URLs.
- The frontend just displays whatever URL is provided by the API.
