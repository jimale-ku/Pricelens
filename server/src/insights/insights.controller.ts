import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { InsightsService } from './insights.service';
import { PriceInsightsResponseDto } from './dto/price-insights-response.dto';

@ApiTags('insights')
@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('products/:id/price-insights')
  @ApiOperation({ summary: 'Get price insights for a product (lowest, average, highest, savings)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Price insights retrieved successfully', type: PriceInsightsResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getPriceInsights(@Param('id') id: string) {
    return this.insightsService.getPriceInsights(id);
  }

  @Get('products/trending')
  @ApiOperation({ summary: 'Get trending products across all categories' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of products to return', type: Number })
  @ApiResponse({ status: 200, description: 'Trending products retrieved successfully' })
  getTrendingProducts(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.insightsService.getTrendingProducts(limitNum);
  }

  @Get('categories/:id/popular')
  @ApiOperation({ summary: 'Get popular items in a specific category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of products to return', type: Number })
  @ApiResponse({ status: 200, description: 'Popular items retrieved successfully' })
  getPopularItemsByCategory(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.insightsService.getPopularItemsByCategory(id, limitNum);
  }
}

