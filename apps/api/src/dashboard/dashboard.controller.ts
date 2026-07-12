import { Controller, Get } from '@nestjs/common';
import { Roles } from '../auth/roles.guard';
import { Rol } from '../generated/prisma/enums';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles(Rol.ADMINISTRADOR)
  @Get()
  resumen() {
    return this.dashboardService.resumen();
  }
}
