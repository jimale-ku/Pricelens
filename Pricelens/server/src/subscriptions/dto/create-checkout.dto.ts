import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  /** Billing interval: monthly or yearly (yearly uses stripePriceIdYearly when set) */
  @IsOptional()
  @IsIn(['month', 'year'])
  interval?: 'month' | 'year' = 'month';
}






