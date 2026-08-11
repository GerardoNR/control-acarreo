import { IsOptional, IsString } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  nombre: string;

  @IsString()
  unidad_medida: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
