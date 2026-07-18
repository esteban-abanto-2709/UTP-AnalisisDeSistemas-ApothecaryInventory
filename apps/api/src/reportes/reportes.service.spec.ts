import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReportesService } from './reportes.service';

describe('ReportesService', () => {
  let service: ReportesService;
  const ventaFindMany = jest.fn();
  const detalleGroupBy = jest.fn();
  const medicamentoFindMany = jest.fn();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReportesService,
        {
          provide: PrismaService,
          useValue: {
            venta: { findMany: ventaFindMany },
            detalleVenta: { groupBy: detalleGroupBy },
            medicamento: { findMany: medicamentoFindMany },
          },
        },
      ],
    }).compile();

    service = module.get(ReportesService);
    ventaFindMany.mockReset().mockResolvedValue([]);
    detalleGroupBy.mockReset().mockResolvedValue([]);
    medicamentoFindMany.mockReset().mockResolvedValue([]);
  });

  it('agrupa las ventas por día e incluye los días sin registros', async () => {
    ventaFindMany.mockResolvedValue([
      { createdAt: new Date(2026, 6, 1, 10), total: new Prisma.Decimal(20) },
      { createdAt: new Date(2026, 6, 1, 18), total: new Prisma.Decimal(5.5) },
      { createdAt: new Date(2026, 6, 3, 9), total: new Prisma.Decimal(10) },
    ]);

    const reporte = await service.ventasDiarias({
      desde: '2026-07-01',
      hasta: '2026-07-03',
    });

    expect(reporte.filas).toEqual([
      { fecha: '2026-07-01', comprobantes: 2, total: '25.50' },
      { fecha: '2026-07-02', comprobantes: 0, total: '0.00' },
      { fecha: '2026-07-03', comprobantes: 1, total: '10.00' },
    ]);
    expect(reporte.totales).toEqual({ comprobantes: 3, total: '35.50' });
  });

  it('un periodo sin ventas devuelve los días en cero, no vacío', async () => {
    const reporte = await service.ventasDiarias({
      desde: '2026-07-01',
      hasta: '2026-07-02',
    });

    expect(reporte.filas).toEqual([
      { fecha: '2026-07-01', comprobantes: 0, total: '0.00' },
      { fecha: '2026-07-02', comprobantes: 0, total: '0.00' },
    ]);
    expect(reporte.totales).toEqual({ comprobantes: 0, total: '0.00' });
  });

  it('rechaza con 400 un rango invertido', async () => {
    await expect(
      service.ventasDiarias({ desde: '2026-07-10', hasta: '2026-07-01' }),
    ).rejects.toThrow(BadRequestException);
    expect(ventaFindMany).not.toHaveBeenCalled();
  });

  it('rechaza con 400 un rango mayor a un año', async () => {
    await expect(
      service.ventasDiarias({ desde: '2025-01-01', hasta: '2026-12-31' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('la rotación resuelve el nombre del medicamento y suma los totales', async () => {
    detalleGroupBy.mockResolvedValue([
      {
        medicamentoId: 7,
        _sum: { cantidad: 12, subtotal: new Prisma.Decimal(96) },
      },
      {
        medicamentoId: 3,
        _sum: { cantidad: 4, subtotal: new Prisma.Decimal(18.5) },
      },
    ]);
    medicamentoFindMany.mockResolvedValue([
      { id: 3, nombre: 'Amoxicilina' },
      { id: 7, nombre: 'Paracetamol' },
    ]);

    const reporte = await service.rotacion({
      desde: '2026-07-01',
      hasta: '2026-07-31',
    });

    expect(reporte.filas).toEqual([
      {
        medicamentoId: 7,
        nombre: 'Paracetamol',
        unidades: 12,
        importe: '96.00',
      },
      {
        medicamentoId: 3,
        nombre: 'Amoxicilina',
        unidades: 4,
        importe: '18.50',
      },
    ]);
    expect(reporte.totales).toEqual({ unidades: 16, importe: '114.50' });
  });
});
