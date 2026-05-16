import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../comun/prisma/prisma.service';
import { InduccionService } from '../induccion/induccion.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MetricasService {
  private readonly logger = new Logger(MetricasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly induccion: InduccionService,
  ) {}

  async obtenerDashboard() {
    const [
      totalUsuarios,
      usuariosActivos,
      totalCursos,
      totalDocumentos,
      evaluacionesUltimos30Dias,
      progresoPromedio,
      cursosCompletados,
      preguntasIA,
    ] = await Promise.all([
      this.prisma.usuario.count(),
      this.prisma.usuario.count({ where: { estado: 'ACTIVO' } }),
      this.prisma.curso.count({ where: { estado: 'ACTIVO' } }),
      this.prisma.documento.count({ where: { estado: 'LISTO' } }),
      this.prisma.resultadoEvaluacion.count({
        where: { completadoEn: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),
      this.calcularProgresoPromedio(),
      this.prisma.progreso.count({ where: { completado: true, moduloId: null } }),
      this.prisma.mensajeChat.count({ where: { rol: 'USUARIO' } }),
    ]);

    const accidentesPrevenidosEstimados = Math.round(
      (progresoPromedio / 100) * cursosCompletados * 0.15,
    );

    const metricasInduccion = await this.induccion.calcularMetricas();

    return {
      kpis: {
        totalUsuarios,
        usuariosActivos,
        totalCursos,
        totalDocumentos,
        evaluacionesUltimos30Dias,
        progresoPromedio: Math.round(progresoPromedio),
        cursosCompletados,
        preguntasIA,
        accidentesPrevenidosEstimados,
      },
      induccion: metricasInduccion,
      tendencias: await this.obtenerTendencias(),
      tendenciasInduccion: await this.obtenerTendenciasInduccion(),
      erroresFrecuentes: await this.obtenerErroresFrecuentes(),
      cursosPopulares: await this.obtenerCursosPopulares(),
      actividadReciente: await this.obtenerActividadReciente(),
    };
  }

  private async obtenerTendenciasInduccion() {
    const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const datos = await this.prisma.$queryRaw<
      { fecha: string; iniciadas: bigint; completadas: bigint; vr_completados: bigint }[]
    >`
      SELECT
        DATE_TRUNC('day', iniciada_en)::date AS fecha,
        COUNT(*) AS iniciadas,
        COUNT(*) FILTER (WHERE estado = 'COMPLETADA') AS completadas,
        COUNT(*) FILTER (WHERE vr_completado = true) AS vr_completados
      FROM inducciones_empleados
      WHERE iniciada_en >= ${hace7Dias}
      GROUP BY DATE_TRUNC('day', iniciada_en)::date
      ORDER BY fecha ASC
    `;

    return datos.map((d) => ({
      fecha: d.fecha,
      iniciadas: Number(d.iniciadas),
      completadas: Number(d.completadas),
      vrCompletados: Number(d.vr_completados),
    }));
  }

  private async calcularProgresoPromedio(): Promise<number> {
    const resultado = await this.prisma.progreso.aggregate({
      _avg: { porcentaje: true },
      where: { moduloId: null },
    });
    return resultado._avg.porcentaje ?? 0;
  }

  private async obtenerTendencias() {
    const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const evaluacionesPorDia = await this.prisma.$queryRaw<
      { fecha: string; total: number; aprobadas: number }[]
    >`
      SELECT
        DATE_TRUNC('day', completado_en)::date AS fecha,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE aprobado = true) AS aprobadas
      FROM resultados_evaluaciones
      WHERE completado_en >= ${hace30Dias}
      GROUP BY DATE_TRUNC('day', completado_en)::date
      ORDER BY fecha ASC
    `;

    return evaluacionesPorDia.map((e) => ({
      fecha: e.fecha,
      total: Number(e.total),
      aprobadas: Number(e.aprobadas),
      tasaAprobacion: Number(e.total) > 0 ? Math.round((Number(e.aprobadas) / Number(e.total)) * 100) : 0,
    }));
  }

  private async obtenerErroresFrecuentes() {
    const errores = await this.prisma.errorFrecuente.findMany({
      orderBy: { frecuencia: 'desc' },
      take: 10,
    });

    return errores.map((e) => ({
      categoria: e.categoria,
      totalErrores: e.frecuencia,
      descripcion: e.descripcion,
      ultimaVez: e.ultimaVez,
    }));
  }

  private async obtenerCursosPopulares() {
    return this.prisma.curso.findMany({
      take: 5,
      orderBy: { asignaciones: { _count: 'desc' } },
      include: {
        _count: { select: { asignaciones: true, certificaciones: true } },
      },
      where: { estado: 'ACTIVO' },
    });
  }

  private async obtenerActividadReciente() {
    const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return this.prisma.resultadoEvaluacion.findMany({
      take: 10,
      where: { completadoEn: { gte: hace7Dias } },
      orderBy: { completadoEn: 'desc' },
      include: {
        usuario: { select: { nombre: true, apellido: true, area: true } },
        evaluacion: { select: { titulo: true } },
      },
    });
  }

  async obtenerMetricasUsuario(usuarioId: string) {
    const [progresoCursos, resultadosEvaluaciones, certificaciones] = await Promise.all([
      this.prisma.progreso.findMany({
        where: { usuarioId, moduloId: null },
        include: { curso: { select: { titulo: true, categoria: true } } },
      }),
      this.prisma.resultadoEvaluacion.findMany({
        where: { usuarioId },
        orderBy: { completadoEn: 'desc' },
        include: { evaluacion: { select: { titulo: true } } },
      }),
      this.prisma.certificacion.findMany({
        where: { usuarioId },
        include: { curso: { select: { titulo: true } } },
      }),
    ]);

    const curvaPorSemana = this.calcularCurvaAprendizaje(resultadosEvaluaciones);

    return {
      progresoCursos,
      resultadosEvaluaciones,
      certificaciones,
      curvaPorSemana,
      resumen: {
        cursosEnProgreso: progresoCursos.filter((p) => !p.completado).length,
        cursosCompletados: progresoCursos.filter((p) => p.completado).length,
        evaluacionesAprobadas: resultadosEvaluaciones.filter((r) => r.aprobado).length,
        puntajePromedio:
          resultadosEvaluaciones.length > 0
            ? resultadosEvaluaciones.reduce((acc, r) => acc + r.puntaje, 0) / resultadosEvaluaciones.length
            : 0,
        totalCertificaciones: certificaciones.length,
      },
    };
  }

  private calcularCurvaAprendizaje(resultados: any[]) {
    const porSemana = new Map<string, number[]>();

    for (const r of resultados) {
      const semana = this.inicioSemana(new Date(r.completadoEn)).toISOString().slice(0, 10);
      if (!porSemana.has(semana)) porSemana.set(semana, []);
      porSemana.get(semana)!.push(r.puntaje);
    }

    return Array.from(porSemana.entries())
      .map(([semana, puntajes]) => ({
        semana,
        promedio: puntajes.reduce((a, b) => a + b, 0) / puntajes.length,
        cantidad: puntajes.length,
      }))
      .sort((a, b) => a.semana.localeCompare(b.semana));
  }

  private inicioSemana(fecha: Date): Date {
    const d = new Date(fecha);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async precalcularMetricasDiarias(): Promise<void> {
    this.logger.log('Iniciando precálculo de métricas diarias...');
    try {
      await this.limpiarTokensVencidos();
      this.logger.log('Precálculo de métricas completado');
    } catch (err) {
      this.logger.error(`Error en precálculo de métricas: ${err.message}`);
    }
  }

  private async limpiarTokensVencidos(): Promise<void> {
    const eliminados = await this.prisma.tokenRefresh.deleteMany({
      where: { OR: [{ expiraEn: { lt: new Date() } }, { revocado: true }] },
    });
    this.logger.debug(`Tokens expirados eliminados: ${eliminados.count}`);
  }
}
