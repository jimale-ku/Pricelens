import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'groceries' },
      update: {},
      create: {
        name: 'Groceries',
        slug: 'groceries',
        icon: '🛒',
        description: 'Fresh food and everyday essentials',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: {
        name: 'Electronics',
        slug: 'electronics',
        icon: '📱',
        description: 'Latest gadgets and technology',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'home-garden' },
      update: {},
      create: {
        name: 'Home & Garden',
        slug: 'home-garden',
        icon: '🏠',
        description: 'Everything for your home',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'clothing' },
      update: {},
      create: {
        name: 'Clothing',
        slug: 'clothing',
        icon: '👕',
        description: 'Fashion and apparel',
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create stores
  const stores = await Promise.all([
    prisma.store.upsert({
      where: { slug: 'walmart' },
      update: {},
      create: {
        name: 'Walmart',
        slug: 'walmart',
        logo: 'https://logo.clearbit.com/walmart.com',
        websiteUrl: 'https://walmart.com',
        enabled: true,
      },
    }),
    prisma.store.upsert({
      where: { slug: 'amazon' },
      update: {},
      create: {
        name: 'Amazon',
        slug: 'amazon',
        logo: 'https://logo.clearbit.com/amazon.com',
        websiteUrl: 'https://amazon.com',
        enabled: true,
      },
    }),
    prisma.store.upsert({
      where: { slug: 'target' },
      update: {},
      create: {
        name: 'Target',
        slug: 'target',
        logo: 'https://logo.clearbit.com/target.com',
        websiteUrl: 'https://target.com',
        enabled: true,
      },
    }),
  ]);

  console.log(`✅ Created ${stores.length} stores`);

  // Add store locations
  await prisma.storeLocation.createMany({
    data: [
      {
        storeId: stores[0].id, // Walmart
        address: '1234 Market St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        latitude: 37.7749,
        longitude: -122.4194,
        phone: '(415) 555-1000',
        hours: 'Mon-Sun 7am-11pm',
      },
      {
        storeId: stores[0].id,
        address: '5678 Broadway',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        latitude: 40.7506,
        longitude: -73.9971,
        phone: '(212) 555-2000',
        hours: 'Mon-Sun 24 hours',
      },
      {
        storeId: stores[2].id, // Target
        address: '910 Main Ave',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
        latitude: 33.9731,
        longitude: -118.2479,
        phone: '(323) 555-3000',
        hours: 'Mon-Sun 8am-10pm',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created store locations');

  // Create sample products
  const products = [
    // Groceries
    {
      name: 'Organic Whole Milk',
      description: '1 Gallon, Grade A',
      brand: 'Horizon Organic',
      categoryId: categories[0].id,
      subcategory: 'Dairy',
      images: ['https://via.placeholder.com/300x300?text=Milk'],
    },
    {
      name: 'Cage-Free Large Eggs',
      description: '12 count',
      brand: 'Happy Eggs',
      categoryId: categories[0].id,
      subcategory: 'Dairy',
      images: ['https://via.placeholder.com/300x300?text=Eggs'],
    },
    {
      name: 'Organic Bananas',
      description: 'Per lb',
      brand: 'Fresh Produce',
      categoryId: categories[0].id,
      subcategory: 'Produce',
      images: ['https://via.placeholder.com/300x300?text=Bananas'],
    },
    // Electronics
    {
      name: 'iPhone 15 Pro',
      description: '256GB, Titanium Blue',
      brand: 'Apple',
      categoryId: categories[1].id,
      subcategory: 'Smartphones',
      images: ['https://via.placeholder.com/300x300?text=iPhone'],
    },
    {
      name: 'MacBook Air M3',
      description: '13-inch, 16GB RAM, 512GB SSD',
      brand: 'Apple',
      categoryId: categories[1].id,
      subcategory: 'Laptops',
      images: ['https://via.placeholder.com/300x300?text=MacBook'],
    },
    {
      name: 'AirPods Pro 2',
      description: 'Wireless Earbuds with MagSafe',
      brand: 'Apple',
      categoryId: categories[1].id,
      subcategory: 'Audio',
      images: ['https://via.placeholder.com/300x300?text=AirPods'],
    },
  ];

  for (const productData of products) {
    const product = await prisma.product.create({
      data: productData,
    });

    // Add random prices from different stores
    await prisma.productPrice.createMany({
      data: [
        {
          productId: product.id,
          storeId: stores[0].id,
          price: Math.random() * 100 + 10,
          inStock: true,
        },
        {
          productId: product.id,
          storeId: stores[1].id,
          price: Math.random() * 100 + 10,
          inStock: true,
        },
        {
          productId: product.id,
          storeId: stores[2].id,
          price: Math.random() * 100 + 10,
          inStock: Math.random() > 0.3,
        },
      ],
    });
  }

  console.log(`✅ Created ${products.length} products with prices`);

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
