import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateChecadorDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  usuario?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
