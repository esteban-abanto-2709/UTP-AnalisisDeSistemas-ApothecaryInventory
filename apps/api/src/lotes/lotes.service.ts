import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';

const SELECT = {
  id: true,
  codigo: true,
  medicamentoId: true,
  fechaVencimiento: true,
  stockInicial: true,
  stockActual: true,
  descuento: true,
  activo: true,
} as const;

@Injectable()
export class LotesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(medicamentoId?: number) {
    return this.prisma.lote.findMany({
      where: medicamentoId ? { medicamentoId } : undefined,
      select: SELECT,
      orderBy: [{ medicamentoId: 'asc' }, { fechaVencimiento: 'asc' }],
    });
  }

  async create(dto: CreateLoteDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const lote = await tx.lote.create({
          data: {
            codigo: dto.codigo,
            medicamentoId: dto.medicamentoId,
            fechaVencimiento: new Date(dto.fechaVencimiento),
            stockInicial: dto.stockInicial,
            stockActual: dto.stockInicial,
            descuento: dto.descuento ?? 0,
          },
          select: SELECT,
        });
        await tx.medicamento.update({
          where: { id: dto.medicamentoId },
          data: { stock: { increment: dto.stockInicial } },
        });
        return lote;
      });
    } catch (e) {
      this.rethrow(e);
    }
  }

  async update(id: number, dto: UpdateLoteDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const actual = await tx.lote.findUnique({
          where: { id },
          select: {
            activo: true,
            stockActual: true,
            stockInicial: true,
            medicamentoId: true,
          },
        });
        if (!actual) throw new NotFoundException('Lote no encontrado');

        if (
          dto.stockActual !== undefined &&
          dto.stockActual > actual.stockInicial
        ) {
          throw new ConflictException(
            'El stock del lote no puede superar su stock inicial',
          );
        }

        const lote = await tx.lote.update({
          where: { id },
          data: {
            codigo: dto.codigo,
            fechaVencimiento: dto.fechaVencimiento
              ? new Date(dto.fechaVencimiento)
              : undefined,
            descuento: dto.descuento,
            stockActual: dto.stockActual,
            activo: dto.activo,
          },
          select: SELECT,
        });

        const aportabaAntes = actual.activo ? actual.stockActual : 0;
        const aportaAhora =
          (dto.activo ?? actual.activo)
            ? (dto.stockActual ?? actual.stockActual)
            : 0;
        if (aportaAhora !== aportabaAntes) {
          await tx.medicamento.update({
            where: { id: actual.medicamentoId },
            data: { stock: { increment: aportaAhora - aportabaAntes } },
          });
        }
        return lote;
      });
    } catch (e) {
      this.rethrow(e);
    }
  }

  async descontarFEFO(
    tx: Prisma.TransactionClient,
    medicamentoId: number,
    cantidad: number,
  ) {
    if (cantidad <= 0) return [];

    const lotes = await tx.lote.findMany({
      where: { medicamentoId, activo: true, stockActual: { gt: 0 } },
      orderBy: [{ fechaVencimiento: 'asc' }, { id: 'asc' }],
      select: { id: true, stockActual: true, descuento: true },
    });

    const disponible = lotes.reduce((s, l) => s + l.stockActual, 0);
    if (disponible < cantidad) {
      throw new ConflictException('Stock insuficiente para el medicamento');
    }

    let restante = cantidad;
    const descuentos: {
      loteId: number;
      cantidad: number;
      descuento: Prisma.Decimal;
    }[] = [];

    for (const l of lotes) {
      if (restante <= 0) break;
      const usar = Math.min(restante, l.stockActual);
      await tx.lote.update({
        where: { id: l.id },
        data: { stockActual: { decrement: usar } },
      });
      descuentos.push({ loteId: l.id, cantidad: usar, descuento: l.descuento });
      restante -= usar;
    }

    await tx.medicamento.update({
      where: { id: medicamentoId },
      data: { stock: { decrement: cantidad } },
    });

    return descuentos;
  }

  private rethrow(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        throw new ConflictException(
          'Ya existe un lote con ese código para el medicamento',
        );
      }
      if (e.code === 'P2025') {
        throw new NotFoundException('Lote no encontrado');
      }
      if (e.code === 'P2003') {
        throw new NotFoundException('Medicamento no encontrado');
      }
    }
    throw e;
  }
}
