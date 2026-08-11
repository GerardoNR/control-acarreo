import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProyectoDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsOptional()
  @IsString()
  clave?: string;

  @IsOptional()
  @IsString()
  desarrolladora?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  nota_ruta?: string;
}
