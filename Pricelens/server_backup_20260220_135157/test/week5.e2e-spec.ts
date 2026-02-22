import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Week 5: Advanced Features (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let storeId: string;
  let categoryId: string;
  let productId: string;
  let locationId: string;
  let advertisementId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean up any existing test user
    await prisma.user.deleteMany({
      where: { email: 'week5test@example.com' },
    });

    // Clean up existing test data
    await prisma.category.deleteMany({
      where: { slug: 'groceries' },
    });
    await prisma.store.deleteMany({
      where: { slug: { in: ['walmart', 'target'] } },
    });

    // Register and login
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'week5test@example.com',
        password: 'Test123!@#',
        firstName: 'Week',
        lastName: 'Five',
      })
      .expect(201);

    accessToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;

    // Create test data
    const category = await prisma.category.create({
      data: {
        name: 'Groceries',
        slug: 'groceries',
        description: 'Fresh groceries',
      },
    });
    categoryId = category.id;

    const store = await prisma.store.create({
      data: {
        name: 'Walmart',
        slug: 'walmart',
        websiteUrl: 'https://walmart.com',
      },
    });
    storeId = store.id;

    const product = await prisma.product.create({
      data: {
        name: 'Whole Milk',
        categoryId,
        description: '1 Gallon',
        brand: 'Great Value',
        subcategory: 'Dairy',
      },
    });
    productId = product.id;

    await prisma.productPrice.create({
      data: {
        productId,
        storeId,
        price: 3.99,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'week5test@example.com' },
    });
    await app.close();
  });

  describe('Store Locations', () => {
    it('should create a store location', async () => {
      const response = await request(app.getHttpServer())
        .post(`/store-locations/${storeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          latitude: 40.7506,
          longitude: -73.9971,
          phone: '(555) 123-4567',
          hours: 'Mon-Fri 9am-9pm',
        })
        .expect(201);

      expect(response.body.address).toBe('123 Main St');
      expect(response.body.zipCode).toBe('10001');
      expect(response.body.store.name).toBe('Walmart');
      locationId = response.body.id;
    });

    it.skip('should find stores near a location', async () => {
      const response = await request(app.getHttpServer())
        .get('/store-locations/nearby')
        .query({ latitude: 40.7506, longitude: -73.9971, radius: 10 })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].zipCode).toBe('10001');
    });

    it('should get locations by store', async () => {
      const response = await request(app.getHttpServer())
        .get(`/store-locations/store/${storeId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].storeId).toBe(storeId);
    });

    it('should get locations by ZIP code', async () => {
      const response = await request(app.getHttpServer())
        .get('/store-locations/zip/10001')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Advertisements', () => {
    it('should create an advertisement', async () => {
      const response = await request(app.getHttpServer())
        .post('/advertisements')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          categoryId,
          title: 'Save 20% on Groceries',
          description: 'Limited time offer',
          imageUrl: 'https://example.com/ad.jpg',
          ctaText: 'Shop Now',
          ctaUrl: 'https://walmart.com/sale',
          sponsorName: 'Walmart',
          isActive: true,
          displayOrder: 1,
        })
        .expect(201);

      expect(response.body.title).toBe('Save 20% on Groceries');
      expect(response.body.sponsorName).toBe('Walmart');
      advertisementId = response.body.id;
    });

    it('should get all active advertisements', async () => {
      const response = await request(app.getHttpServer())
        .get('/advertisements')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get advertisements by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/advertisements')
        .query({ categoryId })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].categoryId).toBe(categoryId);
    });

    it('should get featured advertisements', async () => {
      // Create a featured ad (no category)
      await request(app.getHttpServer())
        .post('/advertisements')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Featured: Black Friday Sale',
          description: 'Site-wide savings',
          ctaUrl: 'https://walmart.com/black-friday',
          sponsorName: 'Walmart',
          isActive: true,
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/advertisements/featured')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should track advertisement impression', async () => {
      const response = await request(app.getHttpServer())
        .post(`/advertisements/${advertisementId}/impression`)
        .expect(201);

      expect(response.body.impressions).toBe(1);
    });

    it('should track advertisement click', async () => {
      const response = await request(app.getHttpServer())
        .post(`/advertisements/${advertisementId}/click`)
        .expect(201);

      expect(response.body.clicks).toBe(1);
    });

    it('should update an advertisement', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/advertisements/${advertisementId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated: Save 30% on Groceries',
          isActive: false,
        })
        .expect(200);

      expect(response.body.title).toBe('Updated: Save 30% on Groceries');
      expect(response.body.isActive).toBe(false);
    });
  });

  describe('User Preferences', () => {
    it('should get or create user preferences', async () => {
      const response = await request(app.getHttpServer())
        .get('/user-preferences')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.userId).toBe(userId);
      expect(response.body.searchRadius).toBe(10); // Default value
      expect(response.body.priceAlertEmail).toBe(true);
    });

    it('should update user preferences', async () => {
      const response = await request(app.getHttpServer())
        .patch('/user-preferences')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          defaultStores: [storeId],
          searchRadius: 25,
          preferredZipCode: '10001',
          priceAlertEmail: false,
          trendingEmail: true,
        })
        .expect(200);

      expect(response.body.searchRadius).toBe(25);
      expect(response.body.preferredZipCode).toBe('10001');
      expect(response.body.priceAlertEmail).toBe(false);
      expect(response.body.trendingEmail).toBe(true);
      expect(response.body.defaultStores).toContain(storeId);
    });

    it('should require authentication for user preferences', async () => {
      await request(app.getHttpServer())
        .get('/user-preferences')
        .expect(401);
    });
  });

  describe('Advanced Product Search', () => {
    beforeAll(async () => {
      // Create more test products for search
      const targetStore = await prisma.store.create({
        data: {
          name: 'Target',
          slug: 'target',
          websiteUrl: 'https://target.com',
        },
      });

      const product2 = await prisma.product.create({
        data: {
          name: 'Skim Milk',
          categoryId,
          description: '1 Gallon',
          brand: 'Organic Valley',
          subcategory: 'Dairy',
        },
      });

      await prisma.productPrice.createMany({
        data: [
          {
            productId: product2.id,
            storeId,
            price: 4.99,
          },
          {
            productId: product2.id,
            storeId: targetStore.id,
            price: 5.49,
          },
        ],
      });
    });

    it('should search products with basic query', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/search/advanced')
        .query({ query: 'milk' })
        .expect(200);

      expect(response.body.products).toBeDefined();
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/search/advanced')
        .query({ query: 'milk', categorySlug: 'groceries' })
        .expect(200);

      expect(response.body.products.length).toBeGreaterThan(0);
      expect(response.body.filters.categorySlug).toBe('groceries');
    });

    it('should filter by subcategory', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/search/advanced')
        .query({ query: 'milk', subcategory: 'Dairy' })
        .expect(200);

      expect(response.body.products.length).toBeGreaterThan(0);
      expect(response.body.filters.subcategory).toBe('Dairy');
    });

    it.skip('should filter by stores', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/search/advanced')
        .query({ query: 'milk', stores: 'walmart' })
        .expect(200);

      expect(response.body.products.length).toBeGreaterThan(0);
      expect(response.body.filters.stores).toContain('walmart');
    });

    it('should sort by price low to high', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/search/advanced')
        .query({ query: 'milk', sortBy: 'price_low' })
        .expect(200);

      const products = response.body.products;
      if (products.length > 1) {
        const firstPrice = Math.min(...products[0].prices.map((p) => Number(p.price)));
        const lastPrice = Math.min(...products[products.length - 1].prices.map((p) => Number(p.price)));
        expect(firstPrice).toBeLessThanOrEqual(lastPrice);
      }
    });

    it('should filter by price range', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/search/advanced')
        .query({ query: 'milk', minPrice: 3, maxPrice: 5 })
        .expect(200);

      expect(response.body.products.length).toBeGreaterThan(0);
      response.body.products.forEach((product) => {
        const prices = product.prices.map((p) => Number(p.price));
        const minPrice = Math.min(...prices);
        expect(minPrice).toBeGreaterThanOrEqual(3);
        expect(minPrice).toBeLessThanOrEqual(5);
      });
    });

    it('should sort by name ascending', async () => {
      const response = await request(app.getHttpServer())
        .get('/products/search/advanced')
        .query({ query: 'milk', sortBy: 'name_asc' })
        .expect(200);

      const products = response.body.products;
      if (products.length > 1) {
        const firstName = products[0].name.toLowerCase();
        const lastName = products[products.length - 1].name.toLowerCase();
        expect(firstName.localeCompare(lastName)).toBeLessThanOrEqual(0);
      }
    });
  });
});
