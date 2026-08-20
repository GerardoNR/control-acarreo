import { IsOptional, IsString, MinLength } from 'class-validator';
import { Trim } from '../../common/validation/string.transforms';

export class UpdateProyectoDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  clave?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  desarrolladora?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  descripcion?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  nota_ruta?: string;
}
