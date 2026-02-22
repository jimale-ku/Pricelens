import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * WEEK 4 INTEGRATION TESTS
 * Tests analytics and insights features:
 * - Price Insights (lowest, average, highest, savings)
 * - Trending Products
 * - Popular Items by Category
 * - Price Alerts (create, read, update, delete)
 */
describe('Week 4: Analytics & Insights (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let productId: string;
  let categoryId: string;
  let alertId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up test user
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({ where: { email: 'week4test@pricelens.com' } });

    // Get test data IDs
    const product = await prisma.product.findFirst();
    productId = product.id;
    categoryId = product.categoryId;

    // Register test user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'week4test@pricelens.com',
        password: 'testpass123',
        firstName: 'Week4',
        lastName: 'Test',
      })
      .expect(201);

    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Price Insights API', () => {
    it('/insights/products/:id/price-insights (GET) - should return price insights', () => {
      return request(app.getHttpServer())
        .get(`/insights/products/${productId}/price-insights`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('productId');
          expect(res.body).toHaveProperty('productName');
          expect(res.body).toHaveProperty('lowest');
          expect(res.body).toHaveProperty('average');
          expect(res.body).toHaveProperty('highest');
          expect(res.body).toHaveProperty('savings');
          expect(res.body).toHaveProperty('storeCount');
          expect(res.body).toHaveProperty('priceRange');

          // Verify lowest price structure
          expect(res.body.lowest).toHaveProperty('price');
          expect(res.body.lowest).toHaveProperty('store');
          expect(res.body.lowest.store).toHaveProperty('name');

          // Verify highest price structure
          expect(res.body.highest).toHaveProperty('price');
          expect(res.body.highest).toHaveProperty('store');

          // Verify calculations
          expect(res.body.savings).toBeGreaterThanOrEqual(0);
          expect(res.body.average).toBeGreaterThanOrEqual(res.body.lowest.price);
          expect(res.body.average).toBeLessThanOrEqual(res.body.highest.price);
        });
    });

    it('/insights/products/:id/price-insights (GET) - should 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/insights/products/non-existent-id/price-insights')
        .expect(404);
    });
  });

  describe('Trending Products API', () => {
    it('/insights/products/trending (GET) - should return trending products', () => {
      return request(app.getHttpServer())
        .get('/insights/products/trending')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            const product = res.body[0];
            expect(product).toHaveProperty('id');
            expect(product).toHaveProperty('name');
            expect(product).toHaveProperty('category');
            expect(product).toHaveProperty('searchCount');
            expect(product).toHaveProperty('viewCount');
            expect(product).toHaveProperty('lowestPrice');
            expect(product).toHaveProperty('storeCount');
          }
        });
    });

    it('/insights/products/trending (GET) - should respect limit parameter', () => {
      return request(app.getHttpServer())
        .get('/insights/products/trending?limit=3')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(3);
        });
    });
  });

  describe('Popular Items by Category API', () => {
    it('/insights/categories/:id/popular (GET) - should return popular items', () => {
      return request(app.getHttpServer())
        .get(`/insights/categories/${categoryId}/popular`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            const product = res.body[0];
            expect(product).toHaveProperty('id');
            expect(product).toHaveProperty('name');
            expect(product).toHaveProperty('searchCount');
            expect(product).toHaveProperty('viewCount');
          }
        });
    });

    it('/insights/categories/:id/popular (GET) - should respect limit parameter', () => {
      return request(app.getHttpServer())
        .get(`/insights/categories/${categoryId}/popular?limit=2`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(2);
        });
    });
  });

  describe('Price Alerts API', () => {
    it('/alerts (POST) - should create a price alert', () => {
      return request(app.getHttpServer())
        .post('/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productId,
          targetPrice: 10.00,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('userId', userId);
          expect(res.body).toHaveProperty('productId', productId);
          expect(res.body).toHaveProperty('targetPrice');
          expect(res.body).toHaveProperty('isActive', true);
          expect(res.body).toHaveProperty('notified', false);
          alertId = res.body.id;
        });
    });

    it('/alerts (POST) - should reject duplicate alerts', () => {
      return request(app.getHttpServer())
        .post('/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: productId,
          targetPrice: 15.00,
        })
        .expect(400);
    });

    it('/alerts (POST) - should require authentication', () => {
      return request(app.getHttpServer())
        .post('/alerts')
        .send({
          productId: productId,
          targetPrice: 10.00,
        })
        .expect(401);
    });

    it('/alerts (GET) - should return all user alerts', () => {
      return request(app.getHttpServer())
        .get('/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);

          const alert = res.body[0];
          expect(alert).toHaveProperty('id');
          expect(alert).toHaveProperty('productId');
          expect(alert).toHaveProperty('targetPrice');
          expect(alert).toHaveProperty('product');
          expect(alert).toHaveProperty('currentLowestPrice');
          expect(alert).toHaveProperty('priceReached');
        });
    });

    it('/alerts/:id (PATCH) - should update alert target price', () => {
      return request(app.getHttpServer())
        .patch(`/alerts/${alertId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          targetPrice: 12.50,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('targetPrice');
          expect(Number(res.body.targetPrice)).toBe(12.50);
          expect(res.body).toHaveProperty('notified', false);
        });
    });

    it('/alerts/:id/deactivate (POST) - should deactivate alert', () => {
      return request(app.getHttpServer())
        .post(`/alerts/${alertId}/deactivate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('isActive', false);
        });
    });

    it('/alerts/:id (DELETE) - should delete alert', () => {
      return request(app.getHttpServer())
        .delete(`/alerts/${alertId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('/alerts (GET) - should return empty array after deletion', () => {
      return request(app.getHttpServer())
        .get('/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });
  });

  describe('Authorization Tests', () => {
    it('should not allow access without token', () => {
      return request(app.getHttpServer())
        .get('/alerts')
        .expect(401);
    });

    it('should not allow invalid token', () => {
      return request(app.getHttpServer())
        .get('/alerts')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
