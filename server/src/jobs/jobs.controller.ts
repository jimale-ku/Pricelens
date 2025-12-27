import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('trigger-price-update')
  async triggerPriceUpdate() {
    await this.jobsService.triggerPriceUpdate();
    return {
      message: 'Price update job triggered successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('trigger-alert-check')
  async triggerAlertCheck() {
    await this.jobsService.triggerAlertCheck();
    return {
      message: 'Alert check job triggered successfully',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('stats')
  async getJobStats() {
    return this.jobsService.getJobStats();
  }
}
