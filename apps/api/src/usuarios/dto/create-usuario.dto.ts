import {
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Rol } from '../../generated/prisma/enums';
import {
  NOMBRE_PERSONA_MENSAJE,
  NOMBRE_PERSONA_REGEX,
} from '../../common/validacion';

export class CreateUsuarioDto {
  @IsString()
  @Matches(/^\d{8}$/, { message: 'El DNI debe tener 8 dígitos' })
  dni: string;

  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  @Matches(NOMBRE_PERSONA_REGEX, { message: NOMBRE_PERSONA_MENSAJE })
  nombre: string;

  @IsEnum(Rol, { message: 'Rol inválido' })
  rol: Rol;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(72, { message: 'La contraseña no puede superar 72 caracteres' })
  password: string;
}
