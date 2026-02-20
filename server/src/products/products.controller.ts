import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AdvancedSearchDto } from './dto/advanced-search.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new product (Admin)' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiResponse({ status: 200, description: 'Returns all products with prices' })
  findAll(@Query('categoryId') categoryId?: string) {
    return this.productsService.findAll(categoryId);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular/trending products with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts at 1)' })
  @ApiQuery({ name: 'categorySlug', required: false, description: 'Filter by category slug' })
  @ApiQuery({ name: 'subcategory', required: false, description: 'Filter by subcategory (e.g., "mystery", "fiction")' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of products to return (default: 6)' })
  @ApiQuery({ name: 'stores', required: false, description: 'Comma-separated list of store slugs to filter by' })
  @ApiResponse({ status: 200, description: 'Returns popular products based on search/view count' })
  getPopular(
    @Query('categorySlug') categorySlug?: string,
    @Query('subcategory') subcategory?: string,
    @Query('limit') limit?: string,
    @Query('stores') stores?: string,
    @Query('page') page?: string,
  ) {
    const storeSlugs = stores ? stores.split(',').map(s => s.trim()).filter(Boolean) : undefined;
    const pageNum = page ? parseInt(page) : 1;
    return this.productsService.getPopular(categorySlug, limit ? parseInt(limit) : 6, storeSlugs, subcategory, pageNum);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products by name, brand, description, or barcode' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiResponse({ status: 200, description: 'Returns matching products with prices' })
  search(@Query('q') query: string, @Query('categoryId') categoryId?: string) {
    return this.productsService.search(query, categoryId);
  }

  @Get('search/advanced')
  @ApiOperation({ summary: 'Advanced product search with filters and sorting' })
  @ApiResponse({ status: 200, description: 'Returns filtered and sorted products' })
  advancedSearch(@Query() searchDto: AdvancedSearchDto) {
    return this.productsService.advancedSearch(searchDto);
  }

  @Get('search-stores')
  @ApiOperation({ summary: 'Search external stores (Walmart, Amazon, Target) live' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns live results from store integrations',
    schema: {
      example: {
        walmart: [
          { name: 'Ceramic Vase', price: 24.99, inStock: true }
        ],
        totalResults: 1
      }
    }
  })
  searchStores(@Query('q') query: string) {
    return this.productsService.searchExternalStores(query);
  }

  @Get('search/fast')
  @ApiOperation({ 
    summary: 'Fast product search - returns products immediately without waiting for all store prices',
    description: 'Returns products quickly (name, image, basic info) for instant search results. Store prices are fetched in background when user clicks "View Price".'
  })
  @ApiQuery({ 
    name: 'q', 
    required: true, 
    description: 'Product name or barcode (8-14 digits)',
    example: 'iPhone 16' 
  })
  @ApiQuery({ 
    name: 'searchType', 
    required: false, 
    enum: ['term', 'gtin', 'auto'],
    description: 'Search type: term (keyword), gtin (barcode), or auto (detect automatically)',
    example: 'auto'
  })
  @ApiQuery({ 
    name: 'categoryId', 
    required: false, 
    description: 'Category ID (UUID) to filter results and improve search relevance',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiQuery({ 
    name: 'categorySlug', 
    required: false, 
    description: 'Category slug (alternative to categoryId) to filter results',
    example: 'groceries'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Maximum number of products to return per page (default: 6)',
    example: 6
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: 'Page number for pagination (default: 1)',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns array of products with basic info (no store prices)',
  })
  fastSearch(
    @Query('q') query: string,
    @Query('searchType') searchType?: 'term' | 'gtin' | 'auto',
    @Query('categoryId') categoryId?: string,
    @Query('categorySlug') categorySlug?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    // Increase default limit for "all-retailers" searches to show more results
    const defaultLimit = categorySlug === 'all-retailers' ? 12 : 6;
    return this.productsService.fastProductSearch(query, searchType || 'auto', categoryId, limit || defaultLimit, categorySlug, page || 1);
  }

  @Get('compare/multi-store')
  @ApiOperation({ 
    summary: 'Compare product prices across all stores',
    description: 'Search by product name or barcode (GTIN) and get prices from multiple stores. Perfect for price comparison cards.'
  })
  @ApiQuery({ 
    name: 'q', 
    required: true, 
    description: 'Product name or barcode (8-14 digits)',
    example: 'Organic Bananas' 
  })
  @ApiQuery({ 
    name: 'searchType', 
    required: false, 
    enum: ['term', 'gtin', 'auto'],
    description: 'Search type: term (keyword), gtin (barcode), or auto (detect automatically)',
    example: 'auto'
  })
  @ApiQuery({ 
    name: 'categoryId', 
    required: false, 
    description: 'Category ID to filter results and improve search relevance',
    example: 'groceries-category-id'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns product with prices from all stores, sorted by price',
    schema: {
      example: {
        product: {
          name: 'Organic Bananas',
          image: 'https://...',
          barcode: '4011',
          category: 'Groceries'
        },
        prices: [
          {
            rank: 1,
            store: { name: 'Costco', logo: 'https://...' },
            price: 0.49,
            totalPrice: 0.49,
            savings: 0,
            isBestPrice: true
          },
          {
            rank: 2,
            store: { name: 'Aldi', logo: 'https://...' },
            price: 0.53,
            totalPrice: 0.53,
            savings: 0.04,
            isBestPrice: false
          }
        ],
        metadata: {
          totalStores: 11,
          lowestPrice: 0.49,
          highestPrice: 0.79,
          maxSavings: 0.30
        }
      }
    }
  })
  compareMultiStore(
    @Query('q') query: string,
    @Query('searchType') searchType?: 'term' | 'gtin' | 'auto',
    @Query('categoryId') categoryId?: string,
  ) {
    // Log received parameters for debugging
    console.log(`📥 Received search request: query="${query}", searchType="${searchType}", categoryId="${categoryId}"`);
    if (!query || query.length === 0) {
      console.warn('⚠️  Empty query received');
    }
    if (query && query.length < 2) {
      console.warn(`⚠️  Very short query received: "${query}" (length: ${query.length})`);
    }
    return this.productsService.compareProductAcrossStores(query, searchType || 'auto', categoryId);
  }

  @Get('closest-stores')
  @ApiOperation({ 
    summary: 'Get closest stores for a product by zip code',
    description: 'Returns top 3 closest stores with distance information'
  })
  @ApiQuery({ 
    name: 'productId', 
    required: true, 
    description: 'Product ID',
  })
  @ApiQuery({ 
    name: 'zipCode', 
    required: true, 
    description: 'ZIP code to find nearby stores',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns closest stores with distance',
  })
  getClosestStores(
    @Query('productId') productId: string,
    @Query('zipCode') zipCode: string,
  ) {
    return this.productsService.getClosestStoresForProduct(productId, zipCode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product details with price comparison' })
  @ApiResponse({ status: 200, description: 'Returns product with all store prices and history' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product (Admin)' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product (Admin)' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
