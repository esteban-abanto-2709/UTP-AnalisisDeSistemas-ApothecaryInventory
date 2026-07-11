import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

const SELECT = {
  id: true,
  ruc: true,
  razonSocial: true,
  asesorNombre: true,
  asesorTelefono: true,
  asesorEmail: true,
  activo: true,
} as const;

@Injectable()
export class ProveedoresService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(q?: string) {
    return this.prisma.proveedor.findMany({
      where: q
        ? {
            OR: [
              { ruc: { contains: q } },
              { razonSocial: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: SELECT,
      orderBy: { razonSocial: 'asc' },
    });
  }

  async create(dto: CreateProveedorDto) {
    try {
      return await this.prisma.proveedor.create({ data: dto, select: SELECT });
    } catch (e) {
      this.rethrow(e);
    }
  }

  async update(id: number, dto: UpdateProveedorDto) {
    try {
      return await this.prisma.proveedor.update({
        where: { id },
        data: dto,
        select: SELECT,
      });
    } catch (e) {
      this.rethrow(e);
    }
  }

  private rethrow(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        throw new ConflictException('Ya existe un proveedor con ese RUC');
      }
      if (e.code === 'P2025') {
        throw new NotFoundException('Proveedor no encontrado');
      }
    }
    throw e;
  }
}
