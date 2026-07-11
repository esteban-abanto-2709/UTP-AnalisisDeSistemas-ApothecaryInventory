import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  let service: UsuariosService;
  const create = jest.fn();
  const update = jest.fn();
  const findMany = jest.fn();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: PrismaService,
          useValue: { empleado: { create, update, findMany } },
        },
      ],
    }).compile();

    service = module.get(UsuariosService);
    create.mockReset();
    update.mockReset();
    findMany.mockReset();
  });

  it('crea un empleado con la contraseña hasheada', async () => {
    create.mockImplementation(({ data }) => Promise.resolve(data));
    const result = (await service.create({
      dni: '87654321',
      nombre: 'Vendedor Uno',
      rol: 'VENDEDOR',
      password: 'secreto1',
    })) as unknown as { passwordHash: string };
    expect(result.passwordHash).not.toBe('secreto1');
    expect(bcrypt.compareSync('secreto1', result.passwordHash)).toBe(true);
  });

  it('rechaza DNI duplicado con 409', async () => {
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    await expect(
      service.create({
        dni: '87654321',
        nombre: 'Repetido',
        rol: 'VENDEDOR',
        password: 'secreto1',
      }),
    ).rejects.toThrow(
      new ConflictException('Ya existe un empleado con ese DNI'),
    );
  });

  it('impide que el admin desactive su propia cuenta', async () => {
    await expect(service.update(1, { activo: false }, 1)).rejects.toThrow(
      new BadRequestException('No puedes desactivar tu propia cuenta'),
    );
    expect(update).not.toHaveBeenCalled();
  });

  it('re-hashea la contraseña solo cuando viene en la edición', async () => {
    update.mockImplementation(({ data }) => Promise.resolve(data));
    const sinPassword = await service.update(2, { nombre: 'Nuevo Nombre' }, 1);
    expect(sinPassword).toEqual({ nombre: 'Nuevo Nombre' });

    const conPassword = await service.update(2, { password: 'nueva123' }, 1);
    expect(
      bcrypt.compareSync(
        'nueva123',
        (conPassword as { passwordHash: string }).passwordHash,
      ),
    ).toBe(true);
  });
});
