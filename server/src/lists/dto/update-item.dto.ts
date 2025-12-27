import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsBoolean, IsString, Min, MaxLength } from 'class-validator';

export class UpdateItemDto {
  @ApiProperty({ example: 2, description: 'Updated quantity', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiProperty({ example: 'Updated notes', description: 'Updated notes', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({ example: true, description: 'Mark as purchased', required: false })
  @IsOptional()
  @IsBoolean()
  isPurchased?: boolean;
}
