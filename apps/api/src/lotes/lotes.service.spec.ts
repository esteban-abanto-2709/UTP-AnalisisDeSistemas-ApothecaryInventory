import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LotesService } from './lotes.service';

describe('LotesService', () => {
  let service: LotesService;
  const loteFindMany = jest.fn();
  const loteUpdate = jest.fn();
  const medicamentoUpdate = jest.fn();
  const tx = {
    lote: { findMany: loteFindMany, update: loteUpdate },
    medicamento: { update: medicamentoUpdate },
  } as unknown as Prisma.TransactionClient;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [LotesService, { provide: PrismaService, useValue: {} }],
    }).compile();

    service = module.get(LotesService);
    loteFindMany.mockReset();
    loteUpdate.mockReset().mockResolvedValue({});
    medicamentoUpdate.mockReset().mockResolvedValue({});
  });

  it('FEFO descuenta primero del lote que vence antes y abarca varios lotes', async () => {
    loteFindMany.mockResolvedValue([
      { id: 1, stockActual: 30, descuento: new Prisma.Decimal(0) },
      { id: 2, stockActual: 50, descuento: new Prisma.Decimal(10) },
    ]);

    const desglose = await service.descontarFEFO(tx, 7, 40);

    expect(desglose).toEqual([
      { loteId: 1, cantidad: 30, descuento: new Prisma.Decimal(0) },
      { loteId: 2, cantidad: 10, descuento: new Prisma.Decimal(10) },
    ]);
    expect(loteUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: 1 },
      data: { stockActual: { decrement: 30 } },
    });
    expect(loteUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 2 },
      data: { stockActual: { decrement: 10 } },
    });
    expect(medicamentoUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { stock: { decrement: 40 } },
    });
  });

  it('FEFO rechaza con 409 cuando el stock es insuficiente', async () => {
    loteFindMany.mockResolvedValue([
      { id: 1, stockActual: 5, descuento: new Prisma.Decimal(0) },
    ]);

    await expect(service.descontarFEFO(tx, 7, 40)).rejects.toThrow(
      new ConflictException('Stock insuficiente para el medicamento'),
    );
    expect(loteUpdate).not.toHaveBeenCalled();
    expect(medicamentoUpdate).not.toHaveBeenCalled();
  });
});
