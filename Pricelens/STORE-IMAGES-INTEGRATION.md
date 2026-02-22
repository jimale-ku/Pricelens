# Store Images Integration Guide

## Current State (Development)
Store images are currently **placeholders** in the UI. The structure is ready but needs backend integration.

## Implementation Steps

### 1. Backend Setup
Add a `logo` field to your Store model in the backend:
```typescript
// server/prisma/schema.prisma
model Store {
  id    String  @id @default(uuid())
  name  String
  slug  String  @unique
  logo  String? // URL to store logo image
  // ... other fields
}
```

### 2. Upload Store Logos to CDN
- Use Cloudinary, AWS S3, or similar CDN service
- Upload store logos (recommended size: 200x200px, PNG with transparency)
- Get URLs for each store logo

### 3. Update Backend API
Ensure your stores endpoint returns the logo URL:
```typescript
// GET /api/stores
{
  "stores": [
    {
      "id": "costco",
      "name": "Costco",
      "slug": "costco",
      "logo": "https://cdn.yourapp.com/stores/costco.png"
    }
  ]
}
```

### 4. Frontend Integration
**a) Update constants/stores.ts** (temporary - until API integration):
```typescript
export const STORES = {
  costco: {
    name: 'Costco',
    slug: 'costco',
    logo: 'https://cdn.yourapp.com/stores/costco.png', // Add this field
  },
  // ... other stores
}
```

**b) Later, fetch from API** (create a new hook):
```typescript
// hooks/useStores.ts
export const useStores = () => {
  const [stores, setStores] = useState([]);
  
  useEffect(() => {
    fetch(`${API_URL}/stores`)
      .then(res => res.json())
      .then(data => setStores(data.stores));
  }, []);
  
  return stores;
};
```

**c) Update the store card component** in `app/(tabs)/index.tsx`:

Replace the placeholder View with Image component:
```tsx
import { Image } from 'react-native';

// Inside the store card:
<Image 
  source={{ uri: store.logo || 'https://via.placeholder.com/40' }}
  style={{ 
    width: '100%', 
    height: '100%',
    resizeMode: 'contain' // object-fit: contain
  }}
/>
```

### 5. Add Image Import
At the top of `app/(tabs)/index.tsx`, add:
```typescript
import { View, ScrollView, useWindowDimensions, Animated, Text, Pressable, TextInput, Image } from "react-native";
```

## Best Practices
- Cache images locally for offline support (use expo-image for automatic caching)
- Show placeholder while image loads
- Use optimized image formats (WebP) from CDN
- Lazy load images in lists for performance

## Migration Path
1. **Now**: Keep placeholder boxes in UI
2. **Phase 1**: Add temporary URLs to constants/stores.ts for testing
3. **Phase 2**: Set up backend with CDN integration
4. **Phase 3**: Replace constants with API fetch + caching

## File Locations
- Store constants: `client/constants/stores.ts`
- Store cards UI: `client/app/(tabs)/index.tsx` (line ~1150)
- Backend model: `server/prisma/schema.prisma`
- API endpoint: `server/src/stores/stores.controller.ts`
