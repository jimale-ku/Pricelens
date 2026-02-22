import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateListDto {
  @ApiProperty({ example: 'My Shopping List', description: 'Name of the list' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'Weekly grocery shopping',
    description: 'Optional description',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: false,
    description: 'Whether this is the default list',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
