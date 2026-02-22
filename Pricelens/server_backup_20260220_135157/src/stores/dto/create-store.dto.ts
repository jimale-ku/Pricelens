import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUrl, MinLength } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ example: 'Walmart' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'walmart' })
  @IsString()
  @MinLength(2)
  slug: string;

  @ApiPropertyOptional({ example: 'https://cdn.worldvectorlogo.com/logos/walmart-logo-2.svg' })
  @IsUrl()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({ example: 'https://www.walmart.com' })
  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @ApiPropertyOptional({ example: 'https://developer.api.walmart.com' })
  @IsUrl()
  @IsOptional()
  apiEndpoint?: string;

  @ApiPropertyOptional({ example: 'your-api-key-here', description: 'Store API key (sensitive)' })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
