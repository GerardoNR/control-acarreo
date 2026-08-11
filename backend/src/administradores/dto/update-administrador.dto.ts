import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAdministradorDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  usuario?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
