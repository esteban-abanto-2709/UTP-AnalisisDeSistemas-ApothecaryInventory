import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProveedoresService } from './proveedores.service';

describe('ProveedoresService', () => {
  let service: ProveedoresService;
  const create = jest.fn();
  const update = jest.fn();

  const knownError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError('err', {
      code,
      clientVersion: 'test',
    });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProveedoresService,
        {
          provide: PrismaService,
          useValue: { proveedor: { create, update } },
        },
      ],
    }).compile();

    service = module.get(ProveedoresService);
    create.mockReset();
    update.mockReset();
  });

  it('rechaza RUC duplicado con 409', async () => {
    create.mockRejectedValue(knownError('P2002'));
    await expect(
      service.create({ ruc: '20123456789', razonSocial: 'Farmindustria' }),
    ).rejects.toThrow(
      new ConflictException('Ya existe un proveedor con ese RUC'),
    );
  });

  it('responde 404 al editar un proveedor inexistente', async () => {
    update.mockRejectedValue(knownError('P2025'));
    await expect(service.update(99, { activo: false })).rejects.toThrow(
      new NotFoundException('Proveedor no encontrado'),
    );
  });
});
