import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAlertDto {
  @ApiProperty({ description: 'New target price', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  targetPrice?: number;
}
