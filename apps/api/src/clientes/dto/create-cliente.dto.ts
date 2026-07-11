import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { TipoDocumento } from '../../generated/prisma/enums';

export class CreateClienteDto {
  @IsEnum(TipoDocumento, { message: 'Tipo de documento inválido' })
  tipoDocumento: TipoDocumento;

  @IsString()
  @Matches(/^\d+$/, { message: 'El documento solo admite dígitos' })
  numeroDocumento: string;

  @IsString()
  @MinLength(1, { message: 'El nombre o razón social es obligatorio' })
  nombre: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  email?: string;
}
