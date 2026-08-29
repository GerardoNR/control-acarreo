import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CrearSuspensionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  motivo: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;

  @IsDateString({ strict: true })
  fecha_inicio: string;

  @IsBoolean()
  indefinida: boolean;

  @IsOptional()
  @IsDateString({ strict: true })
  fecha_fin?: string;
}
