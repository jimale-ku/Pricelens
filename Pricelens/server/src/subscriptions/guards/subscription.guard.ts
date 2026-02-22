import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { SUBSCRIPTION_TIER_KEY } from '../decorators/require-subscription.decorator';
import { meetsMinimumTier } from '../subscription-tiers';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredTier = this.reflector.getAllAndOverride<string>(
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

    if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIALING') {
      throw new ForbiddenException('Subscription is not active');
    }

    // Require user's tier to meet or exceed the minimum (e.g. PRO allows PRO or PREMIUM)
    if (!meetsMinimumTier(subscription.tier, requiredTier as any)) {
      throw new ForbiddenException(
        `${requiredTier} subscription or higher required. Please upgrade to access this feature.`,
      );
    }

    return true;
  }
}






