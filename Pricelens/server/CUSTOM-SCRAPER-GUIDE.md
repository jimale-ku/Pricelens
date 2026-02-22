# Custom Google Shopping Scraper Guide

## Overview

This custom scraper was built as a **development fallback** when SerpAPI credits are exhausted. It scrapes Google Shopping directly without using SerpAPI.

## ⚠️ Important Warnings

### Legal & Terms of Service
- **Google's Terms of Service**: Web scraping may violate Google's ToS
- **Use at Your Own Risk**: This is for development/testing only
- **Production Use**: For production, use SerpAPI (paid service) instead
- **IP Bans**: Aggressive scraping can result in IP bans

### Rate Limiting
- **Maximum**: 30 requests per minute
- **Delay**: 2-4 seconds between requests (randomized)
- **Automatic**: Rate limiting is built-in to prevent bans

## How It Works

1. **Automatic Fallback**: When SerpAPI returns 429 (rate limit) or 402 (out of credits), the system automatically falls back to the custom scraper
2. **Rate Limiting**: Built-in delays prevent IP bans
3. **User-Agent Rotation**: Uses different browser user-agents to appear more natural
4. **Same Format**: Returns data in the same format as SerpAPI, so no code changes needed

## Configuration

### Enable/Disable Custom Scraper

Add to your `.env` file:

```env
# Enable custom scraper (default: true for development)
ENABLE_GOOGLE_SCRAPER=true

# Or disable it (will only use SerpAPI)
ENABLE_GOOGLE_SCRAPER=false
```

### Default Behavior

- **If `ENABLE_GOOGLE_SCRAPER` is not set**: Custom scraper is **enabled** (for development)
- **If `ENABLE_GOOGLE_SCRAPER=false`**: Custom scraper is **disabled** (only SerpAPI will be used)

## Usage

The custom scraper is used **automatically** as a fallback. No code changes needed!

### When It Activates

1. **SerpAPI Rate Limit (429)**: Too many requests
2. **SerpAPI Out of Credits (402)**: No more API credits
3. **SerpAPI Network Error**: Connection issues
4. **SerpAPI Key Missing**: No API key configured

### Example Flow

```
1. Try SerpAPI first
   ↓
2. If SerpAPI fails (429/402) → Use Custom Scraper
   ↓
3. If Custom Scraper fails → Return empty results
```

## Rate Limiting Details

### Built-in Protection

- **Minimum Delay**: 2 seconds between requests
- **Maximum Delay**: 4 seconds (randomized)
- **Rate Limit**: 30 requests per minute
- **Automatic Cleanup**: Old request timestamps are cleaned up

### How It Works

```typescript
// Before each request:
1. Check if we've made 30+ requests in the last minute
2. If yes, wait until oldest request is 1 minute old
3. Wait 2-4 seconds (random) since last request
4. Make the request
5. Track the request timestamp
```

## Monitoring

### Check Scraper Stats

The scraper tracks statistics:

```typescript
const stats = googleShoppingScraper.getStats();
console.log(`Total requests: ${stats.totalRequests}`);
console.log(`Requests last minute: ${stats.requestsLastMinute}`);
```

## Troubleshooting

### Issue: No Results Returned

**Possible Causes**:
1. Google changed their HTML structure (scraper needs update)
2. IP temporarily banned (wait a few minutes)
3. Network issues

**Solutions**:
- Check backend logs for error messages
- Wait 5-10 minutes if IP might be banned
- Verify network connectivity

### Issue: Scraper Not Working

**Check**:
1. Is `ENABLE_GOOGLE_SCRAPER=true` in `.env`?
2. Are there error messages in logs?
3. Is the rate limit being hit?

### Issue: Getting IP Banned

**If you get IP banned**:
1. **Stop using the scraper immediately**
2. Wait 24-48 hours for ban to lift
3. Use SerpAPI instead (if you have credits)
4. Consider using a VPN (but this may violate ToS)

## Best Practices

### For Development
- ✅ Use custom scraper when SerpAPI credits are exhausted
- ✅ Test with small queries first
- ✅ Monitor rate limits
- ✅ Don't make too many requests in a short time

### For Production
- ❌ **DO NOT** use custom scraper in production
- ✅ Use SerpAPI (paid service) for production
- ✅ Set `ENABLE_GOOGLE_SCRAPER=false` in production

## When to Use SerpAPI vs Custom Scraper

### Use SerpAPI When:
- ✅ You have API credits available
- ✅ Production environment
- ✅ Need reliable, consistent results
- ✅ Need to avoid legal/ToS issues

### Use Custom Scraper When:
- ✅ Development/testing only
- ✅ SerpAPI credits exhausted
- ✅ Temporary fallback needed
- ✅ Testing the app functionality

## Technical Details

### Parsing Methods

The scraper tries multiple methods to extract product data:

1. **JSON-LD Structured Data**: Extracts from `<script type="application/ld+json">` tags
2. **HTML Structure**: Parses Google Shopping HTML structure
3. **Script Data**: Extracts from `window._SSR_DATA` JavaScript variables

### Data Extraction

- **Product Name**: From title/name fields
- **Price**: Parsed from price strings
- **Image**: From image/thumbnail URLs
- **Store**: Extracted from product URL domain
- **URL**: Product link

## Future Improvements

Potential enhancements:
- [ ] Use a proper HTML parser (like Cheerio or Puppeteer)
- [ ] Add proxy rotation support
- [ ] Improve parsing accuracy
- [ ] Add caching to reduce requests
- [ ] Better error handling and retry logic

## Support

If the custom scraper stops working:
1. Check if Google changed their HTML structure
2. Update the parsing logic in `google-shopping-scraper.service.ts`
3. Consider using SerpAPI instead

## Summary

- ✅ **Custom scraper is enabled by default** for development
- ✅ **Automatic fallback** when SerpAPI fails
- ✅ **Built-in rate limiting** to prevent IP bans
- ⚠️ **Development only** - use SerpAPI for production
- ⚠️ **May violate Google ToS** - use at your own risk
