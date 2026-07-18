import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TipoDocumento } from '../../generated/prisma/enums';
import { TELEFONO_MENSAJE, TELEFONO_REGEX } from '../../common/validacion';

export class CreateClienteDto {
  @IsEnum(TipoDocumento, { message: 'Tipo de documento inválido' })
  tipoDocumento: TipoDocumento;

  @IsString()
  @Matches(/^\d+$/, { message: 'El documento solo admite dígitos' })
  @MaxLength(11, { message: 'El documento no puede superar 11 dígitos' })
  numeroDocumento: string;

  @IsString()
  @MinLength(1, { message: 'El nombre o razón social es obligatorio' })
  @MaxLength(150, { message: 'El nombre no puede superar 150 caracteres' })
  nombre: string;

  @IsOptional()
  @IsString()
  @Matches(TELEFONO_REGEX, { message: TELEFONO_MENSAJE })
  @MaxLength(20, { message: 'El teléfono no puede superar 20 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'La dirección no puede superar 200 caracteres' })
  direccion?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  @MaxLength(120, { message: 'El email no puede superar 120 caracteres' })
  email?: string;
}
