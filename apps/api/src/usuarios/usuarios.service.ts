import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

const SELECT = {
  id: true,
  dni: true,
  nombre: true,
  rol: true,
  activo: true,
} as const;

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.empleado.findMany({
      select: SELECT,
      orderBy: { id: 'asc' },
    });
  }

  async create(dto: CreateUsuarioDto) {
    try {
      return await this.prisma.empleado.create({
        data: {
          dni: dto.dni,
          nombre: dto.nombre,
          rol: dto.rol,
          passwordHash: await bcrypt.hash(dto.password, 10),
        },
        select: SELECT,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un empleado con ese DNI');
      }
      throw e;
    }
  }

  async update(id: number, dto: UpdateUsuarioDto, currentUserId: number) {
    if (dto.activo === false && id === currentUserId) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta');
    }

    const { password, ...rest } = dto;
    const data: Prisma.EmpleadoUpdateInput = { ...rest };
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    try {
      return await this.prisma.empleado.update({
        where: { id },
        data,
        select: SELECT,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('Empleado no encontrado');
      }
      throw e;
    }
  }
}
