import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../comun/prisma/prisma.service';
import { InduccionService } from '../induccion/induccion.service';

interface RespuestaEnvio {
  preguntaId: string;
  respuestaUsuario: string;
}

@Injectable()
export class EvaluacionesService {
  private readonly logger = new Logger(EvaluacionesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly induccion: InduccionService,
  ) {}

  async obtener(evaluacionId: string, usuarioId: string) {
    const evaluacion = await this.prisma.evaluacion.findUnique({
      where: { id: evaluacionId },
      include: {
        preguntas: {
          orderBy: { orden: 'asc' },
          select: {
            id: true,
            texto: true,
            tipo: true,
            opciones: true,
            puntaje: true,
            orden: true,
          },
        },
      },
    });

    if (!evaluacion) throw new NotFoundException('Evaluación no encontrada');

    const intentos = await this.prisma.resultadoEvaluacion.count({
      where: { usuarioId, evaluacionId },
    });

    if (intentos >= evaluacion.intentosPermitidos) {
      throw new BadRequestException(
        `Alcanzaste el límite de ${evaluacion.intentosPermitidos} intentos para esta evaluación`,
      );
    }

    if (evaluacion.aleatorizar) {
      evaluacion.preguntas.sort(() => Math.random() - 0.5);
    }

    return { ...evaluacion, intentosUtilizados: intentos };
  }

  async enviarRespuestas(
    evaluacionId: string,
    respuestas: RespuestaEnvio[],
    tiempoSegundos: number,
    usuarioId: string,
  ) {
    const evaluacion = await this.prisma.evaluacion.findUnique({
      where: { id: evaluacionId },
      include: { preguntas: true },
    });

    if (!evaluacion) throw new NotFoundException('Evaluación no encontrada');

    let puntajeTotalObtenido = 0;
    let puntajeMaximo = 0;
    const respuestasDetalladas = [];

    for (const pregunta of evaluacion.preguntas) {
      puntajeMaximo += pregunta.puntaje;
      const respuestaUsuario = respuestas.find((r) => r.preguntaId === pregunta.id);

      if (!respuestaUsuario) continue;

      const esCorrecta = this.evaluarRespuesta(pregunta, respuestaUsuario.respuestaUsuario);
      if (esCorrecta) puntajeTotalObtenido += pregunta.puntaje;

      respuestasDetalladas.push({
        preguntaId: pregunta.id,
        respuestaUsuario: respuestaUsuario.respuestaUsuario,
        esCorrecta,
        puntajeObtenido: esCorrecta ? pregunta.puntaje : 0,
        respuestaCorrecta: esCorrecta ? null : pregunta.respuestaCorrecta,
        explicacion: pregunta.explicacion,
        categoriaError: esCorrecta ? null : pregunta.categoriaError,
      });
    }

    const porcentajeObtenido = puntajeMaximo > 0
      ? (puntajeTotalObtenido / puntajeMaximo) * 100
      : 0;

    const aprobado = porcentajeObtenido >= evaluacion.puntajeAprobacion;

    const intentoNumero = await this.prisma.resultadoEvaluacion.count({
      where: { usuarioId, evaluacionId },
    }) + 1;

    const resultado = await this.prisma.resultadoEvaluacion.create({
      data: {
        usuarioId,
        evaluacionId,
        puntaje: porcentajeObtenido,
        aprobado,
        respuestas: respuestasDetalladas as any,
        tiempoSegundos,
        intento: intentoNumero,
      },
    });

    const categoriasError = respuestasDetalladas
      .filter((r) => !r.esCorrecta && r.categoriaError)
      .map((r) => r.categoriaError as string);

    for (const categoria of categoriasError) {
      await this.prisma.errorFrecuente.upsert({
        where: { id: `error-${categoria}` },
        update: { frecuencia: { increment: 1 }, ultimaVez: new Date() },
        create: {
          id: `error-${categoria}`,
          categoria,
          descripcion: `Errores en categoría: ${categoria}`,
          frecuencia: 1,
        },
      }).catch(() => null);
    }

    await this.induccion
      .registrarExamenAprobado(usuarioId, porcentajeObtenido, intentoNumero, evaluacion.intentosPermitidos)
      .catch((err) => this.logger.warn(`No se pudo actualizar inducción: ${err.message}`));

    return {
      resultado: {
        ...resultado,
        puntajeObtenido: puntajeTotalObtenido,
        puntajeMaximo,
        porcentaje: porcentajeObtenido,
      },
      respuestasDetalladas: respuestasDetalladas.filter((r) => !r.esCorrecta),
      recomendaciones: this.generarRecomendaciones(respuestasDetalladas),
    };
  }

  private evaluarRespuesta(pregunta: any, respuestaUsuario: string): boolean {
    if (!respuestaUsuario) return false;

    if (pregunta.tipo === 'VERDADERO_FALSO' || pregunta.tipo === 'OPCION_MULTIPLE' || pregunta.tipo === 'SITUACIONAL') {
      const opciones = pregunta.opciones as { texto: string; esCorrecta: boolean }[];
      const opcionSeleccionada = opciones.find(
        (o) => o.texto.toLowerCase() === respuestaUsuario.toLowerCase(),
      );
      return opcionSeleccionada?.esCorrecta ?? false;
    }

    if (pregunta.tipo === 'RESPUESTA_CORTA') {
      return pregunta.respuestaCorrecta?.toLowerCase().trim() ===
             respuestaUsuario.toLowerCase().trim();
    }

    return false;
  }

  private generarRecomendaciones(respuestas: any[]): string[] {
    const recomendaciones: string[] = [];
    const categoriasFallidas = [...new Set(
      respuestas.filter((r) => !r.esCorrecta).map((r) => r.categoriaError).filter(Boolean),
    )];

    for (const categoria of categoriasFallidas) {
      switch (categoria) {
        case 'normativa':
          recomendaciones.push('Repasa el módulo sobre el Decreto 249/07 y reglamentación minera argentina');
          break;
        case 'gases_toxicos':
          recomendaciones.push('Revisa el protocolo de identificación y respuesta a gases tóxicos');
          break;
        case 'jerarquia_controles':
          recomendaciones.push('Refuerza el concepto de jerarquía de controles y uso de EPP');
          break;
        case 'inspeccion_equipos':
          recomendaciones.push('Practica el checklist de inspección pre-operacional de equipos');
          break;
        default:
          recomendaciones.push(`Refuerza tus conocimientos en: ${categoria}`);
      }
    }

    return recomendaciones;
  }
}
