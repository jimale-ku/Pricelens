import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionGuard } from '../subscriptions/guards/subscription.guard';
import { RequireSubscription } from '../subscriptions/decorators/require-subscription.decorator';

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@RequireSubscription('BASIC')
@ApiBearerAuth('JWT-auth')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a price alert' })
  @ApiResponse({ status: 201, description: 'Alert created successfully' })
  @ApiResponse({ status: 400, description: 'Alert already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Req() req: any, @Body() createAlertDto: CreateAlertDto) {
    return this.alertsService.createAlert(req.user.userId, createAlertDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user price alerts' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Req() req: any, @Query('includeInactive') includeInactive?: string) {
    const activeOnly = includeInactive !== 'true';
    return this.alertsService.getUserAlerts(req.user.userId, activeOnly);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update alert target price' })
  @ApiResponse({ status: 200, description: 'Alert updated successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateAlertDto: UpdateAlertDto,
  ) {
    return this.alertsService.updateAlert(req.user.userId, id, updateAlertDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a price alert' })
  @ApiResponse({ status: 200, description: 'Alert deleted successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  remove(@Req() req: any, @Param('id') id: string) {
    return this.alertsService.deleteAlert(req.user.userId, id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a price alert' })
  @ApiResponse({ status: 200, description: 'Alert deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  deactivate(@Req() req: any, @Param('id') id: string) {
    return this.alertsService.deactivateAlert(req.user.userId, id);
  }
}
