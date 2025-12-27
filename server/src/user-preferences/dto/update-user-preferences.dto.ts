import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsInt, IsString, IsBoolean, Min, Max } from 'class-validator';

export class UpdateUserPreferencesDto {
  @ApiProperty({ example: ['walmart-123', 'target-456'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  defaultStores?: string[];

  @ApiProperty({ example: 10, required: false, description: 'Search radius in miles' })
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  searchRadius?: number;

  @ApiProperty({ example: '10001', required: false })
  @IsString()
  @IsOptional()
  preferredZipCode?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  priceAlertEmail?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  trendingEmail?: boolean;
}
