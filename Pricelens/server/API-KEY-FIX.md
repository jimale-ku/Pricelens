# API Key Configuration Fix

## Issue
The code was getting 403 Unauthorized errors because it was trying to use Serper Maps API with a SERPAPI_KEY, but these are different services:
- **SerpAPI** (serpapi.com) - uses `SERPAPI_KEY`
- **Serper** (serper.dev) - uses `SERPER_API_KEY`

## Fix Applied
Updated `server/src/integrations/services/serpapi-maps.service.ts` to:
- Only use Serper API when `SERPER_API_KEY` is explicitly set
- Use SerpAPI when only `SERPAPI_KEY` is set
- Removed incorrect fallback that was using SERPAPI_KEY for Serper

## Current Configuration
- `SERPAPI_KEY=a664ec89d6dab09ddd837b8ace14c2eecc3aa6dd98de2407fb3f65d9a61cf730`
- `SERPER_API_KEY` - Not set (will use SerpAPI instead)

## Next Steps
1. **Restart the backend server** for changes to take effect
2. The code will now correctly use SerpAPI Maps instead of Serper Maps
3. All service category endpoints should work with real API data

## Testing
After restarting, test an endpoint:
```bash
curl "http://localhost:3000/services/car-washes?zipCode=90210&washType=basic"
```

Expected: Should return real data from SerpAPI instead of 403 errors.
