import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  nombre: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  unidad_medida: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
