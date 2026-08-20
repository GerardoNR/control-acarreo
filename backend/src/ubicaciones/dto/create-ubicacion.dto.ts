import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';
import { Trim } from '../../common/validation/string.transforms';
import { TipoUbicacion } from '../ubicacion.entity';

export class CreateUbicacionDto {
  @IsInt()
  @IsPositive()
  proyecto_id: number;

  @Trim()
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsEnum(TipoUbicacion)
  tipo: TipoUbicacion;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  descripcion?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  referencia?: string;
}
