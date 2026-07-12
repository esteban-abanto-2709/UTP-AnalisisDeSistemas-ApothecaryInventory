import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { TipoComprobante, TipoDocumento } from '../generated/prisma/enums';
import { LotesService } from '../lotes/lotes.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVentaDto } from './dto/create-venta.dto';

const SERIES: Record<TipoComprobante, string> = {
  [TipoComprobante.BOLETA]: 'B001',
  [TipoComprobante.FACTURA]: 'F001',
};

const SELECT = {
  id: true,
  tipoComprobante: true,
  serie: true,
  numero: true,
  metodoPago: true,
  total: true,
  createdAt: true,
  cliente: {
    select: {
      id: true,
      tipoDocumento: true,
      numeroDocumento: true,
      nombre: true,
    },
  },
  empleado: { select: { id: true, nombre: true } },
} as const;

const SELECT_DETALLE = {
  ...SELECT,
  detalles: {
    select: {
      id: true,
      cantidad: true,
      precioUnitario: true,
      subtotal: true,
      medicamento: { select: { id: true, nombre: true } },
    },
  },
} as const;

@Injectable()
export class VentasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lotesService: LotesService,
  ) {}

  async create(empleadoId: number, dto: CreateVentaDto) {
    const serie = SERIES[dto.tipoComprobante];
    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.validarCliente(tx, dto);

        let total = new Prisma.Decimal(0);
        const detalles: Prisma.DetalleVentaCreateWithoutVentaInput[] = [];
        for (const item of dto.items) {
          const med = await tx.medicamento.findUnique({
            where: { id: item.medicamentoId },
            select: { id: true, precio: true, activo: true },
          });
          if (!med || !med.activo) {
            throw new NotFoundException('Medicamento no encontrado');
          }
          const desglose = await this.lotesService.descontarFEFO(
            tx,
            med.id,
            item.cantidad,
          );
          let subtotal = new Prisma.Decimal(0);
          for (const d of desglose) {
            subtotal = subtotal.add(
              med.precio
                .mul(d.cantidad)
                .mul(new Prisma.Decimal(100).sub(d.descuento))
                .div(100),
            );
          }
          subtotal = subtotal.toDecimalPlaces(2);
          total = total.add(subtotal);
          detalles.push({
            medicamento: { connect: { id: med.id } },
            cantidad: item.cantidad,
            precioUnitario: med.precio,
            subtotal,
            descuentosLote: {
              create: desglose.map((d) => ({
                loteId: d.loteId,
                cantidad: d.cantidad,
                descuento: d.descuento,
              })),
            },
          });
        }

        const ultimo = await tx.venta.findFirst({
          where: { serie },
          orderBy: { numero: 'desc' },
          select: { numero: true },
        });

        return tx.venta.create({
          data: {
            tipoComprobante: dto.tipoComprobante,
            serie,
            numero: (ultimo?.numero ?? 0) + 1,
            metodoPago: dto.metodoPago,
            clienteId: dto.clienteId,
            empleadoId,
            total,
            detalles: { create: detalles },
          },
          select: SELECT_DETALLE,
        });
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'Conflicto de numeración del comprobante, vuelva a intentar',
        );
      }
      throw e;
    }
  }

  findAll(desde?: string, hasta?: string) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (desde) createdAt.gte = new Date(`${desde}T00:00:00`);
    if (hasta) createdAt.lt = this.diaSiguiente(hasta);
    return this.prisma.venta.findMany({
      where: desde || hasta ? { createdAt } : undefined,
      select: SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const venta = await this.prisma.venta.findUnique({
      where: { id },
      select: SELECT_DETALLE,
    });
    if (!venta) throw new NotFoundException('Venta no encontrada');
    return venta;
  }

  private async validarCliente(
    tx: Prisma.TransactionClient,
    dto: CreateVentaDto,
  ) {
    const esFactura = dto.tipoComprobante === TipoComprobante.FACTURA;
    if (!dto.clienteId) {
      if (esFactura) {
        throw new BadRequestException('La factura requiere un cliente');
      }
      return;
    }
    const cliente = await tx.cliente.findUnique({
      where: { id: dto.clienteId },
      select: { tipoDocumento: true, activo: true },
    });
    if (!cliente || !cliente.activo) {
      throw new NotFoundException('Cliente no encontrado');
    }
    if (esFactura && cliente.tipoDocumento !== TipoDocumento.RUC) {
      throw new BadRequestException('La factura requiere un cliente con RUC');
    }
  }

  private diaSiguiente(fecha: string) {
    const d = new Date(`${fecha}T00:00:00`);
    d.setDate(d.getDate() + 1);
    return d;
  }
}
