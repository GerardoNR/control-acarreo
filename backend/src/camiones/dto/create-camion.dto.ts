import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Trim } from '../../common/validation/string.transforms';

const MAX_DECIMAL_10_2 = 99_999_999.99;

export class CreateCamionDto {
  @Trim()
  @IsString()
  @MinLength(1)
  placas: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  numero_economico?: string;

  @Trim()
  @IsString()
  @MinLength(1)
  nfc_tag_uid: string;

  @IsNumber({
    allowInfinity: false,
    allowNaN: false,
    maxDecimalPlaces: 2,
  })
  @IsPositive()
  @Max(MAX_DECIMAL_10_2)
  capacidad_m3: number;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  tipo_camion?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  marca?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MinLength(1)
  modelo?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  anio?: number;
}
