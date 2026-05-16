import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IAService } from './ia.service';
import { EnviarMensajeDto } from './dto/enviar-mensaje.dto';
import { GuardiaJwt } from '../autenticacion/guardias/jwt.guardia';
import { UsuarioActual } from '../comun/decoradores/usuario-actual.decorador';

@ApiTags('ia')
@Controller({ path: 'ia', version: '1' })
export class IAController {
  constructor(private readonly iaService: IAService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Enviar mensaje al asistente IA con RAG' })
  @Throttle({ corto: { limit: 10, ttl: 60000 } })
  @UseGuards(GuardiaJwt)
  @ApiBearerAuth('jwt')
  async chat(
    @Body() dto: EnviarMensajeDto,
    @UsuarioActual('id') usuarioId: string,
  ) {
    const resultado = await this.iaService.enviarMensaje(dto, usuarioId);
    return { exito: true, datos: resultado };
  }

  @Get('historial/:sesionId')
  @UseGuards(GuardiaJwt)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Obtener historial de una sesión de chat' })
  async historial(
    @Param('sesionId') sesionId: string,
    @UsuarioActual('id') usuarioId: string,
  ) {
    const datos = await this.iaService.obtenerHistorial(sesionId, usuarioId);
    return { exito: true, datos };
  }

  @Get('sesiones')
  @UseGuards(GuardiaJwt)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Listar sesiones de chat del usuario autenticado' })
  async sesiones(@UsuarioActual('id') usuarioId: string) {
    const datos = await this.iaService.obtenerSesiones(usuarioId);
    return { exito: true, datos };
  }
}
