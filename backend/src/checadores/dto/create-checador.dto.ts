import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateChecadorDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsString()
  @MinLength(3)
  usuario: string;

  @IsString()
  @MinLength(8)
  password: string;
}
