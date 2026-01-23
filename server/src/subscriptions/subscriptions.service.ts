import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

// Optional Stripe import - won't break if not installed
let Stripe: any;
try {
  Stripe = require('stripe');
} catch (e) {
  // Stripe not installed - that's okay for now
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private stripe: any = null;

  constructor(private readonly prisma: PrismaService) {
    // Only initialize Stripe if package is installed and key is provided
    if (Stripe && process.env.STRIPE_SECRET_KEY) {
      try {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2024-12-18.acacia',
        });
        this.logger.log('✅ Stripe initialized');
      } catch (error) {
        this.logger.warn('⚠️  Stripe initialization failed (this is okay if you haven\'t set it up yet)');
      }
    } else {
      this.logger.warn('⚠️  Stripe not configured - subscription features will be limited');
      this.logger.warn('💡 To enable: npm install stripe and add STRIPE_SECRET_KEY to .env');
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string) {
    let subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    // If no subscription exists, create a free one
    if (!subscription) {
      const freePlan = await this.prisma.subscriptionPlan.findUnique({
        where: { tier: 'FREE' },
      });

      if (!freePlan) {
        throw new InternalServerErrorException('Free plan not found');
      }

      subscription = await this.prisma.subscription.create({
        data: {
          userId,
          planId: freePlan.id,
          status: 'ACTIVE',
          tier: 'FREE',
        },
        include: { plan: true },
      });
    }

    return subscription;
  }

  /**
   * Get all available subscription plans
   */
  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
    });
  }

  /**
   * Create Stripe checkout session for subscription
   */
  async createCheckoutSession(userId: string, dto: CreateCheckoutDto) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured. Please install stripe package and add STRIPE_SECRET_KEY to .env');
    }

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    if (plan.tier === 'FREE') {
      throw new BadRequestException('Cannot checkout with free plan');
    }

    if (!plan.stripePriceId) {
      throw new BadRequestException('Plan does not have a Stripe price ID');
    }

    // Get or create Stripe customer
    let stripeCustomer = await this.prisma.stripeCustomer.findUnique({
      where: { userId },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!stripeCustomer) {
      // Create customer in Stripe
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: {
          userId: userId,
        },
      });

      // Save to database
      stripeCustomer = await this.prisma.stripeCustomer.create({
        data: {
          userId,
          stripeCustomerId: customer.id,
          email: user.email,
        },
      });
    }

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: stripeCustomer.stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/cancel`,
      metadata: {
        userId,
        planId: plan.id,
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: any) {
    if (!this.stripe) {
      this.logger.warn('Webhook received but Stripe not configured');
      return;
    }
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (!userId || !planId) {
      console.error('Missing metadata in checkout session');
      return;
    }

    const subscriptionId = session.subscription as string;
    if (!subscriptionId) {
      console.error('No subscription ID in checkout session');
      return;
    }

    // Get the subscription from Stripe
    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      subscriptionId,
    );

    await this.updateSubscriptionFromStripe(
      userId,
      planId,
      stripeSubscription,
    );
  }

  private async handleSubscriptionUpdated(
    stripeSubscription: Stripe.Subscription,
  ) {
    const customerId = stripeSubscription.customer as string;
    const stripeCustomer = await this.prisma.stripeCustomer.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!stripeCustomer) {
      console.error('Stripe customer not found in database');
      return;
    }

    // Find plan by Stripe price ID
    const priceId = stripeSubscription.items.data[0]?.price.id;
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { stripePriceId: priceId },
    });

    if (!plan) {
      console.error('Plan not found for Stripe price ID:', priceId);
      return;
    }

    await this.updateSubscriptionFromStripe(
      stripeCustomer.userId,
      plan.id,
      stripeSubscription,
    );
  }

  private async handleSubscriptionDeleted(
    stripeSubscription: Stripe.Subscription,
  ) {
    const customerId = stripeSubscription.customer as string;
    const stripeCustomer = await this.prisma.stripeCustomer.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!stripeCustomer) {
      return;
    }

    // Downgrade to free plan
    const freePlan = await this.prisma.subscriptionPlan.findUnique({
      where: { tier: 'FREE' },
    });

    if (!freePlan) {
      console.error('Free plan not found');
      return;
    }

    await this.prisma.subscription.update({
      where: { userId: stripeCustomer.userId },
      data: {
        planId: freePlan.id,
        tier: 'FREE',
        status: 'CANCELED',
        canceledAt: new Date(),
        stripeSubscriptionId: null,
      },
    });
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      subscriptionId,
    );
    await this.handleSubscriptionUpdated(stripeSubscription);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    const customerId = invoice.customer as string;
    const stripeCustomer = await this.prisma.stripeCustomer.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!stripeCustomer) return;

    await this.prisma.subscription.update({
      where: { userId: stripeCustomer.userId },
      data: {
        status: 'PAST_DUE',
      },
    });
  }

  private async updateSubscriptionFromStripe(
    userId: string,
    planId: string,
    stripeSubscription: Stripe.Subscription,
  ) {
    const statusMap: Record<string, 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' | 'UNPAID'> = {
      active: 'ACTIVE',
      canceled: 'CANCELED',
      past_due: 'PAST_DUE',
      trialing: 'TRIALING',
      unpaid: 'UNPAID',
    };

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId,
        status: statusMap[stripeSubscription.status] || 'ACTIVE',
        tier: plan?.tier || 'PLUS',
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId: stripeSubscription.customer as string,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        trialEndsAt: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
      },
      update: {
        planId,
        status: statusMap[stripeSubscription.status] || 'ACTIVE',
        tier: plan?.tier || 'PLUS',
        stripeSubscriptionId: stripeSubscription.id,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        canceledAt: stripeSubscription.canceled_at
          ? new Date(stripeSubscription.canceled_at * 1000)
          : null,
        trialEndsAt: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
      },
    });
  }

  /**
   * Cancel subscription (at period end)
   */
  async cancelSubscription(userId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('No active Stripe subscription to cancel');
    }

    // Cancel at period end in Stripe
    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Update in database
    await this.prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    return { message: 'Subscription will be canceled at the end of the billing period' };
  }

  /**
   * Check if user can access a feature
   */
  async canAccessFeature(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    const plan = subscription.plan;

    if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIALING') {
      return false;
    }

    switch (feature) {
      case 'unlimited_searches':
        return plan.maxSearches === null;
      case 'all_stores':
        return plan.maxStores === null;
      case 'unlimited_favorites':
        return plan.maxFavorites === null;
      case 'unlimited_lists':
        return plan.maxLists === null;
      case 'unlimited_alerts':
        return plan.maxAlerts === null;
      case 'price_history':
        return plan.hasPriceHistory;
      case 'advanced_filters':
        return plan.hasAdvancedFilters;
      case 'ad_free':
        return plan.hasAdFree;
      default:
        return false;
    }
  }

  /**
   * Check usage limit for a feature
   */
  async checkUsageLimit(
    userId: string,
    feature: 'searches' | 'favorites' | 'lists' | 'alerts',
  ): Promise<{ allowed: boolean; current: number; limit: number | null }> {
    const subscription = await this.getUserSubscription(userId);
    const plan = subscription.plan;

    // Get today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let usage = await this.prisma.userUsage.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    if (!usage) {
      usage = await this.prisma.userUsage.create({
        data: {
          userId,
          date: today,
        },
      });
    }

    let current = 0;
    let limit: number | null = null;

    switch (feature) {
      case 'searches':
        current = usage.searches;
        limit = plan.maxSearches;
        break;
      case 'favorites':
        current = usage.favorites;
        limit = plan.maxFavorites;
        break;
      case 'lists':
        current = usage.lists;
        limit = plan.maxLists;
        break;
      case 'alerts':
        current = usage.alerts;
        limit = plan.maxAlerts;
        break;
    }

    const allowed = limit === null || current < limit;

    return { allowed, current, limit };
  }

  /**
   * Increment usage for a feature
   */
  async incrementUsage(
    userId: string,
    feature: 'searches' | 'favorites' | 'lists' | 'alerts',
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.userUsage.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      create: {
        userId,
        date: today,
        [feature]: 1,
      },
      update: {
        [feature]: {
          increment: 1,
        },
      },
    });
  }
}

