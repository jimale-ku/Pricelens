import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class FindNearbyDto {
  @ApiProperty({ example: '10001' })
  @IsString()
  zipCode: string;

  @ApiProperty({ example: 10, required: false, description: 'Radius in miles' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(50)
  radius?: number;

  @ApiProperty({ example: 'walmart', required: false })
  @IsString()
  @IsOptional()
  storeName?: string;
}
