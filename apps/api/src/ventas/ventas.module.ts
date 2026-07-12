import { Module } from '@nestjs/common';
import { LotesModule } from '../lotes/lotes.module';
import { VentasController } from './ventas.controller';
import { VentasService } from './ventas.service';

@Module({
  imports: [LotesModule],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}
