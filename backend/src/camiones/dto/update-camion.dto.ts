import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

const MAX_DECIMAL_10_2 = 99_999_999.99;

export class UpdateCamionDto {
  @IsOptional()
  @IsString()
  placas?: string;

  @IsOptional()
  @IsString()
  numero_economico?: string;

  @IsOptional()
  @IsString()
  nfc_tag_uid?: string;

  @IsOptional()
  @IsNumber({
    allowInfinity: false,
    allowNaN: false,
    maxDecimalPlaces: 2,
  })
  @IsPositive()
  @Max(MAX_DECIMAL_10_2)
  capacidad_m3?: number;

  @IsOptional()
  @IsString()
  tipo_camion?: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  anio?: number;
}
