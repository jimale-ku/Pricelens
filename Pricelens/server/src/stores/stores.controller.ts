import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new store (Admin)' })
  @ApiResponse({ status: 201, description: 'Store created successfully' })
  create(@Body() createStoreDto: CreateStoreDto) {
    return this.storesService.create(createStoreDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all enabled stores' })
  @ApiResponse({ status: 200, description: 'Returns all stores' })
  findAll() {
    return this.storesService.findAll();
  }

  @Post('request')
  @ApiOperation({ summary: 'Request a new store to be added' })
  @ApiResponse({ status: 201, description: 'Store request submitted successfully' })
  requestStore(@Body() body: { storeName: string; userEmail?: string }) {
    return this.storesService.requestStore(body.storeName, body.userEmail);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store by ID' })
  @ApiResponse({ status: 200, description: 'Returns store details' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get store by slug' })
  @ApiResponse({ status: 200, description: 'Returns store details' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.storesService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update store (Admin)' })
  @ApiResponse({ status: 200, description: 'Store updated successfully' })
  update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storesService.update(id, updateStoreDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete store (Admin)' })
  @ApiResponse({ status: 200, description: 'Store deleted successfully' })
  remove(@Param('id') id: string) {
    return this.storesService.remove(id);
  }
}
