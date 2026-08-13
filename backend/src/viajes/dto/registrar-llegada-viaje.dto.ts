import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
} from 'class-validator';

const MAX_NUMERIC_12_3 = 999_999_999.999;

export class RegistrarLlegadaViajeDto {
  @IsOptional()
  @IsNumber({
    allowInfinity: false,
    allowNaN: false,
    maxDecimalPlaces: 3,
  })
  @IsPositive()
  @Max(MAX_NUMERIC_12_3)
  cantidad_llegada?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  observaciones_llegada?: string;
}
