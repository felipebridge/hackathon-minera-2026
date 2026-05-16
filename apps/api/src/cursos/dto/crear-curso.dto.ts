import { IsString, IsEnum, IsNumber, IsOptional, IsArray, MinLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NivelCurso } from '@prisma/client';

export class CrearCursoDto {
  @ApiProperty({ example: 'Seguridad e Higiene Industrial en Minería' })
  @IsString()
  @MinLength(5)
  titulo: string;

  @ApiProperty({ example: 'Fundamentos esenciales de seguridad para operarios mineros.' })
  @IsString()
  @MinLength(20)
  descripcion: string;

  @ApiProperty({ example: 'Seguridad' })
  @IsString()
  categoria: string;

  @ApiProperty({ enum: NivelCurso, example: NivelCurso.BASICO })
  @IsEnum(NivelCurso)
  nivel: NivelCurso;

  @ApiProperty({ example: 8 })
  @IsNumber()
  @Min(0.5)
  duracionHoras: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requisitos?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objetivos?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  etiquetas?: string[];
}
