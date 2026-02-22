import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdvertisementsService } from './advertisements.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Advertisements')
@Controller('advertisements')
export class AdvertisementsController {
  constructor(private readonly advertisementsService: AdvertisementsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an advertisement (admin)' })
  create(@Body() createDto: CreateAdvertisementDto) {
    return this.advertisementsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active advertisements' })
  @ApiQuery({ name: 'categoryId', required: false })
  findAll(@Query('categoryId') categoryId?: string) {
    return this.advertisementsService.findAll(categoryId);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured advertisements' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findFeatured(@Query('limit') limit?: string) {
    return this.advertisementsService.findFeatured(limit ? parseInt(limit) : 3);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get advertisement by ID' })
  findOne(@Param('id') id: string) {
    return this.advertisementsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update advertisement (admin)' })
  update(@Param('id') id: string, @Body() updateDto: UpdateAdvertisementDto) {
    return this.advertisementsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete advertisement (admin)' })
  remove(@Param('id') id: string) {
    return this.advertisementsService.remove(id);
  }

  @Post(':id/impression')
  @ApiOperation({ summary: 'Track advertisement impression' })
  trackImpression(@Param('id') id: string) {
    return this.advertisementsService.trackImpression(id);
  }

  @Post(':id/click')
  @ApiOperation({ summary: 'Track advertisement click' })
  trackClick(@Param('id') id: string) {
    return this.advertisementsService.trackClick(id);
  }
}
