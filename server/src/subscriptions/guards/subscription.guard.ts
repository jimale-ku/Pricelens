import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { SUBSCRIPTION_TIER_KEY } from '../decorators/require-subscription.decorator';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredTier = this.reflector.getAllAndOverride<'FREE' | 'PLUS'>(
      SUBSCRIPTION_TIER_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredTier) {
      return true; // No subscription requirement
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new ForbiddenException('No subscription found');
    }

    // Check if subscription is active
    if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIALING') {
      throw new ForbiddenException('Subscription is not active');
    }

    // Check tier requirement
    if (requiredTier === 'PLUS' && subscription.tier !== 'PLUS') {
      throw new ForbiddenException(
        'Plus subscription required. Please upgrade to access this feature.',
      );
    }

    return true;
  }
}






