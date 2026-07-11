import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const findUnique = jest.fn();

  const empleado = {
    id: 1,
    dni: '12345678',
    nombre: 'Administrador',
    passwordHash: bcrypt.hashSync('Admin123', 4),
    rol: 'ADMINISTRADOR',
    activo: true,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: { empleado: { findUnique } } },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('jwt-token') },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    findUnique.mockReset();
  });

  it('devuelve token y datos con credenciales válidas', async () => {
    findUnique.mockResolvedValue(empleado);
    const result = await service.login('12345678', 'Admin123');
    expect(result.token).toBe('jwt-token');
    expect(result.empleado).toEqual({
      id: 1,
      dni: '12345678',
      nombre: 'Administrador',
      rol: 'ADMINISTRADOR',
    });
  });

  it('rechaza contraseña incorrecta', async () => {
    findUnique.mockResolvedValue(empleado);
    await expect(service.login('12345678', 'mala')).rejects.toThrow(
      new UnauthorizedException('DNI o contraseña incorrectos'),
    );
  });

  it('rechaza DNI inexistente', async () => {
    findUnique.mockResolvedValue(null);
    await expect(service.login('99999999', 'Admin123')).rejects.toThrow(
      new UnauthorizedException('DNI o contraseña incorrectos'),
    );
  });

  it('rechaza usuario inactivo', async () => {
    findUnique.mockResolvedValue({ ...empleado, activo: false });
    await expect(service.login('12345678', 'Admin123')).rejects.toThrow(
      new UnauthorizedException('Usuario inactivo, contacte al administrador'),
    );
  });
});
