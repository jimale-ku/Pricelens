import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { WalmartMockIntegration } from '../../integrations/services/walmart-mock.integration';
import { AmazonMockIntegration } from '../../integrations/services/amazon-mock.integration';
import { TargetMockIntegration } from '../../integrations/services/target-mock.integration';

@Processor('price-updates')
export class PriceUpdateProcessor {
  private readonly logger = new Logger(PriceUpdateProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walmartIntegration: WalmartMockIntegration,
    private readonly amazonIntegration: AmazonMockIntegration,
    private readonly targetIntegration: TargetMockIntegration,
  ) {}

  @Process('update-all-prices')
  async handlePriceUpdate(job: Job) {
    this.logger.log('Starting price update job...');
    const { batchSize = 50 } = job.data;

    try {
      // Get all products
      const products = await this.prisma.product.findMany({
        take: batchSize,
        include: {
          prices: {
            include: { store: true },
          },
        },
      });

      this.logger.log(`Updating prices for ${products.length} products`);

      for (const product of products) {
        try {
          // Simulate fetching updated prices from stores
          // In production, this would call real PriceAPI
          const [walmartResults, amazonResults, targetResults] =
            await Promise.all([
              this.walmartIntegration.searchProducts(product.name, {
                limit: 1,
              }),
              this.amazonIntegration.searchProducts(product.name, { limit: 1 }),
              this.targetIntegration.searchProducts(product.name, { limit: 1 }),
            ]);

          // Update prices for each store
          const updates: Promise<any>[] = [];
          
          if (walmartResults.length > 0) {
            const walmartStore = await this.prisma.store.findFirst({
              where: { slug: 'walmart' },
            });
            if (walmartStore) {
              updates.push(
                this.updateProductPrice(
                  product.id,
                  walmartStore.id,
                  walmartResults[0].price,
                ),
              );
            }
          }

          if (amazonResults.length > 0) {
            const amazonStore = await this.prisma.store.findFirst({
              where: { slug: 'amazon' },
            });
            if (amazonStore) {
              updates.push(
                this.updateProductPrice(
                  product.id,
                  amazonStore.id,
                  amazonResults[0].price,
                ),
              );
            }
          }

          if (targetResults.length > 0) {
            const targetStore = await this.prisma.store.findFirst({
              where: { slug: 'target' },
            });
            if (targetStore) {
              updates.push(
                this.updateProductPrice(
                  product.id,
                  targetStore.id,
                  targetResults[0].price,
                ),
              );
            }
          }

          await Promise.all(updates);
        } catch (error) {
          this.logger.error(
            `Failed to update price for product ${product.id}`,
            error,
          );
        }
      }

      this.logger.log('Price update job completed successfully');
      return { updated: products.length };
    } catch (error) {
      this.logger.error('Price update job failed', error);
      throw error;
    }
  }

  private async updateProductPrice(
    productId: string,
    storeId: string,
    newPrice: number,
  ) {
    // Get current price
    const currentPrice = await this.prisma.productPrice.findFirst({
      where: { productId, storeId },
    });

    if (!currentPrice) {
      // Create new price entry
      return this.prisma.productPrice.create({
        data: {
          productId,
          storeId,
          price: newPrice,
        },
      });
    }

    // Update price and create history entry if changed
    if (Number(currentPrice.price) !== newPrice) {
      await this.prisma.priceHistory.create({
        data: {
          productId,
          storeId,
          price: currentPrice.price,
        },
      });

      return this.prisma.productPrice.update({
        where: { id: currentPrice.id },
        data: {
          price: newPrice,
          lastUpdated: new Date(),
        },
      });
    }

    return currentPrice;
  }
}
