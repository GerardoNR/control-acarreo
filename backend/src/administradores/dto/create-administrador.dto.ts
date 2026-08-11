import { IsString, MinLength } from 'class-validator';

export class CreateAdministradorDto {
  @IsString()
  nombre: string;

  @IsString()
  @MinLength(3)
  usuario: string;

  @IsString()
  @MinLength(8)
  password: string;
}
