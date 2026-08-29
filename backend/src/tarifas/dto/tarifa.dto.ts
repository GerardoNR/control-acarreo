import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsDefined,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Max,
  ValidateIf,
} from 'class-validator';
import { TipoCobroTarifa } from '../tarifa.entity';

export class CreateTarifaDto {
  @Type(() => Number) @IsInt() @IsPositive() proyecto_id: number;
  @Type(() => Number) @IsInt() @IsPositive() material_id: number;
  @Type(() => Number) @IsInt() @IsPositive() ubicacion_origen_id: number;
  @Type(() => Number) @IsInt() @IsPositive() ubicacion_destino_id: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  ruta_acarreo_id?: number;
  @IsOptional() @IsEnum(TipoCobroTarifa) tipo_cobro: TipoCobroTarifa =
    TipoCobroTarifa.POR_VOLUMEN;
  @ValidateIf(
    (dto: CreateTarifaDto) =>
      dto.tipo_cobro !== TipoCobroTarifa.POR_DISTANCIA_ESCALONADA,
  )
  @IsDefined()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Max(99_999_999.9999)
  precio_unitario?: number;
  @ValidateIf(
    (dto: CreateTarifaDto) =>
      dto.tipo_cobro === TipoCobroTarifa.POR_DISTANCIA_ESCALONADA,
  )
  @IsDefined()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Max(99_999_999.9999)
  precio_primer_km?: number;
  @ValidateIf(
    (dto: CreateTarifaDto) =>
      dto.tipo_cobro === TipoCobroTarifa.POR_DISTANCIA_ESCALONADA,
  )
  @IsDefined()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Max(99_999_999.9999)
  precio_km_subsecuente?: number;
  @IsDateString({ strict: true }) vigente_desde: string;
  @IsOptional() @IsDateString({ strict: true }) vigente_hasta?: string;
}
export class UpdateTarifaDto {
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() proyecto_id?: number;
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() material_id?: number;
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
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  ruta_acarreo_id?: number;
  @IsOptional() @IsEnum(TipoCobroTarifa) tipo_cobro?: TipoCobroTarifa;
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Max(99_999_999.9999)
  precio_unitario?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Max(99_999_999.9999)
  precio_primer_km?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  @Max(99_999_999.9999)
  precio_km_subsecuente?: number;
  @IsOptional() @IsDateString({ strict: true }) vigente_desde?: string;
  @IsOptional() @IsDateString({ strict: true }) vigente_hasta?: string;
  @IsOptional() @IsBoolean() activo?: boolean;
}
