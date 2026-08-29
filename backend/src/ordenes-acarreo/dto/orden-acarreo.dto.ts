import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';
import { EstadoOrdenAcarreo } from '../orden-acarreo.entity';

export class CreateOrdenAcarreoDto {
  @Type(() => Number) @IsInt() @IsPositive() proyecto_id: number;
  @Type(() => Number) @IsInt() @IsPositive() material_id: number;
  @Type(() => Number) @IsInt() @IsPositive() ubicacion_origen_id: number;
  @Type(() => Number) @IsInt() @IsPositive() ubicacion_destino_id: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  ruta_acarreo_id?: number;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  unidad_control_id?: number;
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() tarifa_id?: number;
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Max(999_999_999.999)
  cantidad_solicitada: number;
  @IsDateString({ strict: true }) fecha_inicio: string;
  @IsOptional() @IsDateString({ strict: true }) fecha_fin?: string;
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  observaciones?: string;
}

export class UpdateOrdenAcarreoDto {
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
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  unidad_control_id?: number;
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() tarifa_id?: number;
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  @Max(999_999_999.999)
  cantidad_solicitada?: number;
  @IsOptional() @IsDateString({ strict: true }) fecha_inicio?: string;
  @IsOptional() @IsDateString({ strict: true }) fecha_fin?: string;
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  observaciones?: string;
}

export class ConsultarOrdenesDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(100)
  buscar?: string;
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() proyecto_id?: number;
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() material_id?: number;
  @IsOptional() @IsEnum(EstadoOrdenAcarreo) estado?: EstadoOrdenAcarreo;
  @IsOptional() @IsDateString({ strict: true }) desde?: string;
  @IsOptional() @IsDateString({ strict: true }) hasta?: string;
}
