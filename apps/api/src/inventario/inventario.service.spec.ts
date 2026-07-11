import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InventarioService } from './inventario.service';

describe('InventarioService', () => {
  let service: InventarioService;
  const create = jest.fn();
  const update = jest.fn();
  const findMany = jest.fn();

  const knownError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError('err', {
      code,
      clientVersion: 'test',
    });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        InventarioService,
        {
          provide: PrismaService,
          useValue: { medicamento: { create, update, findMany } },
        },
      ],
    }).compile();

    service = module.get(InventarioService);
    create.mockReset();
    update.mockReset();
    findMany.mockReset();
  });

  it('rechaza nombre duplicado con 409', async () => {
    create.mockRejectedValue(knownError('P2002'));
    await expect(
      service.create({ nombre: 'Paracetamol 500mg', precio: 1.5, stock: 10 }),
    ).rejects.toThrow(
      new ConflictException('Ya existe un producto con ese nombre'),
    );
  });

  it('responde 404 al editar un producto inexistente', async () => {
    update.mockRejectedValue(knownError('P2025'));
    await expect(service.update(99, { stock: 5 })).rejects.toThrow(
      new NotFoundException('Producto no encontrado'),
    );
  });

  it('rechaza renombrar a un nombre ya existente con 409', async () => {
    update.mockRejectedValue(knownError('P2002'));
    await expect(
      service.update(1, { nombre: 'Paracetamol 500mg' }),
    ).rejects.toThrow(
      new ConflictException('Ya existe un producto con ese nombre'),
    );
  });
});
