import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../auth/roles.guard';
import { Rol } from '../generated/prisma/enums';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { InventarioService } from './inventario.service';

@Controller('productos')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Get()
  findAll() {
    return this.inventarioService.findAll();
  }

  @Roles(Rol.ADMINISTRADOR)
  @Post()
  create(@Body() dto: CreateProductoDto) {
    return this.inventarioService.create(dto);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductoDto,
  ) {
    return this.inventarioService.update(id, dto);
  }
}
