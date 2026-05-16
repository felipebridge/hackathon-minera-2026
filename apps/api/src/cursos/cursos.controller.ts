import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CursosService } from './cursos.service';
import { CrearCursoDto } from './dto/crear-curso.dto';
import { ActualizarCursoDto } from './dto/actualizar-curso.dto';
import { ActualizarProgresoDto } from './dto/actualizar-progreso.dto';
import { GuardiaJwt } from '../autenticacion/guardias/jwt.guardia';
import { GuardiaRoles } from '../autenticacion/guardias/roles.guardia';
import { Roles } from '../autenticacion/decoradores/roles.decorador';
import { UsuarioActual } from '../comun/decoradores/usuario-actual.decorador';
import { RolUsuario } from '@prisma/client';

@ApiTags('cursos')
@Controller({ path: 'cursos', version: '1' })
@UseGuards(GuardiaJwt)
@ApiBearerAuth('jwt')
export class CursosController {
  constructor(private readonly cursosService: CursosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar cursos (filtrado por rol)' })
  async listar(@UsuarioActual() usuario: any) {
    const datos = await this.cursosService.listar(usuario.id, usuario.rol);
    return { exito: true, datos };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un curso con módulos' })
  async obtener(@Param('id') id: string, @UsuarioActual() usuario: any) {
    const datos = await this.cursosService.obtenerPorId(id, usuario.id, usuario.rol);
    return { exito: true, datos };
  }

  @Post()
  @Roles(RolUsuario.ADMIN, RolUsuario.INSTRUCTOR)
  @UseGuards(GuardiaRoles)
  @ApiOperation({ summary: 'Crear nuevo curso (Admin/Instructor)' })
  async crear(@Body() dto: CrearCursoDto) {
    const datos = await this.cursosService.crear(dto);
    return { exito: true, datos };
  }

  @Patch(':id')
  @Roles(RolUsuario.ADMIN, RolUsuario.INSTRUCTOR)
  @UseGuards(GuardiaRoles)
  @ApiOperation({ summary: 'Actualizar curso existente' })
  async actualizar(@Param('id') id: string, @Body() dto: ActualizarCursoDto) {
    const datos = await this.cursosService.actualizar(id, dto);
    return { exito: true, datos };
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  @UseGuards(GuardiaRoles)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar curso (solo Admin)' })
  async eliminar(@Param('id') id: string) {
    await this.cursosService.eliminar(id);
  }

  @Patch(':cursoId/modulos/:moduloId/progreso')
  @ApiOperation({ summary: 'Actualizar progreso en un módulo específico' })
  async actualizarProgreso(
    @Param('cursoId') cursoId: string,
    @Param('moduloId') moduloId: string,
    @Body() dto: ActualizarProgresoDto,
    @UsuarioActual('id') usuarioId: string,
  ) {
    return this.cursosService.actualizarProgreso(cursoId, moduloId, usuarioId, dto);
  }
}
