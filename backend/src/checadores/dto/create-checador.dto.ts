import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { IsPersonaName } from '../../common/validation/persona-name.validation';
import {
  NormalizeUsuario,
  Trim,
} from '../../common/validation/string.transforms';

export class CreateChecadorDto {
  @Trim()
  @IsString()
  @MinLength(2)
  @IsPersonaName()
  nombre: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @Matches(/^\d{10}$/, {
    message: 'telefono debe contener exactamente 10 dígitos',
  })
  telefono?: string;

  @NormalizeUsuario()
  @IsString()
  @MinLength(3)
  usuario: string;

  @IsString()
  @MinLength(8)
  password: string;
}
