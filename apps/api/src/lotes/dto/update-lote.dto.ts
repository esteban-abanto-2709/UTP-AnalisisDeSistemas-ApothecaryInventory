import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateLoteDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'El código es obligatorio' })
  codigo?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de vencimiento debe ser una fecha válida' },
  )
  fechaVencimiento?: string;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El descuento debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'El descuento no puede ser negativo' })
  @Max(100, { message: 'El descuento no puede superar 100%' })
  descuento?: number;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
