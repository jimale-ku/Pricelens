import { IsString, IsOptional, IsEnum } from 'class-validator';

export class SearchProductDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsEnum(['term', 'gtin', 'auto'])
  searchType?: 'term' | 'gtin' | 'auto' = 'auto';

  @IsOptional()
  @IsString()
  categoryId?: string;
}
