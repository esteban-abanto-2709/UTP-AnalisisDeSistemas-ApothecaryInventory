import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TELEFONO_MENSAJE, TELEFONO_REGEX } from '../../common/validacion';

export class UpdateClienteDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'El nombre o razón social es obligatorio' })
  @MaxLength(150, { message: 'El nombre no puede superar 150 caracteres' })
  nombre?: string;

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

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
