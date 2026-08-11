import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { TipoUbicacion } from '../ubicacion.entity';

export class UpdateUbicacionDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  proyecto_id?: number;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEnum(TipoUbicacion)
  tipo?: TipoUbicacion;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  referencia?: string;
}
