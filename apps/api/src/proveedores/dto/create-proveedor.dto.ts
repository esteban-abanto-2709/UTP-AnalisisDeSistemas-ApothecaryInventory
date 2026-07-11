import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateProveedorDto {
  @IsString()
  @Matches(/^\d{11}$/, { message: 'El RUC debe tener 11 dígitos' })
  ruc: string;

  @IsString()
  @MinLength(1, { message: 'La razón social es obligatoria' })
  razonSocial: string;

  @IsOptional()
  @IsString()
  asesorNombre?: string;

  @IsOptional()
  @IsString()
  asesorTelefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  asesorEmail?: string;
}
