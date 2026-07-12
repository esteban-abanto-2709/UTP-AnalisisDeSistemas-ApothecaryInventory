import { Test } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  const ventaFindMany = jest.fn();
  const medicamentoFindMany = jest.fn();
  const loteFindMany = jest.fn();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: {
            venta: { findMany: ventaFindMany },
            medicamento: {
              findMany: medicamentoFindMany,
              fields: { stockMinimo: 'stockMinimo' },
            },
            lote: { findMany: loteFindMany },
          },
        },
      ],
    }).compile();

    service = module.get(DashboardService);
    ventaFindMany.mockReset();
    medicamentoFindMany.mockReset();
    loteFindMany.mockReset();
  });

  it('agrupa las ventas por día y calcula hoy y ayer', async () => {
    const hoy = new Date();
    hoy.setHours(12, 0, 0, 0);
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    ventaFindMany.mockResolvedValue([
      { createdAt: hoy, total: new Prisma.Decimal('10.50') },
      { createdAt: hoy, total: new Prisma.Decimal('4.50') },
      { createdAt: ayer, total: new Prisma.Decimal('20.00') },
    ]);
    medicamentoFindMany.mockResolvedValue([]);
    loteFindMany.mockResolvedValue([]);

    const resumen = await service.resumen();

    expect(resumen.hoy).toEqual({ total: '15.00', comprobantes: 2 });
    expect(resumen.ayer).toEqual({ total: '20.00', comprobantes: 1 });
    expect(resumen.ventas7dias).toHaveLength(7);
    expect(resumen.ventas7dias[6].total).toBe('15.00');
    expect(resumen.ventas7dias[5].total).toBe('20.00');
  });

  it('devuelve días en cero cuando no hay ventas', async () => {
    ventaFindMany.mockResolvedValue([]);
    medicamentoFindMany.mockResolvedValue([]);
    loteFindMany.mockResolvedValue([]);

    const resumen = await service.resumen();

    expect(resumen.hoy).toEqual({ total: '0.00', comprobantes: 0 });
    expect(resumen.ventas7dias.every((d) => d.total === '0.00')).toBe(true);
  });
});
