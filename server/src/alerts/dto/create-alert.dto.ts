import { ApiProperty } from '@nestjs/swagger';
import { IsDecimal, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAlertDto {
  @ApiProperty({ description: 'Product ID to monitor' })
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Target price to trigger alert', example: 19.99 })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetPrice: number;
}
