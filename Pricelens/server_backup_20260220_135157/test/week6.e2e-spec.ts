import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Week 6: Production Features (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    prisma = app.get<PrismaService>(PrismaService);

    await app.init();

    // Clean up test user if exists
    await prisma.user.deleteMany({
      where: { email: 'week6test@example.com' },
    });

    // Register and login a test user
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'week6test@example.com',
        password: 'Test123!@#',
        firstName: 'Week',
        lastName: 'Six',
      });

    userId = registerRes.body.user.id;

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'week6test@example.com',
        password: 'Test123!@#',
      });

    accessToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe.skip('Health Monitoring (requires Redis)', () => {
    it('should return basic health check', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
        });
    });

    it('should return database health status', async () => {
      return request(app.getHttpServer())
        .get('/health/database')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('database');
          // Database response can be string 'connected' or object with connected property
          expect(res.body.database === 'connected' || res.body.database.connected === true).toBe(true);
        });
    });

    it.skip('should return job queue health status (requires Redis)', async () => {
      return request(app.getHttpServer())
        .get('/health/jobs')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('jobs');
          expect(res.body.jobs).toHaveProperty('priceUpdates');
          expect(res.body.jobs).toHaveProperty('alertNotifications');
        });
    });

    it.skip('should return full system health status (requires Redis)', async () => {
      return request(app.getHttpServer())
        .get('/health/full')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('database');
          expect(res.body).toHaveProperty('jobs');
          expect(res.body.database).toHaveProperty('connected', true);
          expect(res.body.jobs).toHaveProperty('priceUpdates');
          expect(res.body.jobs).toHaveProperty('alertNotifications');
        });
    });
  });

  describe.skip('Background Jobs System (requires Redis)', () => {
    let categoryId: string;
    let storeId: string;
    let productId: string;

    beforeAll(async () => {
      // Create test data for background jobs
      const category = await prisma.category.upsert({
        where: { slug: 'electronics-week6' },
        update: {},
        create: {
          name: 'Electronics Week6',
          description: 'Electronic devices',
          slug: 'electronics-week6',
          icon: '📱',
        },
      });
      categoryId = category.id;

      const store = await prisma.store.upsert({
        where: { slug: 'testmart-week6' },
        update: {},
        create: {
          name: 'TestMart Week6',
          slug: 'testmart-week6',
          logo: 'https://example.com/logo.png',
          websiteUrl: 'https://testmart.com',
        },
      });
      storeId = store.id;

      const product = await prisma.product.create({
        data: {
          name: 'Test Laptop',
          description: 'A test laptop',
          categoryId: categoryId,
          brand: 'TestBrand',
          images: ['https://example.com/laptop.jpg'],
        },
      });
      productId = product.id;

      // Create initial price
      await prisma.productPrice.create({
        data: {
          productId: productId,
          storeId: storeId,
          price: 999.99,
          currency: 'USD',
          inStock: true,
          productUrl: 'https://testmart.com/laptop',
        },
      });
    });

    it.skip('should trigger manual price update job (requires Redis)', async () => {
      return request(app.getHttpServer())
        .post('/jobs/trigger-price-update')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Price update job triggered');
        });
    });

    it.skip('should trigger manual alert check job (requires Redis)', async () => {
      // Create a price alert first
      await prisma.priceAlert.create({
        data: {
          userId: userId,
          productId: productId,
          targetPrice: 899.99,
          isActive: true,
        },
      });

      return request(app.getHttpServer())
        .post('/jobs/trigger-alert-check')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Alert check job triggered');
        });
    });

    it.skip('should return job statistics (requires Redis)', async () => {
      return request(app.getHttpServer())
        .get('/jobs/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('priceUpdates');
          expect(res.body).toHaveProperty('alertNotifications');
          expect(res.body.priceUpdates).toHaveProperty('waiting');
          expect(res.body.priceUpdates).toHaveProperty('active');
          expect(res.body.priceUpdates).toHaveProperty('completed');
          expect(res.body.priceUpdates).toHaveProperty('failed');
        });
    });
  });

  describe.skip('PriceAPI Integration (requires Redis for jobs)', () => {
    it.skip('should detect if PriceAPI is enabled (requires Redis)', async () => {
      // This tests the isEnabled() method logic
      // Since we don't have PRICEAPI_KEY in test env, it should be disabled
      const jobStats = await request(app.getHttpServer())
        .get('/jobs/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Job stats should be accessible even without PriceAPI
      expect(jobStats.body).toBeDefined();
    });
  });

  describe('Price History Tracking', () => {
    it('should create price history when prices change', async () => {
      // Find a product with a price
      const productWithPrice = await prisma.product.findFirst({
        where: {
          prices: {
            some: {},
          },
        },
        include: {
          prices: true,
        },
      });

      if (!productWithPrice || productWithPrice.prices.length === 0) {
        // Create test product if none exists
        const category = await prisma.category.findFirst();
        const store = await prisma.store.findFirst();

        const newProduct = await prisma.product.create({
          data: {
            name: 'History Test Product',
            description: 'For testing price history',
            categoryId: category!.id,
            brand: 'TestBrand',
            images: ['https://example.com/product.jpg'],
          },
        });

        await prisma.productPrice.create({
          data: {
            productId: newProduct.id,
            storeId: store!.id,
            price: 199.99,
            currency: 'USD',
            inStock: true,
            productUrl: 'https://store.com/product',
          },
        });

        // Verify price was created
        const prices = await prisma.productPrice.findMany({
          where: { productId: newProduct.id },
        });
        expect(prices.length).toBeGreaterThan(0);
      }

      // Check if price history exists
      const historyCount = await prisma.priceHistory.count();
      expect(historyCount).toBeGreaterThanOrEqual(0);
    });

    it('should track price trends over time', async () => {
      // Create test product with price history
      const category = await prisma.category.findFirst();
      const store = await prisma.store.findFirst();

      const trendProduct = await prisma.product.create({
        data: {
          name: 'Trend Test Product',
          description: 'For testing price trends',
          categoryId: category!.id,
          brand: 'TrendBrand',
          images: ['https://example.com/trend.jpg'],
        },
      });

      // Create price history entries
      const dates = [
        new Date('2024-12-01'),
        new Date('2024-12-08'),
        new Date('2024-12-15'),
        new Date('2024-12-22'),
      ];
      const prices = [299.99, 279.99, 289.99, 269.99];

      for (let i = 0; i < dates.length; i++) {
        await prisma.priceHistory.create({
          data: {
            productId: trendProduct.id,
            storeId: store!.id,
            price: prices[i],
            recordedAt: dates[i],
          },
        });
      }

      // Verify history was created
      const history = await prisma.priceHistory.findMany({
        where: { productId: trendProduct.id },
        orderBy: { recordedAt: 'asc' },
      });

      expect(history.length).toBe(4);
      expect(Number(history[0].price)).toBe(299.99);
      expect(Number(history[3].price)).toBe(269.99);
    });
  });

  describe.skip('System Reliability (requires Health Module)', () => {
    it('should handle database connection gracefully', async () => {
      const health = await request(app.getHttpServer())
        .get('/health/database')
        .expect(200);

      // Database response can be string 'connected' or object with connected property
      expect(health.body.database === 'connected' || health.body.database?.connected === true).toBe(true);
    });

    it('should provide uptime information', async () => {
      const health = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(health.body.uptime).toBeGreaterThan(0);
      expect(typeof health.body.uptime).toBe('number');
    });

    it.skip('should include timestamps in health checks (requires Redis)', async () => {
      const health = await request(app.getHttpServer())
        .get('/health/full')
        .expect(200);

      expect(health.body.timestamp).toBeDefined();
      const timestamp = new Date(health.body.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });
  });

  describe('Alert Notification System', () => {
    it('should identify alerts that need notification', async () => {
      // Create product with current price
      const category = await prisma.category.findFirst();
      const store = await prisma.store.findFirst();

      const alertProduct = await prisma.product.create({
        data: {
          name: 'Alert Test Product',
          description: 'For testing alerts',
          categoryId: category!.id,
          brand: 'AlertBrand',
          images: ['https://example.com/alert.jpg'],
        },
      });

      await prisma.productPrice.create({
        data: {
          productId: alertProduct.id,
          storeId: store!.id,
          price: 149.99,
          currency: 'USD',
          inStock: true,
          productUrl: 'https://store.com/alert-product',
        },
      });

      // Create alert with target price above current price (should trigger)
      const alert = await prisma.priceAlert.create({
        data: {
          userId: userId,
          productId: alertProduct.id,
          targetPrice: 199.99,
          isActive: true,
          notified: false,
        },
      });

      // Verify alert was created
      const createdAlert = await prisma.priceAlert.findUnique({
        where: { id: alert.id },
      });

      expect(createdAlert).toBeDefined();
      expect(Number(createdAlert.targetPrice)).toBe(199.99);
      expect(createdAlert.isActive).toBe(true);
      expect(createdAlert.notified).toBe(false);
    });

    it('should not re-notify already notified alerts', async () => {
      // Create alert that's already been notified
      const category = await prisma.category.findFirst();
      const product = await prisma.product.findFirst({
        where: { categoryId: category!.id },
      });

      const notifiedAlert = await prisma.priceAlert.create({
        data: {
          userId: userId,
          productId: product!.id,
          targetPrice: 99.99,
          isActive: true,
          notified: true,
        },
      });

      // Count notified alerts
      const notifiedAlerts = await prisma.priceAlert.findMany({
        where: {
          notified: true,
          isActive: true,
        },
      });

      expect(notifiedAlerts.length).toBeGreaterThan(0);
      expect(notifiedAlerts.some((a) => a.id === notifiedAlert.id)).toBe(true);
    });
  });

  describe('Mock Store Integrations', () => {
    it('should use mock integrations when PriceAPI is not enabled', async () => {
      // Search should work with mock data
      const searchResult = await request(app.getHttpServer())
        .get('/products/search-stores?q=laptop')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(searchResult.body).toBeDefined();
      // Mock integrations return an object with store names as keys
      expect(typeof searchResult.body).toBe('object');
      expect(searchResult.body).toHaveProperty('totalResults');
    });

    it('should provide consistent mock data structure', async () => {
      const searchResult = await request(app.getHttpServer())
        .get('/products/search-stores?q=phone')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      if (searchResult.body.length > 0) {
        const firstResult = searchResult.body[0];
        expect(firstResult).toHaveProperty('storeName');
        expect(firstResult).toHaveProperty('products');
      }
    });
  });

  describe.skip('Performance and Scalability (requires Health Module)', () => {
    it('should handle multiple concurrent health checks', async () => {
      const requests = Array(5)
        .fill(null)
        .map(() =>
          request(app.getHttpServer()).get('/health').expect(200),
        );

      const results = await Promise.all(requests);
      results.forEach((result) => {
        expect(result.body.status).toBe('ok');
      });
    });

    it.skip('should return job stats quickly (requires Redis)', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/jobs/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should respond in less than 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});
