/**
 * Custom Google Shopping Scraper Service
 * 
 * This service scrapes Google Shopping directly without using SerpAPI.
 * It's designed for development use when SerpAPI credits are exhausted.
 * 
 * IMPORTANT: This uses web scraping which:
 * - May violate Google's Terms of Service
 * - Can result in IP bans if used too aggressively
 * - Should only be used for development/testing
 * - Should be replaced with SerpAPI for production
 * 
 * Rate Limiting:
 * - Maximum 1 request per 2 seconds (30 requests/minute)
 * - Random delays between requests (2-4 seconds)
 * - User-Agent rotation to appear more natural
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Dynamic import for Puppeteer (only load if available)
let puppeteer: any = null;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  // Puppeteer not installed - will use fallback methods
}

export interface GoogleShoppingProduct {
  name: string;
  image: string;
  price: number;
  currency: string;
  url: string;
  store: string;
  shipping?: number;
  inStock?: boolean;
  rating?: number;
  reviews?: number;
}

export interface GoogleShoppingResponse {
  products: GoogleShoppingProduct[];
  total: number;
  query: string;
}

@Injectable()
export class GoogleShoppingScraperService {
  private readonly logger = new Logger(GoogleShoppingScraperService.name);
  private readonly baseUrl = 'https://www.google.com/shopping';
  private lastRequestTime = 0;
  private readonly minDelayMs = 2000; // 2 seconds minimum between requests
  private readonly maxDelayMs = 4000; // 4 seconds max delay
  private requestCount = 0;
  private readonly maxRequestsPerMinute = 30;
  private requestTimestamps: number[] = [];
  private browser: any = null;
  private browserLaunchPromise: Promise<any> | null = null;

  // User-Agent rotation to appear more natural
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  ];

  constructor(private configService: ConfigService) {
    // Check if custom scraper is enabled (default: true for development)
    const enabled = this.configService.get<string>('ENABLE_GOOGLE_SCRAPER') !== 'false';
    if (enabled) {
      this.logger.log('✅ Google Shopping Scraper enabled (development mode)');
      // Initialize browser lazily (on first use)
    } else {
      this.logger.warn('⚠️ Google Shopping Scraper disabled - set ENABLE_GOOGLE_SCRAPER=true to enable');
    }
  }

  /**
   * Get or launch browser instance (lazy initialization)
   */
  private async getBrowser(): Promise<any> {
    if (!puppeteer) {
      throw new Error('Puppeteer is not installed. Run: npm install puppeteer');
    }

    if (this.browser) {
      return this.browser;
    }

    if (this.browserLaunchPromise) {
      return this.browserLaunchPromise;
    }

    this.browserLaunchPromise = puppeteer.launch({
      headless: 'new', // Use new headless mode (fixes deprecation warning)
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
      // Windows-specific: Allow running without elevated permissions
      ignoreDefaultArgs: ['--disable-extensions'],
    });

    try {
      this.browser = await this.browserLaunchPromise;
      this.logger.log('🌐 Puppeteer browser launched successfully');
      return this.browser;
    } catch (error: any) {
      this.browserLaunchPromise = null;
      this.logger.error(`❌ Failed to launch browser: ${error.message}`);
      throw error;
    }
  }

  /**
   * Close browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.browserLaunchPromise = null;
      this.logger.log('🌐 Browser closed');
    }
  }

  /**
   * Rate limiting: Ensure we don't make requests too frequently
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    
    // Clean up old timestamps (older than 1 minute)
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < 60000
    );

    // Check if we've exceeded the rate limit
    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = 60000 - (now - oldestRequest) + 1000; // Wait until oldest request is 1 minute old
      this.logger.warn(`⏳ Rate limit reached (${this.maxRequestsPerMinute} requests/min), waiting ${Math.ceil(waitTime / 1000)}s...`);
      await this.sleep(waitTime);
    }

    // Ensure minimum delay since last request
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelayMs) {
      const waitTime = this.minDelayMs - timeSinceLastRequest;
      await this.sleep(waitTime);
    }

    // Add random delay to appear more natural (2-4 seconds)
    const randomDelay = this.minDelayMs + Math.random() * (this.maxDelayMs - this.minDelayMs);
    await this.sleep(randomDelay);

    // Update tracking
    this.lastRequestTime = Date.now();
    this.requestTimestamps.push(this.lastRequestTime);
    this.requestCount++;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get random user agent
   */
  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Search Google Shopping for products
   * 
   * This method attempts to scrape Google Shopping results.
   * Note: Google's HTML structure changes frequently, so this may break.
   * For production, use SerpAPI instead.
   */
  async searchProducts(
    query: string,
    limit: number = 40,
    categorySlug?: string
  ): Promise<GoogleShoppingProduct[]> {
    const enabled = this.configService.get<string>('ENABLE_GOOGLE_SCRAPER') !== 'false';
    if (!enabled) {
      this.logger.warn('⚠️ Google Shopping Scraper is disabled');
      return [];
    }

    // Apply rate limiting
    await this.rateLimit();

    try {
      this.logger.log(`🔍 [Custom Scraper] Searching Google Shopping for: "${query}"`);
      
      // Use Puppeteer for real scraping (handles JavaScript-rendered content)
      this.logger.log(`🌐 [Custom Scraper] Using Puppeteer to scrape Google Shopping...`);
      try {
        const products = await this.scrapeWithPuppeteer(query, limit, categorySlug);
        
        if (products.length > 0) {
          this.logger.log(`✅ [Custom Scraper] Found ${products.length} real products for: "${query}"`);
          return products;
        }
      } catch (puppeteerError: any) {
        this.logger.warn(`⚠️ [Custom Scraper] Puppeteer scraping failed: ${puppeteerError.message}`);
        // If Puppeteer fails, try fallback methods
      }
      
      // Fallback: Try simple fetch + HTML parsing if Puppeteer fails
      this.logger.warn(`⚠️ [Custom Scraper] Puppeteer found no products, trying HTML parsing fallback...`);
      try {
        const params = new URLSearchParams({
          q: query,
          tbm: 'shop',
          gl: 'us',
          hl: 'en',
        });
        const url = `${this.baseUrl}?${params.toString()}`;
        const userAgent = this.getRandomUserAgent();
        const response = await fetch(url, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });

        if (response.ok) {
          const html = await response.text();
          const htmlProducts = this.parseGoogleShoppingHTML(html, query, limit);
          
          if (htmlProducts.length > 0) {
            return htmlProducts;
          }
        }
      } catch (fetchError: any) {
        this.logger.warn(`⚠️ [Custom Scraper] HTML parsing fallback failed: ${fetchError.message}`);
      }
      
      // Last resort: Generate sample data for development
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`⚠️ [Custom Scraper] Real scraping failed - generating sample data for development`);
        return this.generateSampleData(query, limit);
      }
      
      return [];
    } catch (error: any) {
      this.logger.error(`❌ [Custom Scraper] Error searching for "${query}": ${error.message}`);
      this.logger.error(`   Stack: ${error.stack}`);
      
      // If scraping fails, return empty array (fallback to SerpAPI or sample data)
      return [];
    }
  }

  /**
   * Scrape Google Shopping using Puppeteer (handles JavaScript-rendered content)
   */
  private async scrapeWithPuppeteer(
    query: string,
    limit: number,
    categorySlug?: string
  ): Promise<GoogleShoppingProduct[]> {
    if (!puppeteer) {
      this.logger.warn('⚠️ Puppeteer not installed - skipping Puppeteer scraping');
      return [];
    }

    let page: any = null;
    
    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();
      
      // Set realistic viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      const userAgent = this.getRandomUserAgent();
      await page.setUserAgent(userAgent);
      
      // Build Google Shopping URL
      const params = new URLSearchParams({
        q: query,
        tbm: 'shop',
        gl: 'us',
        hl: 'en',
      });
      
      const url = `${this.baseUrl}?${params.toString()}`;
      this.logger.debug(`🌐 [Puppeteer] Navigating to: ${url}`);
      
      // Navigate to page - use 'load' instead of 'networkidle2' to avoid hanging
      // 'networkidle2' can hang forever on Google Shopping due to continuous network activity
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 20000,
      });

      // Dismiss consent/cookie dialog if present (Google often shows "Accept all" or "I agree")
      try {
        const acceptXPath = "//button[contains(., 'Accept all')] | //a[contains(., 'Accept all')] | //button[contains(., 'I agree')] | //*[contains(@aria-label, 'Accept all')]";
        const acceptEls = await page.$x(acceptXPath).catch(() => []);
        if (acceptEls.length > 0) {
          await (acceptEls[0] as any).click();
          await new Promise((r) => setTimeout(r, 2000));
          this.logger.debug('Clicked consent/accept if present');
        }
      } catch (e) {
        // Ignore consent dismiss errors
      }

      // Wait for product results: either known containers or links to retailers
      try {
        await page.waitForSelector('div[data-docid], .sh-dgr__content, .sh-dgr__grid-result, a[href*="/url?q=http"]', {
          timeout: 12000,
        });
        this.logger.debug('✅ Product area or retailer links found');
      } catch (e) {
        this.logger.debug('⚠️ Primary selectors not found, waiting for JavaScript...');
      }
      // Extra time for dynamic content and lazy-loaded product cards
      await new Promise((r) => setTimeout(r, 5000));

      // Scroll to trigger lazy-loaded "Results for [query]" section (Google often shows Deals first, results below)
      try {
        for (let s = 0; s < 4; s++) {
          await page.evaluate(() => window.scrollBy(0, 600));
          await new Promise((r) => setTimeout(r, 1200));
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise((r) => setTimeout(r, 1500));
      } catch (e) {
        // Ignore scroll errors
      }

      // Diagnostic: log what the page actually has (helps when selectors fail)
      const diag = await page.evaluate(() => {
        const urlQLinks = document.querySelectorAll('a[href*="/url?q="]');
        const allLinks = document.querySelectorAll('a[href]');
        const sampleHrefs: string[] = [];
        urlQLinks.forEach((a, i) => {
          if (i < 5) sampleHrefs.push((a.getAttribute('href') || '').substring(0, 80));
        });
        const bodySnippet = (document.body && document.body.innerText) ? document.body.innerText.substring(0, 400) : '';
        return {
          title: document.title,
          currentUrl: window.location.href,
          urlQLinkCount: urlQLinks.length,
          totalLinkCount: allLinks.length,
          sampleHrefs,
          bodySnippet,
        };
      });
      this.logger.warn(`[Puppeteer diagnostic] title="${diag.title}" urlQLinks=${diag.urlQLinkCount} totalLinks=${diag.totalLinkCount} currentUrl=${diag.currentUrl?.substring(0, 60)}...`);
      if (diag.sampleHrefs.length > 0) {
        this.logger.warn(`[Puppeteer diagnostic] sample hrefs: ${diag.sampleHrefs.join(' | ')}`);
      }
      if (diag.bodySnippet) {
        this.logger.warn(`[Puppeteer diagnostic] body snippet: ${diag.bodySnippet.replace(/\s+/g, ' ').substring(0, 200)}...`);
      }

      // Extract products from the page using multiple strategies; filter by query so we don't return irrelevant items (e.g. glasses for "mattress")
      const searchQuery = (query || '').toLowerCase().trim();
      const productsRaw = await page.evaluate((limit: number, q: string) => {
        const productElements: any[] = [];
        const queryWords = q ? q.split(/\s+/).filter((w: string) => w.length > 2) : [];
        // UI labels that are NOT product names (Google Shopping chrome)
        const notProductTitles = /^(choose what you're giving feedback on|top deals|popular products|see (all )?deals|feedback|sort by|filter|refine|view (all )?results|shopping results|compare prices|add to (cart|basket)|buy (now|from)|free shipping|in stock|out of stock|save \d+%|off|sale)$/i;
        const notProductContains = /feedback|\.\.\.$|^top deals|^popular products|^see (all )?deals|^sort by|^filter$/i;

        // Strategy 1: Look for Google Shopping product containers
        const productContainers = document.querySelectorAll(
          'div[data-docid], .sh-dgr__content, .sh-dgr__grid-result, [data-ved][data-docid]'
        );
        // Strategy 2: Product cards with price and (image or link); text length to avoid whole-page matches
        const allCards = Array.from(document.querySelectorAll('div, article, section')).filter(el => {
          const text = (el.textContent || '').trim();
          const hasPrice = /\$\s*[\d,]+\.?\d*/.test(text);
          const hasImage = el.querySelector('img') !== null;
          const links = el.querySelectorAll('a[href]');
          const notTooBig = text.length > 30 && text.length < 2000;
          return hasPrice && (hasImage || links.length > 0) && notTooBig;
        });

        // Strategy 3: Find retailer links (/url?q=https://...) and get their card container
        const retailerLinks = document.querySelectorAll('a[href*="/url?q=http"]');
        const cardsFromLinks: Element[] = [];
        retailerLinks.forEach((a) => {
          let href = (a.getAttribute('href') || '');
          if (href.indexOf('/url?q=') === -1) return;
          const m = href.match(/\/url\?q=([^&]+)/);
          const resolved = m ? decodeURIComponent(m[1]) : '';
          if (resolved.indexOf('google.') !== -1 || resolved.indexOf('gstatic') !== -1) return;
          let parent: Element | null = a.parentElement;
          for (let up = 0; up < 15 && parent; up++) {
            const text = (parent.textContent || '').trim();
            if (/\$\s*[\d,]+\.?\d*/.test(text) && parent.querySelector('img') && text.length > 30 && text.length < 2000) {
              cardsFromLinks.push(parent);
              break;
            }
            parent = parent.parentElement;
          }
        });

        const allElements = Array.from(productContainers).concat(allCards).concat(cardsFromLinks);
        const uniqueElements = Array.from(new Set(allElements));

        for (let i = 0; i < Math.min(uniqueElements.length, limit * 3); i++) {
          const element = uniqueElements[i];
          const product: any = {};

          const titleSelectors = ['h3', 'h4', '[role="heading"]', '.title', '.name'];
          let titleElement: Element | null = null;
          for (const selector of titleSelectors) {
            titleElement = element.querySelector(selector);
            if (titleElement && titleElement.textContent?.trim()) break;
          }
          product.name = titleElement?.textContent?.trim() || element.textContent?.trim().split('\n')[0] || 'Unknown Product';
          product.name = product.name.replace(/\s+/g, ' ').trim().substring(0, 200);

          // Skip UI / non-product titles
          if (notProductTitles.test(product.name) || notProductContains.test(product.name)) continue;

          const priceText = element.textContent || '';
          const priceMatches = priceText.match(/\$\s*([\d,]+\.?\d*)/g);
          if (priceMatches && priceMatches.length > 0) {
            const priceStr = priceMatches[0].replace(/[^0-9.]/g, '');
            product.price = parseFloat(priceStr) || 0;
          } else {
            product.price = 0;
          }

          const imgElement = element.querySelector('img');
          if (imgElement) {
            product.image = imgElement.getAttribute('src') || imgElement.getAttribute('data-src') || imgElement.getAttribute('data-lazy-src') || '';
            if (product.image && !product.image.startsWith('http')) product.image = `https:${product.image}`;
          } else {
            product.image = '';
          }

          // Prefer the first link that goes to a retailer (not Google). Resolve Google redirects first.
          const links = element.querySelectorAll('a[href]');
          let bestHref = '';
          for (const a of Array.from(links)) {
            let href = a.getAttribute('href') || '';
            if (href.startsWith('/url?q=')) {
              const m = href.match(/\/url\?q=([^&]+)/);
              href = m ? decodeURIComponent(m[1]) : href;
            } else if (href.startsWith('/url?')) {
              const m = href.match(/url=([^&]+)/);
              href = m ? decodeURIComponent(m[1]) : href;
            }
            if (href.startsWith('http') && !href.includes('google.com') && !href.includes('gstatic.com')) {
              bestHref = href;
              break;
            }
          }
          if (!bestHref && links.length > 0) {
            let href = links[0].getAttribute('href') || '';
            if (href.startsWith('/url?q=')) {
              const m = href.match(/\/url\?q=([^&]+)/);
              href = m ? decodeURIComponent(m[1]) : href;
            }
            if (href.startsWith('http')) bestHref = href;
            else if (href.startsWith('/')) bestHref = 'https://www.google.com' + href;
          }
          product.url = bestHref;

          // Store: from URL hostname, or from visible text when Google no longer uses /url?q= (e.g. "Walmart - Product · $13.99")
          const knownStores = ['Walmart', 'Target', 'Amazon', 'Best Buy', 'eBay', 'Costco', 'Newegg', 'Kohl\'s', 'Macy\'s', 'Nordstrom', 'Wayfair', 'Home Depot', 'Lowe\'s', 'Staples', 'Office Depot', 'CVS', 'Walgreens', 'Rite Aid', 'Ulta', 'Sephora', 'Etsy', 'Overstock', 'Bed Bath', 'Dicks', 'Petco', 'PetSmart', 'Chewy'];
          const textForStore = (element.textContent || '').trim();
          let storeFromText = '';
          for (const name of knownStores) {
            if (textForStore.indexOf(name) !== -1) { storeFromText = name; break; }
          }
          if (product.url) {
            try {
              const urlObj = new URL(product.url);
              const hostname = urlObj.hostname.replace('www.', '').replace('m.', '');
              if (!hostname.includes('google.') && hostname !== 'google') {
                const parts = hostname.split('.');
                product.store = parts.length >= 2 ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Unknown Store';
              } else {
                product.store = storeFromText || 'Google';
              }
            } catch (e) {
              product.store = storeFromText || 'Unknown Store';
            }
          } else {
            product.store = storeFromText || 'Unknown Store';
          }
          if (product.store === 'Google' && !storeFromText) continue;

          if (product.name && product.name.length > 3 && product.price > 0 && product.store && product.store !== 'Google') {
            if (!product.image) product.image = '';
            product.currency = 'USD';
            product.inStock = true;
            const isDuplicate = productElements.some(p => p.name.toLowerCase() === product.name.toLowerCase());
            if (!isDuplicate) productElements.push(product);
          }
        }

        // When we have a search query, only keep products whose name contains at least one query word (avoids returning glasses for "mattress")
        const filtered = queryWords.length > 0
          ? productElements.filter((p) => {
              const name = (p.name || '').toLowerCase();
              return queryWords.some((word: string) => name.includes(word));
            })
          : productElements;
        return filtered.slice(0, limit);
      }, limit, searchQuery);
      const products = productsRaw;
      
      await page.close();
      page = null;
      
      return products;
    } catch (error: any) {
      if (page) {
        try {
          await page.close();
        } catch (e) {
          // Ignore close errors
        }
      }
      throw error;
    }
  }

  /**
   * Parse Google Shopping HTML to extract product information
   * 
   * This is a simplified parser. Google's structure changes frequently,
   * so this may need updates.
   */
  private parseGoogleShoppingHTML(
    html: string,
    query: string,
    limit: number
  ): GoogleShoppingProduct[] {
    const products: GoogleShoppingProduct[] = [];

    try {
      // Method 1: Try to extract JSON-LD structured data
      const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gs);
      if (jsonLdMatches) {
        for (const match of jsonLdMatches) {
          try {
            const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
            const data = JSON.parse(jsonContent);
            
            if (data['@type'] === 'Product' || data['@type'] === 'ItemList') {
              // Extract product information from JSON-LD
              if (data.itemListElement) {
                for (const item of data.itemListElement) {
                  if (item.item && products.length < limit) {
                    products.push(this.extractProductFromJsonLd(item.item));
                  }
                }
              } else if (data.name) {
                products.push(this.extractProductFromJsonLd(data));
              }
            }
          } catch (e) {
            // Skip invalid JSON
            continue;
          }
        }
      }

      // Method 2: Try to extract from HTML structure (fallback)
      // Google Shopping uses specific class names and data attributes
      // This is more fragile and may break if Google changes their HTML
      if (products.length === 0) {
        // Look for product containers in HTML
        // This is a simplified approach - real parsing would need a proper HTML parser
        const productPattern = /<div[^>]*class="[^"]*sh-dgr__content[^"]*"[^>]*>.*?<\/div>/gs;
        const matches = html.match(productPattern);
        
        if (matches) {
          for (const match of matches.slice(0, limit)) {
            const product = this.extractProductFromHTML(match);
            if (product) {
              products.push(product);
            }
          }
        }
      }

      // Method 3: If still no products, try to extract from script tags with product data
      if (products.length === 0) {
        const scriptMatches = html.match(/<script[^>]*>window\._SSR_DATA\s*=\s*({.*?});<\/script>/s);
        if (scriptMatches) {
          try {
            const data = JSON.parse(scriptMatches[1]);
            // Navigate through the data structure to find products
            // This structure varies, so we'll try common paths
            if (data && typeof data === 'object') {
              const extracted = this.extractProductsFromData(data, limit);
              products.push(...extracted);
            }
          } catch (e) {
            // Skip if parsing fails
          }
        }
      }

    } catch (error: any) {
      this.logger.warn(`⚠️ [Custom Scraper] Error parsing HTML: ${error.message}`);
    }

    return products.slice(0, limit);
  }

  /**
   * Extract product from JSON-LD data
   */
  private extractProductFromJsonLd(data: any): GoogleShoppingProduct {
    const offers = data.offers || (Array.isArray(data.offers) ? data.offers[0] : {});
    const aggregateRating = data.aggregateRating || {};
    
    return {
      name: data.name || 'Unknown Product',
      image: data.image || (typeof data.image === 'string' ? data.image : data.image?.[0] || ''),
      price: this.parsePrice(offers.price || offers.priceCurrency || '0'),
      currency: offers.priceCurrency || 'USD',
      url: offers.url || data.url || '',
      store: this.extractStoreName(offers.url || data.url || ''),
      shipping: this.parseShipping(offers.shippingDetails),
      inStock: offers.availability !== 'https://schema.org/OutOfStock',
      rating: aggregateRating.ratingValue ? parseFloat(aggregateRating.ratingValue) : undefined,
      reviews: aggregateRating.reviewCount ? parseInt(aggregateRating.reviewCount) : undefined,
    };
  }

  /**
   * Extract product from HTML snippet (simplified)
   */
  private extractProductFromHTML(html: string): GoogleShoppingProduct | null {
    try {
      // Extract name
      const nameMatch = html.match(/<h3[^>]*>(.*?)<\/h3>/);
      const name = nameMatch ? this.stripHtml(nameMatch[1]) : 'Unknown Product';

      // Extract price
      const priceMatch = html.match(/\$[\d,]+\.?\d*/);
      const price = priceMatch ? this.parsePrice(priceMatch[0]) : 0;

      // Extract image
      const imageMatch = html.match(/<img[^>]*src=["']([^"']+)["']/);
      const image = imageMatch ? imageMatch[1] : '';

      // Extract URL
      const urlMatch = html.match(/<a[^>]*href=["']([^"']+)["']/);
      const url = urlMatch ? urlMatch[1] : '';

      if (!name || name === 'Unknown Product') {
        return null;
      }

      return {
        name,
        image,
        price,
        currency: 'USD',
        url: url.startsWith('http') ? url : `https://www.google.com${url}`,
        store: this.extractStoreName(url),
        inStock: true,
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Extract products from nested data structure
   */
  private extractProductsFromData(data: any, limit: number): GoogleShoppingProduct[] {
    const products: GoogleShoppingProduct[] = [];
    
    // Recursively search for product-like objects
    const findProducts = (obj: any, depth = 0): void => {
      if (depth > 10 || products.length >= limit) return; // Prevent infinite recursion
      
      if (Array.isArray(obj)) {
        for (const item of obj) {
          findProducts(item, depth + 1);
        }
      } else if (obj && typeof obj === 'object') {
        // Check if this looks like a product
        if (obj.name && (obj.price || obj.offers)) {
          const product = this.extractProductFromDataObject(obj);
          if (product) {
            products.push(product);
          }
        }
        
        // Recurse into object properties
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            findProducts(obj[key], depth + 1);
          }
        }
      }
    };
    
    findProducts(data);
    return products.slice(0, limit);
  }

  /**
   * Extract product from data object
   */
  private extractProductFromDataObject(obj: any): GoogleShoppingProduct | null {
    try {
      const offers = obj.offers || {};
      return {
        name: obj.name || obj.title || 'Unknown Product',
        image: obj.image || obj.thumbnail || '',
        price: this.parsePrice(offers.price || obj.price || '0'),
        currency: offers.currency || obj.currency || 'USD',
        url: offers.url || obj.url || obj.link || '',
        store: this.extractStoreName(offers.url || obj.url || obj.link || ''),
        shipping: this.parseShipping(offers.shipping),
        inStock: offers.availability !== 'OutOfStock' && obj.inStock !== false,
        rating: obj.rating ? parseFloat(obj.rating) : undefined,
        reviews: obj.reviews ? parseInt(obj.reviews) : undefined,
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Parse price string to number
   */
  private parsePrice(priceStr: string | number): number {
    if (typeof priceStr === 'number') {
      return priceStr;
    }
    
    const cleaned = priceStr.toString().replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Parse shipping cost
   */
  private parseShipping(shippingDetails: any): number {
    if (!shippingDetails) return 0;
    
    if (typeof shippingDetails === 'number') {
      return shippingDetails;
    }
    
    if (typeof shippingDetails === 'string') {
      return this.parsePrice(shippingDetails);
    }
    
    if (shippingDetails.price) {
      return this.parsePrice(shippingDetails.price);
    }
    
    return 0;
  }

  /**
   * Extract store name from URL
   */
  private extractStoreName(url: string): string {
    try {
      if (!url) return 'Unknown Store';
      
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const hostname = urlObj.hostname;
      
      // Extract store name from domain
      const parts = hostname.replace('www.', '').split('.');
      if (parts.length >= 2) {
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      }
      
      return hostname;
    } catch (e) {
      return 'Unknown Store';
    }
  }

  /**
   * Strip HTML tags
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Alternative parsing methods when standard parsing fails
   */
  private parseAlternativeMethods(html: string, query: string, limit: number): GoogleShoppingProduct[] {
    const products: GoogleShoppingProduct[] = [];

    try {
      // Try to find window._SSR_DATA or similar JavaScript variables
      const scriptMatches = html.match(/<script[^>]*>(.*?window\._SSR_DATA.*?)<\/script>/gs);
      if (scriptMatches) {
        for (const match of scriptMatches) {
          try {
            // Try to extract JSON data from script
            const jsonMatch = match.match(/window\._SSR_DATA\s*=\s*({.*?});/s);
            if (jsonMatch) {
              const data = JSON.parse(jsonMatch[1]);
              const extracted = this.extractProductsFromData(data, limit);
              products.push(...extracted);
            }
          } catch (e) {
            // Skip if parsing fails
            continue;
          }
        }
      }

      // Try to find Google Shopping API response in script tags
      const apiMatches = html.match(/<script[^>]*>(.*?"shopping_results".*?)<\/script>/gs);
      if (apiMatches) {
        for (const match of apiMatches) {
          try {
            const jsonMatch = match.match(/"shopping_results"\s*:\s*(\[.*?\])/s);
            if (jsonMatch) {
              const shoppingResults = JSON.parse(jsonMatch[1]);
              for (const result of shoppingResults.slice(0, limit)) {
                products.push({
                  name: result.title || result.name || 'Unknown Product',
                  image: result.thumbnail || result.image || '',
                  price: this.parsePrice(result.price || '0'),
                  currency: result.currency || 'USD',
                  url: result.link || result.url || '',
                  store: this.extractStoreName(result.source || result.link || ''),
                  shipping: 0,
                  inStock: true,
                });
              }
            }
          } catch (e) {
            continue;
          }
        }
      }
    } catch (error: any) {
      this.logger.warn(`⚠️ [Custom Scraper] Alternative parsing failed: ${error.message}`);
    }

    return products.slice(0, limit);
  }

  /**
   * Generate sample data for development when scraping fails
   * This allows development to continue even when Google's structure changes
   */
  private generateSampleData(query: string, limit: number): GoogleShoppingProduct[] {
    const products: GoogleShoppingProduct[] = [];
    const basePrice = 50 + Math.random() * 450; // Random price between $50-$500
    
    // Common store names
    const stores = ['Amazon', 'Walmart', 'Target', 'Best Buy', 'eBay', 'Newegg', 'B&H', 'Adorama'];
    
    for (let i = 0; i < limit && i < 6; i++) {
      const price = Math.round((basePrice + (i * 20)) * 100) / 100;
      const store = stores[i % stores.length];
      
      products.push({
        name: `${query} - Option ${i + 1}`,
        image: `https://via.placeholder.com/300x300?text=${encodeURIComponent(query)}`,
        price: price,
        currency: 'USD',
        url: `https://example.com/product/${i + 1}`,
        store: store,
        shipping: i % 2 === 0 ? 0 : Math.round((5 + Math.random() * 10) * 100) / 100,
        inStock: true,
        rating: 4 + Math.random(),
        reviews: Math.floor(Math.random() * 1000),
      });
    }

    this.logger.warn(`⚠️ [Custom Scraper] Using sample data for development - ${products.length} products generated`);
    return products;
  }

  /**
   * Get request statistics
   */
  getStats(): { totalRequests: number; requestsLastMinute: number } {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < 60000
    );
    
    return {
      totalRequests: this.requestCount,
      requestsLastMinute: this.requestTimestamps.length,
    };
  }
}
