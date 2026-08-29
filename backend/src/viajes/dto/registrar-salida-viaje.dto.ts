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

export class RegistrarSalidaViajeDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  orden_acarreo_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  proyecto_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  material_id?: number;

  @IsInt()
  @IsPositive()
  camion_id: number;

  @IsInt()
  @IsPositive()
  chofer_id: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  ubicacion_origen_id?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  ubicacion_destino_id?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  folio_origen?: string;

  @IsNumber({
    allowInfinity: false,
    allowNaN: false,
    maxDecimalPlaces: 3,
  })
  @IsPositive()
  @Max(MAX_NUMERIC_12_3)
  cantidad_salida: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  observaciones_salida?: string;
}
