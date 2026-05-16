import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { GuardiaJwt } from '../autenticacion/guardias/jwt.guardia';
import { GuardiaRoles } from '../autenticacion/guardias/roles.guardia';
import { Roles } from '../autenticacion/decoradores/roles.decorador';
import { RolUsuario, EstadoUsuario } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class CambiarRolDto {
  @ApiProperty({ enum: RolUsuario })
  @IsEnum(RolUsuario)
  rol: RolUsuario;
}

class CambiarEstadoDto {
  @ApiProperty({ enum: EstadoUsuario })
  @IsEnum(EstadoUsuario)
  estado: EstadoUsuario;
}

class AsignarCursoDto {
  @ApiProperty()
  cursoId: string;
}

@ApiTags('usuarios')
@Controller({ path: 'usuarios', version: '1' })
@UseGuards(GuardiaJwt)
@ApiBearerAuth('jwt')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.INSTRUCTOR)
  @UseGuards(GuardiaRoles)
  @ApiOperation({ summary: 'Listar usuarios del sistema' })
  async listar(
    @Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
    @Query('limite', new DefaultValuePipe(20), ParseIntPipe) limite: number,
    @Query('busqueda') busqueda?: string,
  ) {
    const datos = await this.usuariosService.listar(pagina, limite, busqueda);
    return { exito: true, datos };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un usuario' })
  async obtener(@Param('id') id: string) {
    const datos = await this.usuariosService.obtenerPorId(id);
    return { exito: true, datos };
  }

  @Patch(':id/rol')
  @Roles(RolUsuario.ADMIN)
  @UseGuards(GuardiaRoles)
  @ApiOperation({ summary: 'Cambiar rol de un usuario (solo Admin)' })
  async cambiarRol(@Param('id') id: string, @Body() dto: CambiarRolDto) {
    const datos = await this.usuariosService.actualizarRol(id, dto.rol);
    return { exito: true, datos };
  }

  @Patch(':id/estado')
  @Roles(RolUsuario.ADMIN)
  @UseGuards(GuardiaRoles)
  @ApiOperation({ summary: 'Activar, desactivar o desbloquear cuenta' })
  async cambiarEstado(@Param('id') id: string, @Body() dto: CambiarEstadoDto) {
    const datos = await this.usuariosService.actualizarEstado(id, dto.estado);
    return { exito: true, datos };
  }

  @Post(':id/cursos')
  @Roles(RolUsuario.ADMIN, RolUsuario.INSTRUCTOR)
  @UseGuards(GuardiaRoles)
  @ApiOperation({ summary: 'Asignar curso a un usuario' })
  async asignarCurso(@Param('id') usuarioId: string, @Body() dto: AsignarCursoDto) {
    const datos = await this.usuariosService.asignarCurso(usuarioId, dto.cursoId);
    return { exito: true, datos };
  }
}
