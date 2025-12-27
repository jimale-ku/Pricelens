import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({
      log: ['error', 'warn'],
    });
    console.log('📦 PrismaService constructor called');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}



