import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsDateString,
  IsNotEmpty,
  Min,
} from 'class-validator';

export class CreateAdvertisementDto {
  @ApiProperty({ example: 'groceries-123', required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ example: 'Save 20% on Fresh Produce' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Get the best deals on fresh fruits and vegetables' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'https://example.com/ad-banner.jpg', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: 'Shop Now' })
  @IsString()
  @IsOptional()
  ctaText?: string;

  @ApiProperty({ example: 'https://walmart.com/grocery-sale' })
  @IsString()
  @IsNotEmpty()
  ctaUrl: string;

  @ApiProperty({ example: 'Walmart' })
  @IsString()
  @IsNotEmpty()
  sponsorName: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ example: 0, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ example: '2024-12-31T23:59:59Z', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
