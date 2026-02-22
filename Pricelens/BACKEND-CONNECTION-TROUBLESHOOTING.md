# 🔌 Backend Connection Troubleshooting Guide

## Current Configuration
- **Frontend API URL**: `http://192.168.201.104:3000`
- **Backend Port**: `3000`
- **Backend Host**: `0.0.0.0` (listens on all interfaces)

## Quick Checks

### 1. Is Backend Server Running?
```bash
# Check if backend is running
cd server
npm run start:dev
```

You should see:
```
🚀 Nest application successfully started on 0.0.0.0:3000
🌐 API accessible at http://192.168.201.104:3000
```

### 2. Check Your Current IP Address
```bash
# Windows
ipconfig

# Look for "IPv4 Address" under your active network adapter
# It should be something like: 192.168.x.x
```

### 3. Update Frontend API URL
If your IP changed, update `client/constants/api.ts`:
```typescript
export const API_BASE_URL = 'http://YOUR_NEW_IP:3000';
```

### 4. Test Connection from Browser
Open in browser: `http://192.168.201.104:3000/api`
- Should show Swagger documentation
- If it doesn't load, backend isn't running or IP is wrong

### 5. Check Windows Firewall
1. Open Windows Defender Firewall
2. Check if port 3000 is blocked
3. Allow Node.js through firewall if needed

### 6. Verify Network
- Make sure your phone/device is on the **same WiFi network** as your computer
- Try pinging your computer's IP from another device

## Common Issues & Solutions

### Issue: "Network request failed" or "Failed to fetch"
**Solution**: 
1. Verify backend is running
2. Check IP address matches
3. Check firewall settings
4. Ensure same WiFi network

### Issue: "Connection refused"
**Solution**:
- Backend server is not running
- Start it with: `cd server && npm run start:dev`

### Issue: "Timeout" or slow responses
**Solution**:
- Check backend logs for errors
- Verify database connection
- Check API rate limits

## Test Connection Script
Run this in your React Native app console:
```javascript
import { testBackendConnection } from './utils/testConnection';
testBackendConnection();
```

This will test all endpoints and show detailed error messages.
