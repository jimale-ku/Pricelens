import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsBoolean, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Home Decor' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'home-decor' })
  @IsString()
  @MinLength(2)
  slug: string;

  @ApiPropertyOptional({ example: '🏠' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: 'Transform your living space with stylish decor' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Compare prices across stores before buying!' })
  @IsString()
  @IsOptional()
  shoppingTips?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
