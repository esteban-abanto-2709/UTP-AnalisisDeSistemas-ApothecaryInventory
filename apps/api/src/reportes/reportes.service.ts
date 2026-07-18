import { BadRequestException, Injectable } from '@nestjs/common';
import { claveDia, parseFechaLocal, sumarDias } from '../common/fechas';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RangoFechasDto } from './dto/rango-fechas.dto';

const MAX_DIAS = 366;

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  async ventasDiarias(rango: RangoFechasDto) {
    const { desde, hasta, dias } = this.resolverRango(rango);

    const ventas = await this.prisma.venta.findMany({
      where: { createdAt: { gte: desde, lt: hasta } },
      select: { createdAt: true, total: true },
    });

    const totales = new Map<string, Prisma.Decimal>();
    const comprobantes = new Map<string, number>();
    for (const v of ventas) {
      const clave = claveDia(v.createdAt);
      totales.set(
        clave,
        (totales.get(clave) ?? new Prisma.Decimal(0)).add(v.total),
      );
      comprobantes.set(clave, (comprobantes.get(clave) ?? 0) + 1);
    }

    const filas = Array.from({ length: dias }, (_, i) => {
      const clave = claveDia(sumarDias(desde, i));
      return {
        fecha: clave,
        comprobantes: comprobantes.get(clave) ?? 0,
        total: (totales.get(clave) ?? new Prisma.Decimal(0)).toFixed(2),
      };
    });

    const total = ventas.reduce(
      (suma, v) => suma.add(v.total),
      new Prisma.Decimal(0),
    );

    return {
      filas,
      totales: { comprobantes: ventas.length, total: total.toFixed(2) },
    };
  }

  async rotacion(rango: RangoFechasDto) {
    const { desde, hasta } = this.resolverRango(rango);

    const agrupado = await this.prisma.detalleVenta.groupBy({
      by: ['medicamentoId'],
      where: { venta: { createdAt: { gte: desde, lt: hasta } } },
      _sum: { cantidad: true, subtotal: true },
      orderBy: { _sum: { cantidad: 'desc' } },
    });

    const medicamentos = await this.prisma.medicamento.findMany({
      where: { id: { in: agrupado.map((g) => g.medicamentoId) } },
      select: { id: true, nombre: true },
    });
    const nombres = new Map(medicamentos.map((m) => [m.id, m.nombre]));

    const filas = agrupado.map((g) => ({
      medicamentoId: g.medicamentoId,
      nombre: nombres.get(g.medicamentoId) ?? `#${g.medicamentoId}`,
      unidades: g._sum.cantidad ?? 0,
      importe: (g._sum.subtotal ?? new Prisma.Decimal(0)).toFixed(2),
    }));

    return {
      filas,
      totales: {
        unidades: filas.reduce((suma, f) => suma + f.unidades, 0),
        importe: agrupado
          .reduce(
            (suma, g) => suma.add(g._sum.subtotal ?? 0),
            new Prisma.Decimal(0),
          )
          .toFixed(2),
      },
    };
  }

  private resolverRango({ desde, hasta }: RangoFechasDto) {
    const inicio = parseFechaLocal(desde);
    const fin = parseFechaLocal(hasta);
    if (fin < inicio) {
      throw new BadRequestException(
        'La fecha final no puede ser anterior a la inicial',
      );
    }

    const dias =
      Math.round((fin.getTime() - inicio.getTime()) / 86_400_000) + 1;
    if (dias > MAX_DIAS) {
      throw new BadRequestException(
        `El rango no puede superar ${MAX_DIAS} días`,
      );
    }

    return { desde: inicio, hasta: sumarDias(fin, 1), dias };
  }
}
