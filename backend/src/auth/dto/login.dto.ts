import { IsString, MinLength } from 'class-validator';
import { NormalizeUsuario } from '../../common/validation/string.transforms';

export class LoginDto {
  @NormalizeUsuario()
  @IsString()
  @MinLength(3)
  usuario: string;

  @IsString()
  @MinLength(8)
  password: string;
}
