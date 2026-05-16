import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsMobilePhone,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegistroDto {
  @ApiProperty({ example: 'Pedro' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  nombre: string;

  @ApiProperty({ example: 'González' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  apellido: string;

  @ApiProperty({ example: 'pedro.gonzalez@mineria.com' })
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email: string;

  @ApiProperty({ example: 'Segura123!', description: 'Mínimo 8 caracteres, una mayúscula, un número y un símbolo' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
    message: 'La contraseña debe incluir al menos una mayúscula, un número y un símbolo especial',
  })
  contrasena: string;

  @ApiPropertyOptional({ example: '+56912345678' })
  @IsOptional()
  @IsMobilePhone('es-CL', {}, { message: 'Número de teléfono no válido' })
  telefono?: string;

  @ApiPropertyOptional({ example: 'Operador de Maquinaria' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cargo?: string;

  @ApiPropertyOptional({ example: 'Producción' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string;
}
