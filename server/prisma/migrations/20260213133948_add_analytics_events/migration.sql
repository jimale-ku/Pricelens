-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "categorySlug" TEXT,
    "categoryName" TEXT,
    "productId" TEXT,
    "productName" TEXT,
    "serviceCategory" TEXT,
    "userId" TEXT,
    "searchQuery" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_categorySlug_idx" ON "AnalyticsEvent"("categorySlug");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");
