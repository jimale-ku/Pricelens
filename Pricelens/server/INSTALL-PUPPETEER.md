# Installing Puppeteer for Real Scraping

## Quick Install

Run this command in the `server` directory:

```bash
npm install puppeteer
```

If that fails due to peer dependency warnings, use:

```bash
npm install puppeteer --legacy-peer-deps
```

Or:

```bash
npm install puppeteer --force
```

## What Puppeteer Does

Puppeteer is a headless browser that:
- Renders JavaScript (unlike simple fetch)
- Can extract real products from Google Shopping
- Downloads Chromium automatically (~170MB on first install)

## After Installation

Once Puppeteer is installed, the scraper will automatically:
1. ✅ Use Puppeteer to scrape real products
2. ✅ Extract actual product names, prices, images, and store URLs
3. ✅ Return real data instead of sample data

## Current Status

- ✅ Code is ready for Puppeteer
- ⚠️ Puppeteer not yet installed
- ✅ Falls back to sample data for development

## Verify Installation

After installing, run:

```bash
npm run test:scraper
```

You should see:
- `🌐 Puppeteer browser launched successfully`
- Real products extracted (not sample data)

## Troubleshooting

### Issue: npm install fails

**Solution**: Clear npm cache and try again:
```bash
npm cache clean --force
npm install puppeteer
```

### Issue: Chromium download fails

**Solution**: Puppeteer will try to download Chromium. If it fails:
1. Check your internet connection
2. Try again later (may be temporary network issue)
3. Or set `PUPPETEER_SKIP_DOWNLOAD=true` and install Chromium manually

### Issue: "Cannot find module 'puppeteer'"

**Solution**: Make sure you're in the `server` directory:
```bash
cd server
npm install puppeteer
```

## Alternative: Use Without Puppeteer

The scraper works without Puppeteer but will:
- Use HTML parsing (may not work well with Google's JS-rendered content)
- Fall back to sample data for development

This is fine for development, but for real scraping, Puppeteer is recommended.
