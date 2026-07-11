import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ClientesService } from './clientes.service';

describe('ClientesService', () => {
  let service: ClientesService;
  const create = jest.fn();
  const findUnique = jest.fn();

  const knownError = (code: string) =>
    new Prisma.PrismaClientKnownRequestError('err', {
      code,
      clientVersion: 'test',
    });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ClientesService,
        {
          provide: PrismaService,
          useValue: { cliente: { create, findUnique } },
        },
      ],
    }).compile();

    service = module.get(ClientesService);
    create.mockReset();
    findUnique.mockReset();
  });

  it('rechaza DNI que no tiene 8 dígitos', async () => {
    await expect(
      service.create({
        tipoDocumento: 'DNI',
        numeroDocumento: '123',
        nombre: 'Ana',
      }),
    ).rejects.toThrow(new BadRequestException('El DNI debe tener 8 dígitos'));
    expect(create).not.toHaveBeenCalled();
  });

  it('rechaza RUC que no tiene 11 dígitos', async () => {
    await expect(
      service.create({
        tipoDocumento: 'RUC',
        numeroDocumento: '20123456789012',
        nombre: 'Clínica',
      }),
    ).rejects.toThrow(new BadRequestException('El RUC debe tener 11 dígitos'));
  });

  it('rechaza documento duplicado con 409', async () => {
    create.mockRejectedValue(knownError('P2002'));
    await expect(
      service.create({
        tipoDocumento: 'DNI',
        numeroDocumento: '44556677',
        nombre: 'Ana',
      }),
    ).rejects.toThrow(
      new ConflictException('Ya existe un cliente con ese documento'),
    );
  });

  it('responde 404 al buscar un documento inexistente', async () => {
    findUnique.mockResolvedValue(null);
    await expect(service.findByDocumento('99999999')).rejects.toThrow(
      new NotFoundException('Cliente no encontrado'),
    );
  });
});
