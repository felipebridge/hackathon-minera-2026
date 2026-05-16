import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../comun/prisma/prisma.service';
import { CrearCursoDto } from './dto/crear-curso.dto';
import { ActualizarCursoDto } from './dto/actualizar-curso.dto';
import { ActualizarProgresoDto } from './dto/actualizar-progreso.dto';
import { RolUsuario, EstadoCurso } from '@prisma/client';

@Injectable()
export class CursosService {
  private readonly logger = new Logger(CursosService.name);

  constructor(private readonly prisma: PrismaService) {}

  async listar(usuarioId: string, rol: RolUsuario) {
    if (rol === RolUsuario.EMPLEADO) {
      return this.prisma.curso.findMany({
        where: {
          estado: EstadoCurso.ACTIVO,
          asignaciones: { some: { usuarioId } },
        },
        include: {
          modulos: { orderBy: { orden: 'asc' }, select: { id: true, titulo: true, orden: true, tipoContenido: true } },
          _count: { select: { modulos: true } },
          progresos: { where: { usuarioId, moduloId: null }, select: { porcentaje: true, completado: true } },
        },
        orderBy: { creadoEn: 'desc' },
      });
    }

    return this.prisma.curso.findMany({
      include: {
        modulos: { orderBy: { orden: 'asc' }, select: { id: true, titulo: true, orden: true, tipoContenido: true } },
        _count: { select: { modulos: true, asignaciones: true } },
      },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async obtenerPorId(id: string, usuarioId: string, rol: RolUsuario) {
    const curso = await this.prisma.curso.findUnique({
      where: { id },
      include: {
        modulos: {
          orderBy: { orden: 'asc' },
          include: { evaluaciones: { select: { id: true, titulo: true, puntajeAprobacion: true } } },
        },
        _count: { select: { asignaciones: true, certificaciones: true } },
      },
    });

    if (!curso) throw new NotFoundException('Curso no encontrado');

    if (rol === RolUsuario.EMPLEADO) {
      const asignado = await this.prisma.cursoAsignado.findUnique({
        where: { usuarioId_cursoId: { usuarioId, cursoId: id } },
      });
      if (!asignado) throw new ForbiddenException('No tienes acceso a este curso');
    }

    const progreso = await this.prisma.progreso.findFirst({
      where: { usuarioId, cursoId: id, moduloId: null },
    });

    return { ...curso, progresoActual: progreso };
  }

  async crear(dto: CrearCursoDto) {
    return this.prisma.curso.create({ data: dto });
  }

  async actualizar(id: string, dto: ActualizarCursoDto) {
    await this.verificarExistencia(id);
    return this.prisma.curso.update({ where: { id }, data: dto });
  }

  async eliminar(id: string) {
    await this.verificarExistencia(id);
    return this.prisma.curso.delete({ where: { id } });
  }

  async actualizarProgreso(
    cursoId: string,
    moduloId: string,
    usuarioId: string,
    dto: ActualizarProgresoDto,
  ) {
    const modulo = await this.prisma.modulo.findFirst({
      where: { id: moduloId, cursoId },
    });

    if (!modulo) throw new NotFoundException('Módulo no encontrado en este curso');

    await this.prisma.progreso.upsert({
      where: { usuarioId_cursoId_moduloId: { usuarioId, cursoId, moduloId } },
      update: {
        porcentaje: dto.porcentaje,
        completado: dto.completado,
        tiempoSegundos: { increment: dto.tiempoAdicionalSegundos ?? 0 },
        ultimaActividad: new Date(),
      },
      create: {
        usuarioId,
        cursoId,
        moduloId,
        porcentaje: dto.porcentaje,
        completado: dto.completado,
        tiempoSegundos: dto.tiempoAdicionalSegundos ?? 0,
      },
    });

    await this.recalcularProgresoCurso(cursoId, usuarioId);

    return { exito: true };
  }

  private async recalcularProgresoCurso(cursoId: string, usuarioId: string): Promise<void> {
    const modulos = await this.prisma.modulo.findMany({
      where: { cursoId, obligatorio: true },
      select: { id: true },
    });

    const totalObligatorios = modulos.length;
    if (totalObligatorios === 0) return;

    const completados = await this.prisma.progreso.count({
      where: {
        usuarioId,
        cursoId,
        moduloId: { in: modulos.map((m) => m.id) },
        completado: true,
      },
    });

    const porcentajeTotal = Math.round((completados / totalObligatorios) * 100);
    const cursoCompleto = porcentajeTotal === 100;

    const progresoExistente = await this.prisma.progreso.findFirst({
      where: { usuarioId, cursoId, moduloId: null },
    });
    if (progresoExistente) {
      await this.prisma.progreso.update({
        where: { id: progresoExistente.id },
        data: { porcentaje: porcentajeTotal, completado: cursoCompleto, ultimaActividad: new Date() },
      });
    } else {
      await this.prisma.progreso.create({
        data: { usuarioId, cursoId, porcentaje: porcentajeTotal, completado: cursoCompleto },
      });
    }

    if (cursoCompleto) {
      await this.emitirCertificacion(cursoId, usuarioId).catch((err) => {
        this.logger.warn(`No se pudo emitir certificación automáticamente: ${err.message}`);
      });
    }
  }

  private async emitirCertificacion(cursoId: string, usuarioId: string): Promise<void> {
    const yaExiste = await this.prisma.certificacion.findUnique({
      where: { usuarioId_cursoId: { usuarioId, cursoId } },
    });

    if (yaExiste) return;

    const resultados = await this.prisma.resultadoEvaluacion.findMany({
      where: {
        usuarioId,
        evaluacion: { modulo: { cursoId } },
      },
      orderBy: { puntaje: 'desc' },
    });

    const puntajeFinal = resultados.length
      ? resultados.reduce((acc, r) => acc + r.puntaje, 0) / resultados.length
      : 0;

    const codigoUnico = `CERT-${Date.now()}-${usuarioId.slice(-6).toUpperCase()}`;

    await this.prisma.certificacion.create({
      data: {
        usuarioId,
        cursoId,
        codigoUnico,
        puntajeFinal,
        validoHasta: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    this.logger.log(`Certificación emitida: ${codigoUnico} para usuario ${usuarioId}`);
  }

  private async verificarExistencia(id: string): Promise<void> {
    const existe = await this.prisma.curso.findUnique({ where: { id }, select: { id: true } });
    if (!existe) throw new NotFoundException('Curso no encontrado');
  }
}
