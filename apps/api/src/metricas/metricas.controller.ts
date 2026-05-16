import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MetricasService } from './metricas.service';
import { GuardiaJwt } from '../autenticacion/guardias/jwt.guardia';
import { GuardiaRoles } from '../autenticacion/guardias/roles.guardia';
import { Roles } from '../autenticacion/decoradores/roles.decorador';
import { UsuarioActual } from '../comun/decoradores/usuario-actual.decorador';
import { RolUsuario } from '@prisma/client';

@ApiTags('metricas')
@Controller({ path: 'metricas', version: '1' })
@UseGuards(GuardiaJwt)
@ApiBearerAuth('jwt')
export class MetricasController {
  constructor(private readonly metricasService: MetricasService) {}

  @Get('dashboard')
  @Roles(RolUsuario.ADMIN, RolUsuario.INSTRUCTOR)
  @UseGuards(GuardiaRoles)
  @ApiOperation({ summary: 'KPIs y métricas generales del sistema (Admin/Instructor)' })
  async dashboard() {
    const datos = await this.metricasService.obtenerDashboard();
    return { exito: true, datos };
  }

  @Get('usuario/mi-progreso')
  @ApiOperation({ summary: 'Métricas de aprendizaje del usuario autenticado' })
  async miProgreso(@UsuarioActual('id') usuarioId: string) {
    const datos = await this.metricasService.obtenerMetricasUsuario(usuarioId);
    return { exito: true, datos };
  }

  @Get('usuario/:usuarioId')
  @Roles(RolUsuario.ADMIN, RolUsuario.INSTRUCTOR)
  @UseGuards(GuardiaRoles)
  @ApiOperation({ summary: 'Métricas de un usuario específico (Admin/Instructor)' })
  async metricasUsuario(@Param('usuarioId') usuarioId: string) {
    const datos = await this.metricasService.obtenerMetricasUsuario(usuarioId);
    return { exito: true, datos };
  }
}
