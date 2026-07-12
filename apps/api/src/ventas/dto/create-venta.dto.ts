import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { MetodoPago, TipoComprobante } from '../../generated/prisma/enums';

export class ItemVentaDto {
  @IsInt({ message: 'El medicamento debe ser un id válido' })
  @Min(1, { message: 'El medicamento debe ser un id válido' })
  medicamentoId: number;

  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  cantidad: number;
}

export class CreateVentaDto {
  @IsEnum(TipoComprobante, {
    message: 'El tipo de comprobante debe ser BOLETA o FACTURA',
  })
  tipoComprobante: TipoComprobante;

  @IsEnum(MetodoPago, {
    message: 'El método de pago debe ser EFECTIVO, TARJETA o YAPE_PLIN',
  })
  metodoPago: MetodoPago;

  @IsOptional()
  @IsInt({ message: 'El cliente debe ser un id válido' })
  @Min(1, { message: 'El cliente debe ser un id válido' })
  clienteId?: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'La venta debe tener al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => ItemVentaDto)
  items: ItemVentaDto[];
}
