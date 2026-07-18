import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../auth/roles.guard';
import { Rol } from '../generated/prisma/enums';
import { RangoFechasDto } from './dto/rango-fechas.dto';
import { ReportesService } from './reportes.service';

@Roles(Rol.ADMINISTRADOR)
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('ventas-diarias')
  ventasDiarias(@Query() rango: RangoFechasDto) {
    return this.reportesService.ventasDiarias(rango);
  }

  @Get('rotacion')
  rotacion(@Query() rango: RangoFechasDto) {
    return this.reportesService.rotacion(rango);
  }
}
