import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class HotelSearchDto {
  @IsString()
  @IsNotEmpty()
  cityCode: string;

  @IsString()
  @IsNotEmpty()
  checkInDate: string;

  @IsString()
  @IsNotEmpty()
  checkOutDate: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  adults?: number = 1;
}
