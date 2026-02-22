import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ComparisonsService } from './comparisons.service';
import { SaveComparisonDto } from './dto/save-comparison.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('comparisons')
@Controller('comparisons')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ComparisonsController {
  constructor(private readonly comparisonsService: ComparisonsService) {}

  @Post()
  @ApiOperation({ summary: 'Save a price comparison' })
  @ApiResponse({ status: 201, description: 'Comparison saved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  saveComparison(@Req() req: any, @Body() dto: SaveComparisonDto) {
    return this.comparisonsService.saveComparison(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all saved comparisons' })
  @ApiResponse({ status: 200, description: 'Returns saved comparisons' })
  getComparisons(@Req() req: any) {
    return this.comparisonsService.getUserComparisons(req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a saved comparison' })
  @ApiResponse({ status: 200, description: 'Comparison deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comparison not found' })
  deleteComparison(@Req() req: any, @Param('id') id: string) {
    return this.comparisonsService.deleteComparison(req.user.userId, id);
  }
}
