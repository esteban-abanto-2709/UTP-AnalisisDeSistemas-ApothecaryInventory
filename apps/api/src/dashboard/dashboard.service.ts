import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DIAS_TENDENCIA = 7;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async resumen() {
    const hoy = this.inicioDia(new Date());
    const inicioVentana = this.sumarDias(hoy, -(DIAS_TENDENCIA - 1));
    const manana = this.sumarDias(hoy, 1);

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
      const clave = this.claveDia(v.createdAt);
      porDia.set(
        clave,
        (porDia.get(clave) ?? new Prisma.Decimal(0)).add(v.total),
      );
      comprobantesPorDia.set(clave, (comprobantesPorDia.get(clave) ?? 0) + 1);
    }

    const ventas7dias = Array.from({ length: DIAS_TENDENCIA }, (_, i) => {
      const dia = this.sumarDias(inicioVentana, i);
      const clave = this.claveDia(dia);
      return {
        fecha: clave,
        total: (porDia.get(clave) ?? new Prisma.Decimal(0)).toFixed(2),
        comprobantes: comprobantesPorDia.get(clave) ?? 0,
      };
    });

    const claveHoy = this.claveDia(hoy);
    const claveAyer = this.claveDia(this.sumarDias(hoy, -1));

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

  private inicioDia(fecha: Date) {
    const d = new Date(fecha);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private sumarDias(fecha: Date, dias: number) {
    const d = new Date(fecha);
    d.setDate(d.getDate() + dias);
    return d;
  }

  private claveDia(fecha: Date) {
    const d = new Date(fecha);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
