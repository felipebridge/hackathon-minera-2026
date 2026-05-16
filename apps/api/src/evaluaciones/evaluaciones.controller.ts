import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EvaluacionesService } from './evaluaciones.service';
import { GuardiaJwt } from '../autenticacion/guardias/jwt.guardia';
import { UsuarioActual } from '../comun/decoradores/usuario-actual.decorador';
import { IsArray, IsNumber, IsString, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class RespuestaDto {
  @ApiProperty()
  @IsString()
  preguntaId: string;

  @ApiProperty()
  @IsString()
  respuestaUsuario: string;
}

class EnviarEvaluacionDto {
  @ApiProperty({ type: [RespuestaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RespuestaDto)
  respuestas: RespuestaDto[];

  @ApiProperty()
  @IsNumber()
  @Min(0)
  tiempoSegundos: number;
}

@ApiTags('evaluaciones')
@Controller({ path: 'evaluaciones', version: '1' })
@UseGuards(GuardiaJwt)
@ApiBearerAuth('jwt')
export class EvaluacionesController {
  constructor(private readonly evaluacionesService: EvaluacionesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Obtener preguntas de una evaluación' })
  async obtener(@Param('id') id: string, @UsuarioActual('id') usuarioId: string) {
    const datos = await this.evaluacionesService.obtener(id, usuarioId);
    return { exito: true, datos };
  }

  @Post(':id/enviar')
  @ApiOperation({ summary: 'Enviar respuestas y obtener resultado inmediato' })
  async enviar(
    @Param('id') id: string,
    @Body() dto: EnviarEvaluacionDto,
    @UsuarioActual('id') usuarioId: string,
  ) {
    const datos = await this.evaluacionesService.enviarRespuestas(
      id,
      dto.respuestas,
      dto.tiempoSegundos,
      usuarioId,
    );
    return { exito: true, datos };
  }
}
