import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { Rol } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const AUTH_COOKIE = 'token';

export type AuthUser = {
  id: number;
  dni: string;
  nombre: string;
  rol: Rol;
};

export type AuthenticatedRequest = Request & { user: AuthUser };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = (request.cookies as Record<string, string>)?.[AUTH_COOKIE];
    if (!token) throw new UnauthorizedException('No autenticado');

    let payload: { sub: number };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Sesión inválida o expirada');
    }

    const empleado = await this.prisma.empleado.findUnique({
      where: { id: payload.sub },
    });
    if (!empleado || !empleado.activo) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    (request as AuthenticatedRequest).user = {
      id: empleado.id,
      dni: empleado.dni,
      nombre: empleado.nombre,
      rol: empleado.rol,
    };
    return true;
  }
}
