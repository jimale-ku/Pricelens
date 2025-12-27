import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from '../jobs/jobs.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsService: JobsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('database')
  @ApiOperation({ summary: 'Database health check' })
  async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Background jobs status' })
  async checkJobs() {
    try {
      if (!this.jobsService) {
        return {
          status: 'ok',
          jobs: {
            message: 'Jobs service not available (Redis not configured)',
          },
          timestamp: new Date().toISOString(),
        };
      }
      const stats = await this.jobsService.getJobStats();
      return {
        status: 'ok',
        jobs: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('full')
  @ApiOperation({ summary: 'Comprehensive health check' })
  async fullCheck() {
    const [basic, db, jobs] = await Promise.all([
      this.check(),
      this.checkDatabase(),
      this.checkJobs(),
    ]);

    return {
      health: basic,
      database: db,
      backgroundJobs: jobs,
    };
  }
}
