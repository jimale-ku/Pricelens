import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * WEEK 3 INTEGRATION TESTS
 * Tests user features:
 * - Shopping Lists (create, read, update, delete)
 * - List Items (add, update, remove, mark purchased)
 * - Favorites (add, get, remove)
 * - Saved Comparisons (save, get, delete)
 */
describe('Week 3: User Features (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let productId: string;
  let listId: string;
  let itemId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up test data
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({ where: { email: 'testuser@pricelens.com' } });

    // Get a product ID for testing
    const product = await prisma.product.findFirst();
    productId = product.id;

    // Register a new test user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'testuser@pricelens.com',
        password: 'testpass123',
        firstName: 'Test',
        lastName: 'User',
      })
      .expect(201);

    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Shopping Lists API', () => {
    it('/lists (POST) - should create a new list', () => {
      return request(app.getHttpServer())
        .post('/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Shopping List',
          description: 'My test list',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Shopping List');
          expect(res.body.description).toBe('My test list');
          expect(res.body._count.items).toBe(0);
          listId = res.body.id; // Save for later tests
        });
    });

    it('/lists (GET) - should return all user lists', () => {
      return request(app.getHttpServer())
        .get('/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('_count');
        });
    });

    it('/lists/:id (GET) - should return specific list with items', () => {
      return request(app.getHttpServer())
        .get(`/lists/${listId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(listId);
          expect(res.body).toHaveProperty('items');
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });

    it('/lists/:id (PATCH) - should update list name', () => {
      return request(app.getHttpServer())
        .patch(`/lists/${listId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated List Name' })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated List Name');
        });
    });

    it('/lists (POST) - should require authentication', () => {
      return request(app.getHttpServer())
        .post('/lists')
        .send({ name: 'Test' })
        .expect(401);
    });
  });

  describe('List Items API', () => {
    it('/lists/:id/items (POST) - should add item to list', () => {
      return request(app.getHttpServer())
        .post(`/lists/${listId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 2,
          notes: 'Test notes',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.quantity).toBe(2);
          expect(res.body.notes).toBe('Test notes');
          expect(res.body.product).toHaveProperty('name');
          expect(res.body.product).toHaveProperty('prices');
          itemId = res.body.id; // Save for later tests
        });
    });

    it('/lists/:id/items (POST) - should update quantity if item already exists', async () => {
      const response = await request(app.getHttpServer())
        .post(`/lists/${listId}/items`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          quantity: 1,
        })
        .expect(201);

      // Quantity should be 3 now (2 + 1)
      expect(response.body.quantity).toBe(3);
    });

    it('/lists/:id/items/:itemId (PATCH) - should update item', () => {
      return request(app.getHttpServer())
        .patch(`/lists/${listId}/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 5,
          notes: 'Updated notes',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.quantity).toBe(5);
          expect(res.body.notes).toBe('Updated notes');
        });
    });

    it('/lists/:id/items/:itemId/purchase (POST) - should mark as purchased', () => {
      return request(app.getHttpServer())
        .post(`/lists/${listId}/items/${itemId}/purchase`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ isPurchased: true })
        .expect(201)
        .expect((res) => {
          expect(res.body.isPurchased).toBe(true);
        });
    });

    it('/lists/:id/total (GET) - should calculate total cost', () => {
      return request(app.getHttpServer())
        .get(`/lists/${listId}/total`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('estimatedTotal');
          expect(res.body).toHaveProperty('totalItems');
          expect(res.body).toHaveProperty('currency', 'USD');
        });
    });

    it('/lists/:id/items/:itemId (DELETE) - should remove item from list', () => {
      return request(app.getHttpServer())
        .delete(`/lists/${listId}/items/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('removed');
        });
    });
  });

  describe('Favorites API', () => {
    it('/favorites/:productId (POST) - should add to favorites', () => {
      return request(app.getHttpServer())
        .post(`/favorites/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.productId).toBe(productId);
          expect(res.body.product).toHaveProperty('name');
          expect(res.body.product).toHaveProperty('prices');
        });
    });

    it('/favorites/:productId (POST) - should not allow duplicate favorites', () => {
      return request(app.getHttpServer())
        .post(`/favorites/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);
    });

    it('/favorites (GET) - should return all favorites', () => {
      return request(app.getHttpServer())
        .get('/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0].product).toHaveProperty('prices');
        });
    });

    it('/favorites/:productId/check (GET) - should check if favorited', () => {
      return request(app.getHttpServer())
        .get(`/favorites/${productId}/check`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.isFavorite).toBe(true);
        });
    });

    it('/favorites/:productId (DELETE) - should remove from favorites', () => {
      return request(app.getHttpServer())
        .delete(`/favorites/${productId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('Removed');
        });
    });
  });

  describe('Saved Comparisons API', () => {
    let comparisonId: string;

    it('/comparisons (POST) - should save a comparison', () => {
      return request(app.getHttpServer())
        .post('/comparisons')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId,
          notes: 'Best price at Amazon',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.productId).toBe(productId);
          expect(res.body.notes).toBe('Best price at Amazon');
          expect(res.body.product).toHaveProperty('prices');
          comparisonId = res.body.id;
        });
    });

    it('/comparisons (GET) - should return saved comparisons', () => {
      return request(app.getHttpServer())
        .get('/comparisons')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0].product).toHaveProperty('prices');
        });
    });

    it('/comparisons/:id (DELETE) - should delete comparison', () => {
      return request(app.getHttpServer())
        .delete(`/comparisons/${comparisonId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('deleted');
        });
    });
  });

  describe('Authorization Tests', () => {
    it('should not allow access to other users lists', async () => {
      // Create a list first
      const myListResponse = await request(app.getHttpServer())
        .post('/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Private List' });

      const privateListId = myListResponse.body.id;

      // Create another user
      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'other@pricelens.com',
          password: 'password123',
          firstName: 'Other',
          lastName: 'User',
        });

      const otherToken = otherUserResponse.body.accessToken;

      // Try to access first user's list
      await request(app.getHttpServer())
        .get(`/lists/${privateListId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(401); // Returns 401 Unauthorized when trying to access other user's resources

      // Clean up the private list
      await request(app.getHttpServer())
        .delete(`/lists/${privateListId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });
  });

  describe('Cleanup', () => {
    it('/lists/:id (DELETE) - should delete list', () => {
      return request(app.getHttpServer())
        .delete(`/lists/${listId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('deleted');
        });
    });
  });
});
