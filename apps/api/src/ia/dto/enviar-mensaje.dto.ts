import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EnviarMensajeDto {
  @ApiProperty({ example: '¿Cuáles son los pasos para la inspección pre-operacional de un camión 793?' })
  @IsString()
  @IsNotEmpty({ message: 'El mensaje no puede estar vacío' })
  @MaxLength(2000, { message: 'El mensaje no puede superar los 2000 caracteres' })
  mensaje: string;

  @ApiPropertyOptional({ description: 'ID de sesión existente para continuar conversación' })
  @IsOptional()
  @IsString()
  sesionId?: string;
}
