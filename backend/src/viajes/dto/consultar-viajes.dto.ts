import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  IsOptional,
  IsPositive,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { EstadoViaje } from '../enums/estado-viaje.enum';

export class ConsultarViajesDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === true || value === 'true' ? true : value === false || value === 'false' ? false : value,
  )
  @IsBoolean()
  todos?: boolean;

  @IsOptional()
  @IsEnum(EstadoViaje)
  estado?: EstadoViaje;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(19)
  folio?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  proyecto_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  material_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  camion_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  chofer_id?: number;

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
  @Matches(
    /^(?:\d{4}-\d{2}-\d{2}|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2}))$/,
    { message: 'fecha_desde debe ser fecha ISO o timestamp ISO con zona' },
  )
  fecha_desde?: string;

  @IsOptional()
  @Matches(
    /^(?:\d{4}-\d{2}-\d{2}|\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2}))$/,
    { message: 'fecha_hasta debe ser fecha ISO o timestamp ISO con zona' },
  )
  fecha_hasta?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
