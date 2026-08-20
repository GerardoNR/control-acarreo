import { IsOptional, IsString, MinLength } from 'class-validator';
import { IsPersonaName } from '../../common/validation/persona-name.validation';
import {
  NormalizeUsuario,
  Trim,
} from '../../common/validation/string.transforms';

export class UpdateAdministradorDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(2)
  @IsPersonaName()
  nombre?: string;

  @IsOptional()
  @NormalizeUsuario()
  @IsString()
  @MinLength(3)
  usuario?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
