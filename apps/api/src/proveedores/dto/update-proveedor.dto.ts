import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateProveedorDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'La razón social es obligatoria' })
  razonSocial?: string;

  @IsOptional()
  @IsString()
  asesorNombre?: string;

  @IsOptional()
  @IsString()
  asesorTelefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  asesorEmail?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
