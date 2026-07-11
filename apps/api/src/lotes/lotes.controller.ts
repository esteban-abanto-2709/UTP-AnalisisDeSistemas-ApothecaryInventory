import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/roles.guard';
import { Rol } from '../generated/prisma/enums';
import { CreateLoteDto } from './dto/create-lote.dto';
import { UpdateLoteDto } from './dto/update-lote.dto';
import { LotesService } from './lotes.service';

@Roles(Rol.ADMINISTRADOR)
@Controller('lotes')
export class LotesController {
  constructor(private readonly lotesService: LotesService) {}

  @Get()
  findAll(
    @Query('medicamentoId', new ParseIntPipe({ optional: true }))
    medicamentoId?: number,
  ) {
    return this.lotesService.findAll(medicamentoId);
  }

  @Post()
  create(@Body() dto: CreateLoteDto) {
    return this.lotesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLoteDto) {
    return this.lotesService.update(id, dto);
  }
}
