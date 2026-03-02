import { IsArray, IsNotEmpty, IsObject } from 'class-validator';

export class FlightBookDto {
  @IsObject()
  @IsNotEmpty()
  flightOffer: Record<string, unknown>;

  @IsArray()
  @IsNotEmpty()
  travelers: Record<string, unknown>[];
}
