import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * WEEK 2 INTEGRATION TESTS
 * Tests the price comparison platform functionality:
 * - Categories API
 * - Stores API
 * - Products API
 * - Store integrations (Walmart, Amazon, Target)
 * - Multi-store search
 */
describe('Week 2: Price Comparison Platform (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Categories API', () => {
    it('/categories (GET) - should return all enabled categories', () => {
      return request(app.getHttpServer())
        .get('/categories')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          
          const category = res.body[0];
          expect(category).toHaveProperty('id');
          expect(category).toHaveProperty('name');
          expect(category).toHaveProperty('slug');
          expect(category).toHaveProperty('displayOrder');
          expect(category).toHaveProperty('_count');
        });
    });

    it('/categories/slug/:slug (GET) - should return category by slug', () => {
      return request(app.getHttpServer())
        .get('/categories/slug/home-decor')
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Home Decor');
          expect(res.body.slug).toBe('home-decor');
        });
    });

    it('/categories/slug/:slug (GET) - should 404 for non-existent category', () => {
      return request(app.getHttpServer())
        .get('/categories/slug/non-existent')
        .expect(404);
    });
  });

  describe('Stores API', () => {
    it('/stores (GET) - should return all enabled stores', () => {
      return request(app.getHttpServer())
        .get('/stores')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(3); // At least Walmart, Amazon, Target
          
          const storeNames = res.body.map((s) => s.name);
          expect(storeNames).toContain('Walmart');
          expect(storeNames).toContain('Amazon');
          expect(storeNames).toContain('Target');
        });
    });

    it('/stores/slug/:slug (GET) - should return store by slug', () => {
      return request(app.getHttpServer())
        .get('/stores/slug/walmart')
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Walmart');
          expect(res.body.slug).toBe('walmart');
          expect(res.body.enabled).toBe(true);
        });
    });
  });

  describe('Products API', () => {
    it('/products (GET) - should return all products with prices', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          
          const product = res.body[0];
          expect(product).toHaveProperty('id');
          expect(product).toHaveProperty('name');
          expect(product).toHaveProperty('category');
          expect(product).toHaveProperty('prices');
          expect(Array.isArray(product.prices)).toBe(true);
        });
    });

    it('/products?categoryId=:id (GET) - should filter by category', async () => {
      const categories = await prisma.category.findMany();
      const categoryId = categories[0].id;

      return request(app.getHttpServer())
        .get(`/products?categoryId=${categoryId}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          res.body.forEach((product) => {
            expect(product.categoryId).toBe(categoryId);
          });
        });
    });

    it('/products/search?q=:query (GET) - should search products', () => {
      return request(app.getHttpServer())
        .get('/products/search?q=vase')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          
          const product = res.body[0];
          expect(product.name.toLowerCase()).toContain('vase');
          expect(product).toHaveProperty('prices');
        });
    });
  });

  describe('Store Integrations (Multi-Store Search)', () => {
    it('/products/search-stores?q=vase (GET) - should search all 3 stores', () => {
      return request(app.getHttpServer())
        .get('/products/search-stores?q=vase')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('walmart');
          expect(res.body).toHaveProperty('amazon');
          expect(res.body).toHaveProperty('target');
          expect(res.body).toHaveProperty('totalResults');
          expect(res.body).toHaveProperty('query', 'vase');
          
          // All stores should return results for 'vase'
          expect(res.body.walmart.length).toBeGreaterThan(0);
          expect(res.body.amazon.length).toBeGreaterThan(0);
          expect(res.body.target.length).toBeGreaterThan(0);
          
          // Check Walmart result structure
          const walmartProduct = res.body.walmart[0];
          expect(walmartProduct).toHaveProperty('externalId');
          expect(walmartProduct).toHaveProperty('name');
          expect(walmartProduct).toHaveProperty('price');
          expect(walmartProduct).toHaveProperty('inStock');
          expect(walmartProduct).toHaveProperty('currency', 'USD');
        });
    });

    it('/products/search-stores?q=headphones (GET) - should show price differences', () => {
      return request(app.getHttpServer())
        .get('/products/search-stores?q=headphones')
        .expect(200)
        .expect((res) => {
          const walmart = res.body.walmart.find((p) =>
            p.name.toLowerCase().includes('headphones'),
          );
          const amazon = res.body.amazon.find((p) =>
            p.name.toLowerCase().includes('headphones'),
          );
          const target = res.body.target.find((p) =>
            p.name.toLowerCase().includes('headphones'),
          );

          // All stores should have headphones
          expect(walmart).toBeDefined();
          expect(amazon).toBeDefined();
          expect(target).toBeDefined();

          // Prices should be different (realistic comparison)
          const prices = [walmart.price, amazon.price, target.price];
          const uniquePrices = new Set(prices);
          expect(uniquePrices.size).toBeGreaterThan(1);
        });
    });

    it('/products/search-stores?q=honey (GET) - should handle groceries', () => {
      return request(app.getHttpServer())
        .get('/products/search-stores?q=honey')
        .expect(200)
        .expect((res) => {
          expect(res.body.totalResults).toBeGreaterThan(0);
          
          // Check that at least one store has honey
          const hasHoney =
            res.body.walmart.some((p) => p.name.toLowerCase().includes('honey')) ||
            res.body.amazon.some((p) => p.name.toLowerCase().includes('honey')) ||
            res.body.target.some((p) => p.name.toLowerCase().includes('honey'));
          
          expect(hasHoney).toBe(true);
        });
    });

    it('/products/search-stores?q=nonexistent (GET) - should handle no results', () => {
      return request(app.getHttpServer())
        .get('/products/search-stores?q=nonexistentproduct12345')
        .expect(200)
        .expect((res) => {
          expect(res.body.walmart.length).toBe(0);
          expect(res.body.amazon.length).toBe(0);
          expect(res.body.target.length).toBe(0);
          expect(res.body.totalResults).toBe(0);
        });
    });
  });

  describe('Price Comparison Features', () => {
    it('should show realistic stock availability', () => {
      return request(app.getHttpServer())
        .get('/products/search-stores?q=mirror')
        .expect(200)
        .expect((res) => {
          // Target mirror should be out of stock (per mock data)
          const targetMirror = res.body.target.find((p) =>
            p.name.toLowerCase().includes('mirror'),
          );
          if (targetMirror) {
            expect(targetMirror.inStock).toBe(false);
          }
        });
    });

    it('should show shipping costs when applicable', () => {
      return request(app.getHttpServer())
        .get('/products/search-stores?q=charger')
        .expect(200)
        .expect((res) => {
          // Target charger has shipping cost
          const targetCharger = res.body.target.find((p) =>
            p.name.toLowerCase().includes('charger'),
          );
          if (targetCharger) {
            expect(targetCharger).toHaveProperty('shippingCost');
            expect(typeof targetCharger.shippingCost).toBe('number');
          }
        });
    });

    it('should return results within reasonable time', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/products/search-stores?q=headphones')
        .expect(200);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Parallel search should complete in < 500ms (3 stores @ ~200ms each in parallel)
      expect(duration).toBeLessThan(500);
    });
  });
});
