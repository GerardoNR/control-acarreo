import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateRutaAcarreoDto {
  @Type(() => Number) @IsInt() @IsPositive() proyecto_id: number;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(50) clave: string;
  @Type(() => Number) @IsInt() @IsPositive() ubicacion_origen_id: number;
  @Type(() => Number) @IsInt() @IsPositive() ubicacion_destino_id: number;
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  descripcion?: string;
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(9_999_999.999)
  distancia_pavimento: number;
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(9_999_999.999)
  distancia_total: number;
  @IsDateString({ strict: true }) vigente_desde: string;
  @IsOptional() @IsDateString({ strict: true }) vigente_hasta?: string;
}

export class UpdateRutaAcarreoDto {
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() proyecto_id?: number;
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  clave?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  ubicacion_origen_id?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  ubicacion_destino_id?: number;
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  descripcion?: string;
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(9_999_999.999)
  distancia_pavimento?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(9_999_999.999)
  distancia_total?: number;
  @IsOptional() @IsDateString({ strict: true }) vigente_desde?: string;
  @IsOptional() @IsDateString({ strict: true }) vigente_hasta?: string;
  @IsOptional() @IsBoolean() activo?: boolean;
}
