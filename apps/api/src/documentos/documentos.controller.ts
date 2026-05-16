import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DocumentosService } from './documentos.service';
import { GuardiaJwt } from '../autenticacion/guardias/jwt.guardia';
import { GuardiaRoles } from '../autenticacion/guardias/roles.guardia';
import { Roles } from '../autenticacion/decoradores/roles.decorador';
import { UsuarioActual } from '../comun/decoradores/usuario-actual.decorador';
import { RolUsuario } from '@prisma/client';

@ApiTags('documentos')
@Controller({ path: 'documentos', version: '1' })
@UseGuards(GuardiaJwt)
@ApiBearerAuth('jwt')
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  @Get()
  @Roles(RolUsuario.ADMIN, RolUsuario.INSTRUCTOR)
  @UseGuards(GuardiaRoles)
  @ApiOperation({ summary: 'Listar documentos de la base RAG' })
  async listar(
    @Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
    @Query('limite', new DefaultValuePipe(20), ParseIntPipe) limite: number,
  ) {
    const datos = await this.documentosService.listar(pagina, limite);
    return { exito: true, datos };
  }

  @Post('subir')
  @Roles(RolUsuario.ADMIN, RolUsuario.INSTRUCTOR)
  @UseGuards(GuardiaRoles)
  @UseInterceptors(FileInterceptor('archivo'))
  @ApiOperation({ summary: 'Subir documento PDF para la base RAG' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        archivo: { type: 'string', format: 'binary' },
        titulo: { type: 'string' },
        descripcion: { type: 'string' },
        categoria: { type: 'string' },
      },
    },
  })
  async subir(
    @UploadedFile() archivo: Express.Multer.File,
    @Body() datos: { titulo: string; descripcion?: string; categoria?: string },
    @UsuarioActual('id') usuarioId: string,
  ) {
    const documento = await this.documentosService.subir(archivo, datos, usuarioId);
    return { exito: true, datos: documento, mensaje: 'Documento subido, procesando embeddings en segundo plano...' };
  }

  @Post(':id/reprocesar')
  @Roles(RolUsuario.ADMIN)
  @UseGuards(GuardiaRoles)
  @ApiOperation({ summary: 'Reprocesar embeddings de un documento existente' })
  async reprocesar(@Param('id') id: string) {
    await this.documentosService.procesarDocumento(id);
    return { exito: true, mensaje: 'Documento reprocesado correctamente' };
  }

  @Delete(':id')
  @Roles(RolUsuario.ADMIN)
  @UseGuards(GuardiaRoles)
  @ApiOperation({ summary: 'Eliminar documento y sus embeddings' })
  async eliminar(@Param('id') id: string) {
    await this.documentosService.eliminar(id);
    return { exito: true, mensaje: 'Documento eliminado' };
  }
}
