import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { TipoDocumento } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';

const SELECT = {
  id: true,
  tipoDocumento: true,
  numeroDocumento: true,
  nombre: true,
  telefono: true,
  direccion: true,
  email: true,
  activo: true,
} as const;

const LONGITUD: Record<TipoDocumento, number> = {
  [TipoDocumento.DNI]: 8,
  [TipoDocumento.RUC]: 11,
};

@Injectable()
export class ClientesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(q?: string) {
    return this.prisma.cliente.findMany({
      where: q
        ? {
            OR: [
              { numeroDocumento: { contains: q } },
              { nombre: { contains: q, mode: 'insensitive' } },
            ],
          }
        : undefined,
      select: SELECT,
      orderBy: { nombre: 'asc' },
    });
  }

  async findByDocumento(numeroDocumento: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { numeroDocumento },
      select: SELECT,
    });
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
    return cliente;
  }

  async create(dto: CreateClienteDto) {
    this.validarLongitud(dto.tipoDocumento, dto.numeroDocumento);
    try {
      return await this.prisma.cliente.create({ data: dto, select: SELECT });
    } catch (e) {
      this.rethrow(e);
    }
  }

  async update(id: number, dto: UpdateClienteDto) {
    try {
      return await this.prisma.cliente.update({
        where: { id },
        data: dto,
        select: SELECT,
      });
    } catch (e) {
      this.rethrow(e);
    }
  }

  private validarLongitud(tipo: TipoDocumento, numero: string) {
    const len = LONGITUD[tipo];
    if (numero.length !== len) {
      throw new BadRequestException(`El ${tipo} debe tener ${len} dígitos`);
    }
  }

  private rethrow(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        throw new ConflictException('Ya existe un cliente con ese documento');
      }
      if (e.code === 'P2025') {
        throw new NotFoundException('Cliente no encontrado');
      }
    }
    throw e;
  }
}
