import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { type AuthenticatedRequest } from '../auth/auth.guard';
import { Roles } from '../auth/roles.guard';
import { Rol } from '../generated/prisma/enums';
import { CreateVentaDto } from './dto/create-venta.dto';
import { VentasService } from './ventas.service';

@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateVentaDto) {
    return this.ventasService.create(req.user.id, dto);
  }

  @Roles(Rol.ADMINISTRADOR)
  @Get()
  findAll(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.ventasService.findAll(desde, hasta);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ventasService.findOne(id);
  }
}
