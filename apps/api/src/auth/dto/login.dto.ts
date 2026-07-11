import { IsString, Matches, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^\d{8}$/, { message: 'El DNI debe tener 8 dígitos' })
  dni: string;

  @IsString()
  @MinLength(1, { message: 'La contraseña es obligatoria' })
  password: string;
}
