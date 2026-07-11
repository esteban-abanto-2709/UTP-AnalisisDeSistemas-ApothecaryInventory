import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dni: string, password: string) {
    const empleado = await this.prisma.empleado.findUnique({ where: { dni } });

    if (!empleado || !(await bcrypt.compare(password, empleado.passwordHash))) {
      throw new UnauthorizedException('DNI o contraseña incorrectos');
    }
    if (!empleado.activo) {
      throw new UnauthorizedException(
        'Usuario inactivo, contacte al administrador',
      );
    }

    const token = await this.jwt.signAsync({ sub: empleado.id });
    return {
      token,
      empleado: {
        id: empleado.id,
        dni: empleado.dni,
        nombre: empleado.nombre,
        rol: empleado.rol,
      },
    };
  }
}
