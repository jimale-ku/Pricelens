import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive seed...\n');

  // 1. Create Categories
  console.log('📁 Creating categories...');
  const groceries = await prisma.category.upsert({
    where: { slug: 'groceries' },
    update: {},
    create: {
      name: 'Groceries',
      slug: 'groceries',
      icon: 'shopping-cart',
      description: 'Fresh produce, dairy, and everyday essentials',
      displayOrder: 1,
    },
  });

  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      icon: 'laptop',
      description: 'Phones, computers, and tech gadgets',
      displayOrder: 2,
    },
  });

  // 2. Create Stores with Logos
  console.log('🏪 Creating stores...');
  
  const stores = await Promise.all([
    prisma.store.upsert({
      where: { slug: 'walmart' },
      update: {},
      create: {
        name: 'Walmart',
        slug: 'walmart',
        logo: 'https://logo.clearbit.com/walmart.com',
        websiteUrl: 'https://www.walmart.com',
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
        websiteUrl: 'https://www.target.com',
        enabled: true,
      },
    }),
    prisma.store.upsert({
      where: { slug: 'costco' },
      update: {},
      create: {
        name: 'Costco',
        slug: 'costco',
        logo: 'https://logo.clearbit.com/costco.com',
        websiteUrl: 'https://www.costco.com',
        enabled: true,
      },
    }),
    prisma.store.upsert({
      where: { slug: 'kroger' },
      update: {},
      create: {
        name: 'Kroger',
        slug: 'kroger',
        logo: 'https://logo.clearbit.com/kroger.com',
        websiteUrl: 'https://www.kroger.com',
        enabled: true,
      },
    }),
    prisma.store.upsert({
      where: { slug: 'aldi' },
      update: {},
      create: {
        name: 'Aldi',
        slug: 'aldi',
        logo: 'https://logo.clearbit.com/aldi.us',
        websiteUrl: 'https://www.aldi.us',
        enabled: true,
      },
    }),
    prisma.store.upsert({
      where: { slug: 'whole-foods' },
      update: {},
      create: {
        name: 'Whole Foods',
        slug: 'whole-foods',
        logo: 'https://logo.clearbit.com/wholefoodsmarket.com',
        websiteUrl: 'https://www.wholefoodsmarket.com',
        enabled: true,
      },
    }),
    prisma.store.upsert({
      where: { slug: 'trader-joes' },
      update: {},
      create: {
        name: "Trader Joe's",
        slug: 'trader-joes',
        logo: 'https://logo.clearbit.com/traderjoes.com',
        websiteUrl: 'https://www.traderjoes.com',
        enabled: true,
      },
    }),
    prisma.store.upsert({
      where: { slug: 'safeway' },
      update: {},
      create: {
        name: 'Safeway',
        slug: 'safeway',
        logo: 'https://logo.clearbit.com/safeway.com',
        websiteUrl: 'https://www.safeway.com',
        enabled: true,
      },
    }),
    prisma.store.upsert({
      where: { slug: 'food-lion' },
      update: {},
      create: {
        name: 'Food Lion',
        slug: 'food-lion',
        logo: 'https://logo.clearbit.com/foodlion.com',
        websiteUrl: 'https://www.foodlion.com',
        enabled: true,
      },
    }),
    prisma.store.upsert({
      where: { slug: 'king-soopers' },
      update: {},
      create: {
        name: 'King Soopers',
        slug: 'king-soopers',
        logo: 'https://logo.clearbit.com/kingsoopers.com',
        websiteUrl: 'https://www.kingsoopers.com',
        enabled: true,
      },
    }),
    prisma.store.upsert({
      where: { slug: 'amazon-fresh' },
      update: {},
      create: {
        name: 'Amazon Fresh',
        slug: 'amazon-fresh',
        logo: 'https://logo.clearbit.com/amazon.com',
        websiteUrl: 'https://www.amazon.com/fresh',
        enabled: true,
      },
    }),
  ]);

  console.log(`✅ Created ${stores.length} stores\n`);

  // 3. Create Products with Multi-Store Prices
  console.log('🛒 Creating products with prices across all stores...\n');

  // Organic Bananas (from your screenshot)
  const bananas = await prisma.product.create({
    data: {
      name: 'Organic Bananas',
      description: 'Fresh organic bananas, sold per pound',
      categoryId: groceries.id,
      subcategory: 'produce',
      brand: 'Organic',
      images: [
        'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400',
      ],
      barcode: '4011',
      prices: {
        create: [
          { storeId: stores[2].id, price: 0.49, inStock: true }, // Costco - Best Price
          { storeId: stores[4].id, price: 0.53, inStock: true }, // Aldi
          { storeId: stores[0].id, price: 0.54, inStock: true }, // Walmart
          { storeId: stores[3].id, price: 0.59, inStock: true }, // Kroger
          { storeId: stores[9].id, price: 0.59, inStock: true }, // King Soopers
          { storeId: stores[8].id, price: 0.62, inStock: true }, // Food Lion
          { storeId: stores[1].id, price: 0.64, inStock: true }, // Target
          { storeId: stores[7].id, price: 0.67, inStock: true }, // Safeway
          { storeId: stores[10].id, price: 0.69, inStock: true }, // Amazon Fresh
          { storeId: stores[6].id, price: 0.69, inStock: true }, // Trader Joe's
          { storeId: stores[5].id, price: 0.79, inStock: true }, // Whole Foods
        ],
      },
    },
  });

  // Whole Milk
  const milk = await prisma.product.create({
    data: {
      name: 'Whole Milk (1 Gallon)',
      description: 'Fresh whole milk, 1 gallon',
      categoryId: groceries.id,
      subcategory: 'dairy',
      brand: 'Various',
      images: [
        'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
      ],
      barcode: '0001111',
      prices: {
        create: [
          { storeId: stores[4].id, price: 2.89, inStock: true }, // Aldi
          { storeId: stores[0].id, price: 2.99, inStock: true }, // Walmart
          { storeId: stores[2].id, price: 3.19, inStock: true }, // Costco
          { storeId: stores[3].id, price: 3.29, inStock: true }, // Kroger
          { storeId: stores[1].id, price: 3.49, inStock: true }, // Target
          { storeId: stores[7].id, price: 3.79, inStock: true }, // Safeway
          { storeId: stores[6].id, price: 3.99, inStock: true }, // Trader Joe's
          { storeId: stores[5].id, price: 4.49, inStock: true }, // Whole Foods
        ],
      },
    },
  });

  // Eggs
  const eggs = await prisma.product.create({
    data: {
      name: 'Large Eggs (12 Count)',
      description: 'Grade A large eggs, dozen',
      categoryId: groceries.id,
      subcategory: 'dairy',
      brand: 'Various',
      images: [
        'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400',
      ],
      barcode: '0001112',
      prices: {
        create: [
          { storeId: stores[4].id, price: 1.99, inStock: true }, // Aldi
          { storeId: stores[0].id, price: 2.29, inStock: true }, // Walmart
          { storeId: stores[2].id, price: 2.49, inStock: true }, // Costco
          { storeId: stores[3].id, price: 2.79, inStock: true }, // Kroger
          { storeId: stores[1].id, price: 2.99, inStock: true }, // Target
          { storeId: stores[6].id, price: 3.49, inStock: true }, // Trader Joe's
          { storeId: stores[5].id, price: 3.99, inStock: true }, // Whole Foods
        ],
      },
    },
  });

  // Bread
  const bread = await prisma.product.create({
    data: {
      name: 'Whole Wheat Bread',
      description: 'Fresh whole wheat bread, 20 oz loaf',
      categoryId: groceries.id,
      subcategory: 'bakery',
      brand: 'Various',
      images: [
        'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
      ],
      barcode: '0001113',
      prices: {
        create: [
          { storeId: stores[4].id, price: 1.49, inStock: true }, // Aldi
          { storeId: stores[0].id, price: 1.68, inStock: true }, // Walmart
          { storeId: stores[3].id, price: 1.99, inStock: true }, // Kroger
          { storeId: stores[1].id, price: 2.29, inStock: true }, // Target
          { storeId: stores[6].id, price: 2.99, inStock: true }, // Trader Joe's
          { storeId: stores[5].id, price: 3.49, inStock: true }, // Whole Foods
        ],
      },
    },
  });

  // iPhone 15
  const iphone = await prisma.product.create({
    data: {
      name: 'Apple iPhone 15 (128GB)',
      description: 'Latest iPhone with advanced camera system',
      categoryId: electronics.id,
      subcategory: 'smartphones',
      brand: 'Apple',
      images: [
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400',
      ],
      barcode: '0194253244622',
      prices: {
        create: [
          { storeId: stores[0].id, price: 799.00, inStock: true }, // Walmart
          { storeId: stores[1].id, price: 799.00, inStock: true }, // Target
          { storeId: stores[2].id, price: 749.99, inStock: true }, // Costco
          { storeId: stores[10].id, price: 799.00, inStock: true }, // Amazon
        ],
      },
    },
  });

  console.log('✅ Created sample products:\n');
  console.log(`   - ${bananas.name}`);
  console.log(`   - ${milk.name}`);
  console.log(`   - ${eggs.name}`);
  console.log(`   - ${bread.name}`);
  console.log(`   - ${iphone.name}\n`);

  console.log('🎉 Seed completed successfully!');
  console.log('\n📊 Database Summary:');
  console.log(`   - Categories: ${await prisma.category.count()}`);
  console.log(`   - Stores: ${await prisma.store.count()}`);
  console.log(`   - Products: ${await prisma.product.count()}`);
  console.log(`   - Price Points: ${await prisma.productPrice.count()}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
