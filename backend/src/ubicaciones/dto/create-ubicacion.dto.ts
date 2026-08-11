import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { TipoUbicacion } from '../ubicacion.entity';

export class CreateUbicacionDto {
  @IsInt()
  @IsPositive()
  proyecto_id: number;

  @IsString()
  nombre: string;

  @IsEnum(TipoUbicacion)
  tipo: TipoUbicacion;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  referencia?: string;
}
