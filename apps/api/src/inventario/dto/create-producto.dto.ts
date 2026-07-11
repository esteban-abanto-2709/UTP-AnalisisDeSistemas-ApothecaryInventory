import { IsInt, IsNumber, IsString, Min, MinLength } from 'class-validator';

export class CreateProductoDto {
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  nombre: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe ser un número con máximo 2 decimales' },
  )
  @Min(0, { message: 'El precio no puede ser negativo' })
  precio: number;

  @IsInt({ message: 'El stock debe ser un número entero' })
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock: number;
}
