import { IsEnum, IsString, Matches, MinLength } from 'class-validator';
import { Rol } from '../../generated/prisma/enums';

export class CreateUsuarioDto {
  @IsString()
  @Matches(/^\d{8}$/, { message: 'El DNI debe tener 8 dígitos' })
  dni: string;

  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  nombre: string;

  @IsEnum(Rol, { message: 'Rol inválido' })
  rol: Rol;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
