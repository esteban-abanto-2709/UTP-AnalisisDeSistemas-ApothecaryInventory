import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClientesModule } from './clientes/clientes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InventarioModule } from './inventario/inventario.module';
import { LotesModule } from './lotes/lotes.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { VentasModule } from './ventas/ventas.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsuariosModule,
    ClientesModule,
    DashboardModule,
    InventarioModule,
    LotesModule,
    ProveedoresModule,
    VentasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
