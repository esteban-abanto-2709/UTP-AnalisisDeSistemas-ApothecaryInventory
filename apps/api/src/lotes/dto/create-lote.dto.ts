import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateLoteDto {
  @IsString()
  @MinLength(1, { message: 'El código es obligatorio' })
  codigo: string;

  @IsInt({ message: 'El medicamento debe ser un id válido' })
  @Min(1, { message: 'El medicamento debe ser un id válido' })
  medicamentoId: number;

  @IsDateString(
    {},
    { message: 'La fecha de vencimiento debe ser una fecha válida' },
  )
  fechaVencimiento: string;

  @IsInt({ message: 'El stock inicial debe ser un número entero' })
  @Min(1, { message: 'El stock inicial debe ser al menos 1' })
  stockInicial: number;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El descuento debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'El descuento no puede ser negativo' })
  @Max(100, { message: 'El descuento no puede superar 100%' })
  descuento?: number;
}
