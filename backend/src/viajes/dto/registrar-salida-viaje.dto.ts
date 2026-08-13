import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
} from 'class-validator';

const MAX_NUMERIC_12_3 = 999_999_999.999;

export class RegistrarSalidaViajeDto {
  @IsInt()
  @IsPositive()
  proyecto_id: number;

  @IsInt()
  @IsPositive()
  material_id: number;

  @IsInt()
  @IsPositive()
  camion_id: number;

  @IsInt()
  @IsPositive()
  chofer_id: number;

  @IsInt()
  @IsPositive()
  ubicacion_origen_id: number;

  @IsInt()
  @IsPositive()
  ubicacion_destino_id: number;

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
