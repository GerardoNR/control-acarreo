import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';

const MAX_NUMERIC_12_3 = 999_999_999.999;

export class RegistrarLlegadaViajeDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  unidad_control_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  ubicacion_destino_real_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  material_llegada_id?: number;

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

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  folio_destino?: string;
}
