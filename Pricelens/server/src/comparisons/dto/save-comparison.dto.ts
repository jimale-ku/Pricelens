import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class SaveComparisonDto {
  @ApiProperty({ example: 'product-uuid-here', description: 'Product ID to save' })
  @IsString()
  productId: string;

  @ApiProperty({
    example: 'Amazon has best price',
    description: 'Optional notes about comparison',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
