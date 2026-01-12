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
  @ApiOperation({ summary: 'Get popular/trending products' })
  @ApiQuery({ name: 'categorySlug', required: false, description: 'Filter by category slug' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of products to return (default: 6)' })
  @ApiResponse({ status: 200, description: 'Returns popular products based on search/view count' })
  getPopular(
    @Query('categorySlug') categorySlug?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.getPopular(categorySlug, limit ? parseInt(limit) : 6);
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
  ) {
    return this.productsService.compareProductAcrossStores(query, searchType || 'auto');
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
