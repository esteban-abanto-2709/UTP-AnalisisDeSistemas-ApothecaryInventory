import { IsDateString } from 'class-validator';

export class RangoFechasDto {
  @IsDateString({}, { message: 'La fecha inicial no es válida' })
  desde: string;

  @IsDateString({}, { message: 'La fecha final no es válida' })
  hasta: string;
}
