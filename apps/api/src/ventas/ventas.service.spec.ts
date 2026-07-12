import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client';
import { LotesService } from '../lotes/lotes.service';
import { PrismaService } from '../prisma/prisma.service';
import { VentasService } from './ventas.service';

type VentaCreateArgs = {
  data: {
    serie: string;
    numero: number;
    empleadoId: number;
    total: Prisma.Decimal;
    detalles: {
      create: {
        subtotal: Prisma.Decimal;
        descuentosLote: { create: unknown[] };
      }[];
    };
  };
};

describe('VentasService', () => {
  let service: VentasService;
  const descontarFEFO = jest.fn();
  const medicamentoFindUnique = jest.fn();
  const clienteFindUnique = jest.fn();
  const ventaFindFirst = jest.fn();
  const ventaCreate = jest.fn<Promise<unknown>, [VentaCreateArgs]>();
  const tx = {
    medicamento: { findUnique: medicamentoFindUnique },
    cliente: { findUnique: clienteFindUnique },
    venta: { findFirst: ventaFindFirst, create: ventaCreate },
  };
  const prisma = {
    $transaction: (fn: (tx: unknown) => unknown) => fn(tx),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        VentasService,
        { provide: PrismaService, useValue: prisma },
        { provide: LotesService, useValue: { descontarFEFO } },
      ],
    }).compile();

    service = module.get(VentasService);
    jest.resetAllMocks();
    ventaCreate.mockResolvedValue({});
  });

  it('calcula el total aplicando el descuento de cada lote y el correlativo por serie', async () => {
    medicamentoFindUnique.mockResolvedValue({
      id: 7,
      precio: new Prisma.Decimal('2.50'),
      activo: true,
    });
    descontarFEFO.mockResolvedValue([
      { loteId: 1, cantidad: 30, descuento: new Prisma.Decimal(15) },
      { loteId: 2, cantidad: 10, descuento: new Prisma.Decimal(0) },
    ]);
    ventaFindFirst.mockResolvedValue({ numero: 4 });

    await service.create(9, {
      tipoComprobante: 'BOLETA',
      metodoPago: 'EFECTIVO',
      items: [{ medicamentoId: 7, cantidad: 40 }],
    });

    expect(descontarFEFO).toHaveBeenCalledWith(tx, 7, 40);
    const { data } = ventaCreate.mock.calls[0][0];
    expect(data.serie).toBe('B001');
    expect(data.numero).toBe(5);
    expect(data.empleadoId).toBe(9);
    expect(String(data.total)).toBe('88.75');
    expect(String(data.detalles.create[0].subtotal)).toBe('88.75');
    expect(data.detalles.create[0].descuentosLote.create).toHaveLength(2);
  });

  it('rechaza factura sin cliente', async () => {
    await expect(
      service.create(9, {
        tipoComprobante: 'FACTURA',
        metodoPago: 'TARJETA',
        items: [{ medicamentoId: 7, cantidad: 1 }],
      }),
    ).rejects.toThrow(
      new BadRequestException('La factura requiere un cliente'),
    );
    expect(descontarFEFO).not.toHaveBeenCalled();
  });

  it('rechaza factura con cliente sin RUC', async () => {
    clienteFindUnique.mockResolvedValue({
      tipoDocumento: 'DNI',
      activo: true,
    });
    await expect(
      service.create(9, {
        tipoComprobante: 'FACTURA',
        metodoPago: 'TARJETA',
        clienteId: 3,
        items: [{ medicamentoId: 7, cantidad: 1 }],
      }),
    ).rejects.toThrow(
      new BadRequestException('La factura requiere un cliente con RUC'),
    );
    expect(descontarFEFO).not.toHaveBeenCalled();
  });
});
