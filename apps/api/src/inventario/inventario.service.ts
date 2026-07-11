import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

const SELECT = {
  id: true,
  nombre: true,
  precio: true,
  stock: true,
  activo: true,
} as const;

@Injectable()
export class InventarioService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.medicamento.findMany({
      select: SELECT,
      orderBy: { nombre: 'asc' },
    });
  }

  async create(dto: CreateProductoDto) {
    try {
      return await this.prisma.medicamento.create({
        data: dto,
        select: SELECT,
      });
    } catch (e) {
      this.rethrow(e);
    }
  }

  async update(id: number, dto: UpdateProductoDto) {
    try {
      return await this.prisma.medicamento.update({
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
        throw new ConflictException('Ya existe un producto con ese nombre');
      }
      if (e.code === 'P2025') {
        throw new NotFoundException('Producto no encontrado');
      }
    }
    throw e;
  }
}
