import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, MinLength, IsUUID } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Modern Ceramic Vase' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'Elegant white ceramic vase perfect for any room' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: ['https://picsum.photos/400/400'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ example: '123456789001' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({ example: 'HomeStyle' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiProperty({ example: 'uuid-of-category' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: { walmart: 'WM-001', amazon: 'AMZ-001' } })
  @IsOptional()
  externalIds?: Record<string, string>;
}

