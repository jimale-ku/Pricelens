import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';

enum SortBy {
  PRICE_LOW = 'price_low',
  PRICE_HIGH = 'price_high',
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  RELEVANCE = 'relevance',
}

export class AdvancedSearchDto {
  @ApiProperty({ example: 'milk' })
  @IsString()
  query: string;

  @ApiProperty({ example: 'groceries', required: false })
  @IsString()
  @IsOptional()
  categorySlug?: string;

  @ApiProperty({ example: 'dairy', required: false })
  @IsString()
  @IsOptional()
  subcategory?: string;

  @ApiProperty({ example: ['walmart', 'target'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  stores?: string[];

  @ApiProperty({ enum: SortBy, required: false, default: 'relevance' })
  @IsEnum(SortBy)
  @IsOptional()
  sortBy?: SortBy;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  minPrice?: number;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  maxPrice?: number;
}
