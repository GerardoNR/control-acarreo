import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

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
  @IsNumber()
  @IsPositive()
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
