-- Add new subscription tiers (keep PLUS for legacy)
ALTER TYPE "SubscriptionTier" ADD VALUE 'BASIC';
ALTER TYPE "SubscriptionTier" ADD VALUE 'PRO';
ALTER TYPE "SubscriptionTier" ADD VALUE 'PREMIUM';

-- Add yearly price columns to SubscriptionPlan
ALTER TABLE "SubscriptionPlan" ADD COLUMN "priceYearly" DECIMAL(10,2);
ALTER TABLE "SubscriptionPlan" ADD COLUMN "stripePriceIdYearly" TEXT;

CREATE UNIQUE INDEX "SubscriptionPlan_stripePriceIdYearly_key" ON "SubscriptionPlan"("stripePriceIdYearly");
