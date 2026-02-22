const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data (in order due to foreign keys)
  await prisma.savedComparison.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.listItem.deleteMany();
  await prisma.userList.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.productPrice.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.store.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleaned existing data');

  // Seed Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Home Decor',
        slug: 'home-decor',
        icon: '🏠',
        description: 'Transform your living space with stylish decor',
        shoppingTips: 'Compare prices across stores before buying. Look for seasonal sales!',
        displayOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Electronics',
        slug: 'electronics',
        icon: '📱',
        description: 'Latest gadgets and tech devices',
        shoppingTips: 'Check for warranty coverage and return policies',
        displayOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Groceries',
        slug: 'groceries',
        icon: '🛒',
        description: 'Fresh food and everyday essentials',
        shoppingTips: 'Look for weekly deals and bulk discounts',
        displayOrder: 3,
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Seed Stores
  const stores = await Promise.all([
    prisma.store.create({
      data: {
        name: 'Walmart',
        slug: 'walmart',
        logo: 'https://cdn.worldvectorlogo.com/logos/walmart-logo-2.svg',
        websiteUrl: 'https://www.walmart.com',
        apiEndpoint: 'https://developer.api.walmart.com',
        enabled: true,
      },
    }),
    prisma.store.create({
      data: {
        name: 'Amazon',
        slug: 'amazon',
        logo: 'https://cdn.worldvectorlogo.com/logos/amazon-1.svg',
        websiteUrl: 'https://www.amazon.com',
        apiEndpoint: 'https://webservices.amazon.com/paapi5',
        enabled: true,
      },
    }),
    prisma.store.create({
      data: {
        name: 'Target',
        slug: 'target',
        logo: 'https://cdn.worldvectorlogo.com/logos/target-1.svg',
        websiteUrl: 'https://www.target.com',
        apiEndpoint: 'https://api.target.com',
        enabled: true,
      },
    }),
  ]);

  console.log(`✅ Created ${stores.length} stores`);

  // Seed Products
  const products = await Promise.all([
    // Home Decor Products
    prisma.product.create({
      data: {
        name: 'Modern Ceramic Vase',
        description: 'Elegant white ceramic vase perfect for any room',
        images: ['https://picsum.photos/seed/vase1/400/400'],
        brand: 'HomeStyle',
        categoryId: categories[0].id,
        barcode: '123456789001',
        externalIds: { walmart: 'WM-VASE-001', amazon: 'AMZ-VASE-001', target: 'TGT-VASE-001' },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Decorative Wall Mirror',
        description: 'Round gold-framed wall mirror, 24 inch diameter',
        images: ['https://picsum.photos/seed/mirror1/400/400'],
        brand: 'ReflectHome',
        categoryId: categories[0].id,
        barcode: '123456789002',
        externalIds: { walmart: 'WM-MIRROR-001', amazon: 'AMZ-MIRROR-001', target: 'TGT-MIRROR-001' },
      },
    }),

    // Electronics
    prisma.product.create({
      data: {
        name: 'Wireless Bluetooth Headphones',
        description: 'Noise-cancelling over-ear headphones with 30hr battery',
        images: ['https://picsum.photos/seed/headphones1/400/400'],
        brand: 'SoundMax',
        categoryId: categories[1].id,
        barcode: '123456789003',
        externalIds: { walmart: 'WM-HEAD-001', amazon: 'AMZ-HEAD-001', target: 'TGT-HEAD-001' },
      },
    }),
    prisma.product.create({
      data: {
        name: 'USB-C Fast Charger 65W',
        description: 'Universal fast charger with dual ports',
        images: ['https://picsum.photos/seed/charger1/400/400'],
        brand: 'PowerTech',
        categoryId: categories[1].id,
        barcode: '123456789004',
        externalIds: { walmart: 'WM-CHRG-001', amazon: 'AMZ-CHRG-001', target: 'TGT-CHRG-001' },
      },
    }),

    // Groceries
    prisma.product.create({
      data: {
        name: 'Organic Honey 32oz',
        description: 'Pure organic wildflower honey',
        images: ['https://picsum.photos/seed/honey1/400/400'],
        brand: 'Nature\'s Best',
        categoryId: categories[2].id,
        barcode: '123456789005',
        externalIds: { walmart: 'WM-HONEY-001', amazon: 'AMZ-HONEY-001', target: 'TGT-HONEY-001' },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Olive Oil Extra Virgin 1L',
        description: 'Cold-pressed extra virgin olive oil from Italy',
        images: ['https://picsum.photos/seed/oil1/400/400'],
        brand: 'Mediterranean Gold',
        categoryId: categories[2].id,
        barcode: '123456789006',
        externalIds: { walmart: 'WM-OIL-001', amazon: 'AMZ-OIL-001', target: 'TGT-OIL-001' },
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  // Seed Product Prices (each product in each store)
  const productPrices = [];
  
  // Vase prices
  productPrices.push(
    await prisma.productPrice.create({
      data: { productId: products[0].id, storeId: stores[0].id, price: 24.99, inStock: true, productUrl: 'https://walmart.com/vase' },
    }),
    await prisma.productPrice.create({
      data: { productId: products[0].id, storeId: stores[1].id, price: 22.50, inStock: true, productUrl: 'https://amazon.com/vase' },
    }),
    await prisma.productPrice.create({
      data: { productId: products[0].id, storeId: stores[2].id, price: 26.99, inStock: true, productUrl: 'https://target.com/vase' },
    }),
  );

  // Mirror prices
  productPrices.push(
    await prisma.productPrice.create({
      data: { productId: products[1].id, storeId: stores[0].id, price: 89.99, inStock: true, productUrl: 'https://walmart.com/mirror' },
    }),
    await prisma.productPrice.create({
      data: { productId: products[1].id, storeId: stores[1].id, price: 84.95, inStock: true, productUrl: 'https://amazon.com/mirror' },
    }),
    await prisma.productPrice.create({
      data: { productId: products[1].id, storeId: stores[2].id, price: 92.50, inStock: false, productUrl: 'https://target.com/mirror' },
    }),
  );

  // Headphones prices
  productPrices.push(
    await prisma.productPrice.create({
      data: { productId: products[2].id, storeId: stores[0].id, price: 149.99, inStock: true, productUrl: 'https://walmart.com/headphones' },
    }),
    await prisma.productPrice.create({
      data: { productId: products[2].id, storeId: stores[1].id, price: 139.99, inStock: true, productUrl: 'https://amazon.com/headphones' },
    }),
    await prisma.productPrice.create({
      data: { productId: products[2].id, storeId: stores[2].id, price: 154.99, inStock: true, productUrl: 'https://target.com/headphones' },
    }),
  );

  // Charger prices
  productPrices.push(
    await prisma.productPrice.create({
      data: { productId: products[3].id, storeId: stores[0].id, price: 34.99, shippingCost: 0, inStock: true, productUrl: 'https://walmart.com/charger' },
    }),
    await prisma.productPrice.create({
      data: { productId: products[3].id, storeId: stores[1].id, price: 29.99, shippingCost: 0, inStock: true, productUrl: 'https://amazon.com/charger' },
    }),
    await prisma.productPrice.create({
      data: { productId: products[3].id, storeId: stores[2].id, price: 32.50, shippingCost: 5.99, inStock: true, productUrl: 'https://target.com/charger' },
    }),
  );

  // Honey prices
  productPrices.push(
    await prisma.productPrice.create({
      data: { productId: products[4].id, storeId: stores[0].id, price: 18.99, inStock: true, productUrl: 'https://walmart.com/honey' },
    }),
    await prisma.productPrice.create({
      data: { productId: products[4].id, storeId: stores[1].id, price: 16.75, inStock: true, productUrl: 'https://amazon.com/honey' },
    }),
    await prisma.productPrice.create({
      data: { productId: products[4].id, storeId: stores[2].id, price: 19.50, inStock: true, productUrl: 'https://target.com/honey' },
    }),
  );

  // Olive Oil prices
  productPrices.push(
    await prisma.productPrice.create({
      data: { productId: products[5].id, storeId: stores[0].id, price: 12.99, inStock: true, productUrl: 'https://walmart.com/oil' },
    }),
    await prisma.productPrice.create({
      data: { productId: products[5].id, storeId: stores[1].id, price: 11.50, inStock: true, productUrl: 'https://amazon.com/oil' },
    }),
    await prisma.productPrice.create({
      data: { productId: products[5].id, storeId: stores[2].id, price: 13.99, inStock: true, productUrl: 'https://target.com/oil' },
    }),
  );

  console.log(`✅ Created ${productPrices.length} product prices`);

  // Seed demo user
  const user = await prisma.user.create({
    data: {
      email: 'demo@pricelens.com',
      passwordHash: '$2b$10$rZvmYjQQZNPZLJdWjJ5j3eO.9kZ9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z', // "password123"
      firstName: 'Demo',
      lastName: 'User',
    },
  });

  console.log(`✅ Created demo user: ${user.email}`);

  // Seed User Lists
  const shoppingList = await prisma.userList.create({
    data: {
      userId: user.id,
      name: 'My Shopping List',
      description: 'Weekly grocery shopping',
      isDefault: true,
    },
  });

  const wishlist = await prisma.userList.create({
    data: {
      userId: user.id,
      name: 'Wishlist',
      description: 'Items I want to buy',
    },
  });

  console.log(`✅ Created 2 user lists`);

  // Seed List Items
  const listItems = await Promise.all([
    prisma.listItem.create({
      data: {
        listId: shoppingList.id,
        productId: products[4].id, // Honey
        quantity: 2,
        notes: 'Get the organic one',
      },
    }),
    prisma.listItem.create({
      data: {
        listId: shoppingList.id,
        productId: products[5].id, // Olive Oil
        quantity: 1,
        isPurchased: true,
      },
    }),
    prisma.listItem.create({
      data: {
        listId: wishlist.id,
        productId: products[2].id, // Headphones
        quantity: 1,
        notes: 'Wait for sale',
      },
    }),
  ]);

  console.log(`✅ Created ${listItems.length} list items`);

  // Seed Favorites
  const favorites = await Promise.all([
    prisma.favorite.create({
      data: {
        userId: user.id,
        productId: products[0].id, // Vase
      },
    }),
    prisma.favorite.create({
      data: {
        userId: user.id,
        productId: products[1].id, // Mirror
      },
    }),
    prisma.favorite.create({
      data: {
        userId: user.id,
        productId: products[3].id, // Charger
      },
    }),
  ]);

  console.log(`✅ Created ${favorites.length} favorites`);

  // Seed Saved Comparisons
  const comparisons = await Promise.all([
    prisma.savedComparison.create({
      data: {
        userId: user.id,
        productId: products[2].id, // Headphones
        notes: 'Amazon has best price',
      },
    }),
    prisma.savedComparison.create({
      data: {
        userId: user.id,
        productId: products[4].id, // Honey
        notes: 'Check again next week',
      },
    }),
  ]);

  console.log(`✅ Created ${comparisons.length} saved comparisons`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });