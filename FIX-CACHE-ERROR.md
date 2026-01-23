# Fix: storeDistances Error

## Problem
Error: `Property 'storeDistances' doesn't exist`

## Cause
This is a **React Native hot reload cache issue**. The code has been cleaned up (all `storeDistances` references removed), but React Native is using a cached version.

## Solution

### Option 1: Restart Dev Server (Recommended)
1. Stop your current dev server (Ctrl+C)
2. Clear Metro bundler cache:
   ```bash
   npx react-native start --reset-cache
   ```
   Or for Expo:
   ```bash
   npx expo start --clear
   ```

### Option 2: Full Clean Restart
1. Stop dev server
2. Clear all caches:
   ```bash
   # Clear Metro cache
   rm -rf node_modules/.cache
   
   # Clear watchman (if installed)
   watchman watch-del-all
   
   # Restart
   npx expo start --clear
   ```

### Option 3: Rebuild App
If the above doesn't work:
```bash
# For Expo
npx expo start --clear

# Or rebuild completely
npm start -- --reset-cache
```

## Verification
After restarting, the error should be gone. The code is already clean - no `storeDistances` references exist in the codebase.

