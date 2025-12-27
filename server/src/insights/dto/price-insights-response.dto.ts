import { ApiProperty } from '@nestjs/swagger';

export class PriceInsightsResponseDto {
  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @ApiProperty({ description: 'Product name' })
  productName: string;

  @ApiProperty({ description: 'Lowest price details' })
  lowest: {
    price: number;
    store: {
      id: string;
      name: string;
      logo: string;
    };
  };

  @ApiProperty({ description: 'Average price across all stores' })
  average: number;

  @ApiProperty({ description: 'Highest price details' })
  highest: {
    price: number;
    store: {
      id: string;
      name: string;
      logo: string;
    };
  };

  @ApiProperty({ description: 'Potential savings (highest - lowest)' })
  savings: number;

  @ApiProperty({ description: 'Number of stores compared' })
  storeCount: number;

  @ApiProperty({ description: 'Price range' })
  priceRange: {
    min: number;
    max: number;
  };
}
