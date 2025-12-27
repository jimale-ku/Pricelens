import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':productId')
  @ApiOperation({ summary: 'Add product to favorites' })
  @ApiResponse({ status: 201, description: 'Product added to favorites' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Already in favorites' })
  addFavorite(@Req() req: any, @Param('productId') productId: string) {
    return this.favoritesService.addFavorite(req.user.userId, productId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all favorites with current prices' })
  @ApiResponse({ status: 200, description: 'Returns all favorites' })
  getFavorites(@Req() req: any) {
    return this.favoritesService.getUserFavorites(req.user.userId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove product from favorites' })
  @ApiResponse({ status: 200, description: 'Removed from favorites' })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  removeFavorite(@Req() req: any, @Param('productId') productId: string) {
    return this.favoritesService.removeFavorite(req.user.userId, productId);
  }

  @Get(':productId/check')
  @ApiOperation({ summary: 'Check if product is favorited' })
  @ApiResponse({ status: 200, description: 'Returns favorite status' })
  checkFavorite(@Req() req: any, @Param('productId') productId: string) {
    return this.favoritesService.isFavorite(req.user.userId, productId);
  }
}
