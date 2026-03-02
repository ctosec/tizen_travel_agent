import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class HotelBookDto {
  @IsString()
  @IsNotEmpty()
  offerId: string;

  @IsArray()
  @IsNotEmpty()
  guests: Record<string, unknown>[];

  @IsArray()
  @IsNotEmpty()
  payments: Record<string, unknown>[];
}
