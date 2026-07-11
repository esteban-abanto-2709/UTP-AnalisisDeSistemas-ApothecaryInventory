import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Rol } from '../../generated/prisma/enums';

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  nombre?: string;

  @IsOptional()
  @IsEnum(Rol, { message: 'Rol inválido' })
  rol?: Rol;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
