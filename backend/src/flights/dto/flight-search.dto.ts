import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class FlightSearchDto {
  @IsString()
  @IsNotEmpty()
  originCode: string;

  @IsString()
  @IsNotEmpty()
  destinationCode: string;

  @IsString()
  @IsNotEmpty()
  dateOfDeparture: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  adults?: number = 1;

  @IsString()
  @IsOptional()
  travelClass?: string = 'ECONOMY';
}
