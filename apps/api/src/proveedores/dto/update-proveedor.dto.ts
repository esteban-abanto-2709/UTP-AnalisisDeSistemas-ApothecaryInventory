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

export class UpdateProveedorDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'La razón social es obligatoria' })
  @MaxLength(200, {
    message: 'La razón social no puede superar 200 caracteres',
  })
  razonSocial?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: 'El nombre del asesor no puede superar 100 caracteres',
  })
  asesorNombre?: string;

  @IsOptional()
  @IsString()
  @Matches(TELEFONO_REGEX, { message: TELEFONO_MENSAJE })
  @MaxLength(20, { message: 'El teléfono no puede superar 20 caracteres' })
  asesorTelefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  @MaxLength(120, { message: 'El email no puede superar 120 caracteres' })
  asesorEmail?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
