import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../comun/prisma/prisma.service';
import { EtapaInduccion, EstadoInduccion } from '@prisma/client';

@Injectable()
export class InduccionService {
  private readonly logger = new Logger(InduccionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async obtenerPorUsuario(usuarioId: string) {
    return this.prisma.induccionEmpleado.findUnique({
      where: { usuarioId },
      include: {
        instructor: { select: { nombre: true, apellido: true, cargo: true } },
      },
    });
  }

  async iniciar(usuarioId: string, instructorId?: string) {
    const existente = await this.prisma.induccionEmpleado.findUnique({
      where: { usuarioId },
    });

    if (existente) {
      throw new ConflictException('El empleado ya tiene una inducción registrada');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, nombre: true, apellido: true },
    });

    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const induccion = await this.prisma.induccionEmpleado.create({
      data: {
        usuarioId,
        instructorId: instructorId ?? null,
        estado: EstadoInduccion.EN_CURSO,
        etapaActual: EtapaInduccion.CHARLA_INTRODUCTORIA,
      },
      include: {
        instructor: { select: { nombre: true, apellido: true } },
      },
    });

    this.logger.log(`Inducción iniciada para usuario ${usuarioId}`);
    return induccion;
  }

  async completarCharla(induccionId: string) {
    const induccion = await this.prisma.induccionEmpleado.findUnique({
      where: { id: induccionId },
    });

    if (!induccion) throw new NotFoundException('Inducción no encontrada');

    return this.prisma.induccionEmpleado.update({
      where: { id: induccionId },
      data: {
        charlaCompletada: true,
        charlaCompletadaEn: new Date(),
        etapaActual: EtapaInduccion.SIMULACION_VR,
      },
    });
  }

  async completarVR(induccionId: string, puntaje: number, intentos: number) {
    const induccion = await this.prisma.induccionEmpleado.findUnique({
      where: { id: induccionId },
    });

    if (!induccion) throw new NotFoundException('Inducción no encontrada');

    const aprobado = puntaje >= 70;

    const updated = await this.prisma.induccionEmpleado.update({
      where: { id: induccionId },
      data: {
        vrCompletado: aprobado,
        vrCompletadoEn: aprobado ? new Date() : undefined,
        vrPuntaje: puntaje,
        vrIntentos: intentos,
        estado: aprobado ? EstadoInduccion.EN_CURSO : EstadoInduccion.REPROBADA,
        etapaActual: aprobado ? EtapaInduccion.EXAMEN_OBLIGATORIO : undefined,
      },
    });

    if (!aprobado) {
      this.logger.warn(
        `VR REPROBADA — induccionId=${induccionId} puntaje=${puntaje}% (mínimo 70%)`,
      );
    }

    return updated;
  }

  async registrarExamenAprobado(usuarioId: string, puntaje: number, intentos: number, maxIntentos = 3) {
    const induccion = await this.prisma.induccionEmpleado.findUnique({
      where: { usuarioId },
    });

    if (!induccion) return;

    const aprobado = puntaje >= 70;
    const agotoIntentos = !aprobado && intentos >= maxIntentos;
    const ahora = new Date();

    const tiempoTotalHoras = aprobado
      ? (ahora.getTime() - induccion.iniciadaEn.getTime()) / (1000 * 60 * 60)
      : undefined;

    await this.prisma.induccionEmpleado.update({
      where: { usuarioId },
      data: {
        examenAprobado: aprobado,
        examenAprobadoEn: aprobado ? ahora : undefined,
        examenPuntaje: puntaje,
        examenIntentos: intentos,
        ...(aprobado && {
          estado: EstadoInduccion.COMPLETADA,
          etapaActual: EtapaInduccion.EXPERTO_IA,
          completadaEn: ahora,
          tiempoTotalHoras,
        }),
        ...(agotoIntentos && {
          estado: EstadoInduccion.REPROBADA,
        }),
      },
    });

    if (aprobado) {
      this.logger.log(
        `Inducción COMPLETADA — usuario=${usuarioId} tiempo=${tiempoTotalHoras?.toFixed(1)}h`,
      );
    } else if (agotoIntentos) {
      this.logger.warn(
        `Examen REPROBADO (intentos agotados) — usuario=${usuarioId} puntaje=${puntaje}% intentos=${intentos}`,
      );
    } else {
      this.logger.log(`Examen fallido (intento ${intentos}/${maxIntentos}) — usuario=${usuarioId}`);
    }
  }

  async calcularMetricas() {
    const [enCurso, charlaCompletada, vrCompletados, examenesAprobados, completadas, todas] =
      await Promise.all([
        this.prisma.induccionEmpleado.count({ where: { estado: 'EN_CURSO' } }),
        this.prisma.induccionEmpleado.count({ where: { charlaCompletada: true } }),
        this.prisma.induccionEmpleado.count({ where: { vrCompletado: true } }),
        this.prisma.induccionEmpleado.count({ where: { examenAprobado: true } }),
        this.prisma.induccionEmpleado.count({ where: { estado: 'COMPLETADA' } }),
        this.prisma.induccionEmpleado.count(),
      ]);

    const completadasConTiempo = await this.prisma.induccionEmpleado.findMany({
      where: { estado: 'COMPLETADA', tiempoTotalHoras: { not: null } },
      select: { tiempoTotalHoras: true },
    });

    const tiempoPromedio =
      completadasConTiempo.length > 0
        ? completadasConTiempo.reduce((s, i) => s + (i.tiempoTotalHoras ?? 0), 0) /
          completadasConTiempo.length
        : 4.5;

    const tasaAprobacion =
      todas > 0 ? Math.round((completadas / todas) * 100) : 0;

    return {
      enCurso,
      charlaCompletada,
      vrCompletados,
      examenesAprobados,
      completadas,
      total: todas,
      tiempoPromedioHoras: Math.round(tiempoPromedio * 10) / 10,
      tasaAprobacion,
    };
  }

  async listarTodas() {
    return this.prisma.induccionEmpleado.findMany({
      include: {
        usuario: { select: { nombre: true, apellido: true, email: true, cargo: true, area: true } },
        instructor: { select: { nombre: true, apellido: true } },
      },
      orderBy: { iniciadaEn: 'desc' },
    });
  }
}
