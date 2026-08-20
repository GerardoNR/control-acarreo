import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';
import { IsPersonaName } from '../../common/validation/persona-name.validation';
import { Trim } from '../../common/validation/string.transforms';

export class UpdateChoferDto {
  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(2)
  @IsPersonaName()
  nombre?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @IsPersonaName()
  apellido_paterno?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  @IsPersonaName()
  apellido_materno?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  telefono?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  licencia?: string;

  @IsOptional()
  @IsDateString()
  vigencia_licencia?: string;
}
