import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min, MaxLength } from 'class-validator';

export class AddItemDto {
  @ApiProperty({ example: 'product-uuid-here', description: 'Product ID to add' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 1, description: 'Quantity of items', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiProperty({
    example: 'Get the organic one',
    description: 'Optional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
