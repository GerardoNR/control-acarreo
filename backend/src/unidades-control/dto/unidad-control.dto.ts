import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateUnidadControlDto {
  @Type(() => Number) @IsInt() @IsPositive() proyecto_id: number;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(100) nombre: string;
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  descripcion?: string;
}

export class UpdateUnidadControlDto {
  @IsOptional() @Type(() => Number) @IsInt() @IsPositive() proyecto_id?: number;
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre?: string;
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(2000)
  descripcion?: string;
  @IsOptional() @IsBoolean() activo?: boolean;
}

export class ConsultarUnidadesControlDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  proyecto_id?: number;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === true || value === 'true'
      ? true
      : value === false || value === 'false'
        ? false
        : value,
  )
  @IsBoolean()
  activo?: boolean;
}
