import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { InduccionService } from './induccion.service';
import { GuardiaJwt } from '../autenticacion/guardias/jwt.guardia';
import { GuardiaRoles } from '../autenticacion/guardias/roles.guardia';
import { Roles } from '../autenticacion/decoradores/roles.decorador';
import { UsuarioActual } from '../comun/decoradores/usuario-actual.decorador';

@ApiTags('Inducción')
@ApiBearerAuth()
@UseGuards(GuardiaJwt, ThrottlerGuard)
@Controller({ path: 'induccion', version: '1' })
export class InduccionController {
  constructor(private readonly induccionService: InduccionService) {}

  @Get('mi-induccion')
  @ApiOperation({ summary: 'Obtener estado de inducción del empleado autenticado' })
  async obtenerMiInduccion(@UsuarioActual('id') usuarioId: string) {
    const datos = await this.induccionService.obtenerPorUsuario(usuarioId);
    return { exito: true, datos };
  }

  @Post('iniciar')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(GuardiaRoles)
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Iniciar proceso de inducción para un empleado' })
  async iniciarInduccion(
    @Body() dto: { usuarioId: string; instructorId?: string },
  ) {
    const datos = await this.induccionService.iniciar(dto.usuarioId, dto.instructorId);
    return { exito: true, datos };
  }

  @Put(':id/completar-charla')
  @UseGuards(GuardiaRoles)
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Registrar que la charla introductoria fue completada' })
  async completarCharla(@Param('id') id: string) {
    const datos = await this.induccionService.completarCharla(id);
    return { exito: true, datos };
  }

  @Put(':id/completar-vr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook desde Meta Quest: registrar VR completado' })
  async completarVR(
    @Param('id') id: string,
    @Body() dto: { puntaje: number; intentos?: number },
  ) {
    const datos = await this.induccionService.completarVR(id, dto.puntaje, dto.intentos ?? 1);
    return { exito: true, datos };
  }

  @Get('metricas')
  @UseGuards(GuardiaRoles)
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Métricas del embudo de inducción para el dashboard' })
  async obtenerMetricas() {
    const datos = await this.induccionService.calcularMetricas();
    return { exito: true, datos };
  }

  @Get('lista')
  @UseGuards(GuardiaRoles)
  @Roles('ADMIN', 'INSTRUCTOR')
  @ApiOperation({ summary: 'Listar todas las inducciones con estado' })
  async listar() {
    const datos = await this.induccionService.listarTodas();
    return { exito: true, datos };
  }
}
