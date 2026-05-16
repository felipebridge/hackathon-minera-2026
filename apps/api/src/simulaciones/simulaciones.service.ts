import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../comun/prisma/prisma.service';
import { InduccionService } from '../induccion/induccion.service';

@Injectable()
export class SimulacionesService {
  private readonly logger = new Logger(SimulacionesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly induccion: InduccionService,
  ) {}

  async listar() {
    return this.prisma.simulacion.findMany({
      orderBy: { creadoEn: 'desc' },
    });
  }

  async obtenerPorId(id: string) {
    const sim = await this.prisma.simulacion.findUnique({ where: { id } });
    if (!sim) throw new NotFoundException('Simulación no encontrada');
    return sim;
  }

  async procesarWebhookCompletado(payload: {
    induccionId: string;
    puntaje: number;
    intentos: number;
    sesionVR?: string;
    duracionSegundos?: number;
  }) {
    const { induccionId, puntaje, intentos = 1 } = payload;

    this.logger.log(
      `VR webhook recibido — induccionId=${induccionId} puntaje=${puntaje}% intentos=${intentos}`,
    );

    const induccion = await this.prisma.induccionEmpleado.findUnique({
      where: { id: induccionId },
    });

    if (!induccion) {
      throw new NotFoundException(`Inducción ${induccionId} no encontrada`);
    }

    const resultado = await this.induccion.completarVR(induccionId, puntaje, intentos);

    return {
      induccionId,
      puntaje,
      aprobado: puntaje >= 70,
      estado: resultado.estado,
      etapaActual: resultado.etapaActual,
    };
  }

  async generarManifestoVR(id: string) {
    const simulacion = await this.obtenerPorId(id);

    return {
      version: '1.0',
      escenario: simulacion.escenario,
      objetivos: simulacion.objetivosVR,
      duracionSegundos: simulacion.duracionMinutos * 60,
      nivel: simulacion.nivel,
      metaQuestConfig: {
        appId: simulacion.metaQuestAppId,
        sdkVersion: '65.0',
        handTracking: true,
        espacioFisico: 'STATIONARY',
      },
      callbacks: {
        alCompletar: '/api/v1/simulaciones/webhook/completado',
        alError: '/api/v1/simulaciones/webhook/error',
      },
    };
  }
}
