import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AutenticacionService } from './autenticacion.service';
import { IniciarSesionDto } from './dto/iniciar-sesion.dto';
import { RegistroDto } from './dto/registro.dto';
import { RenovarTokenDto } from './dto/renovar-token.dto';
import { GuardiaJwt } from './guardias/jwt.guardia';
import { UsuarioActual } from '../comun/decoradores/usuario-actual.decorador';

@ApiTags('autenticacion')
@Controller({ path: 'autenticacion', version: '1' })
export class AutenticacionController {
  constructor(private readonly autenticacionService: AutenticacionService) {}

  @Post('iniciar-sesion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión y obtener tokens JWT' })
  @Throttle({ corto: { limit: 5, ttl: 60000 } })
  async iniciarSesion(@Body() dto: IniciarSesionDto) {
    return this.autenticacionService.iniciarSesion(dto);
  }

  @Post('registro')
  @ApiOperation({ summary: 'Registrar nuevo usuario (rol: EMPLEADO por defecto)' })
  @Throttle({ corto: { limit: 3, ttl: 60000 } })
  async registro(@Body() dto: RegistroDto) {
    return this.autenticacionService.registro(dto);
  }

  @Post('renovar-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  async renovarToken(@Body() dto: RenovarTokenDto) {
    return this.autenticacionService.renovarToken(dto.refreshToken);
  }

  @Post('cerrar-sesion')
  @HttpCode(HttpStatus.OK)
  @UseGuards(GuardiaJwt)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Cerrar sesión y revocar tokens' })
  async cerrarSesion(
    @UsuarioActual() usuario: { id: string },
    @Body() body: { refreshToken: string },
  ) {
    await this.autenticacionService.cerrarSesion(usuario.id, body.refreshToken);
    return { exito: true, mensaje: 'Sesión cerrada correctamente' };
  }

  @Get('perfil')
  @UseGuards(GuardiaJwt)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  perfil(@UsuarioActual() usuario: any) {
    return { exito: true, datos: usuario };
  }
}
