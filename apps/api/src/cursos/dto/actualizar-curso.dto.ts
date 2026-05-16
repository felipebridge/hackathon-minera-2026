import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { EstadoCurso } from '@prisma/client';
import { CrearCursoDto } from './crear-curso.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ActualizarCursoDto extends PartialType(CrearCursoDto) {
  @ApiPropertyOptional({ enum: EstadoCurso })
  @IsOptional()
  @IsEnum(EstadoCurso)
  estado?: EstadoCurso;
}
