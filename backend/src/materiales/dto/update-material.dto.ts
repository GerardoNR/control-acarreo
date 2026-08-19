import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateMaterialDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  unidad_medida?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
