import { Injectable } from '@nestjs/common';
import { claveDia, inicioDia, sumarDias } from '../common/fechas';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DIAS_TENDENCIA = 7;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async resumen() {
    const hoy = inicioDia(new Date());
    const inicioVentana = sumarDias(hoy, -(DIAS_TENDENCIA - 1));
    const manana = sumarDias(hoy, 1);

    const [ventas, alertasStock, lotesPorVencer] = await Promise.all([
      this.prisma.venta.findMany({
        where: { createdAt: { gte: inicioVentana, lt: manana } },
        select: { createdAt: true, total: true },
      }),
      this.prisma.medicamento.findMany({
        where: {
          activo: true,
          stock: { lte: this.prisma.medicamento.fields.stockMinimo },
        },
        select: { id: true, nombre: true, stock: true, stockMinimo: true },
        orderBy: { stock: 'asc' },
      }),
      this.prisma.lote.findMany({
        where: {
          activo: true,
          stockActual: { gt: 0 },
          fechaVencimiento: { gte: hoy },
        },
        select: {
          id: true,
          codigo: true,
          fechaVencimiento: true,
          stockActual: true,
          medicamento: { select: { id: true, nombre: true } },
        },
        orderBy: { fechaVencimiento: 'asc' },
        take: 5,
      }),
    ]);

    const porDia = new Map<string, Prisma.Decimal>();
    const comprobantesPorDia = new Map<string, number>();
    for (const v of ventas) {
      const clave = claveDia(v.createdAt);
      porDia.set(
        clave,
        (porDia.get(clave) ?? new Prisma.Decimal(0)).add(v.total),
      );
      comprobantesPorDia.set(clave, (comprobantesPorDia.get(clave) ?? 0) + 1);
    }

    const ventas7dias = Array.from({ length: DIAS_TENDENCIA }, (_, i) => {
      const dia = sumarDias(inicioVentana, i);
      const clave = claveDia(dia);
      return {
        fecha: clave,
        total: (porDia.get(clave) ?? new Prisma.Decimal(0)).toFixed(2),
        comprobantes: comprobantesPorDia.get(clave) ?? 0,
      };
    });

    const claveHoy = claveDia(hoy);
    const claveAyer = claveDia(sumarDias(hoy, -1));

    return {
      hoy: {
        total: (porDia.get(claveHoy) ?? new Prisma.Decimal(0)).toFixed(2),
        comprobantes: comprobantesPorDia.get(claveHoy) ?? 0,
      },
      ayer: {
        total: (porDia.get(claveAyer) ?? new Prisma.Decimal(0)).toFixed(2),
        comprobantes: comprobantesPorDia.get(claveAyer) ?? 0,
      },
      ventas7dias,
      alertasStock,
      lotesPorVencer,
    };
  }
}
