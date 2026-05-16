import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../comun/prisma/prisma.service';
import { RedisService } from '../comun/redis/redis.service';
import { RagService, MensajeChat } from './rag/rag.service';
import { EnviarMensajeDto } from './dto/enviar-mensaje.dto';
import { CanalChat } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IAService {
  private readonly logger = new Logger(IAService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rag: RagService,
  ) {}

  async enviarMensaje(dto: EnviarMensajeDto, usuarioId?: string): Promise<{
    respuesta: string;
    sesionId: string;
    fuentes: { documentoTitulo: string; similitud: number }[];
    escaladoHumano: boolean;
  }> {
    let sesion = dto.sesionId
      ? await this.prisma.sesionChat.findUnique({ where: { id: dto.sesionId } })
      : null;

    if (!sesion) {
      sesion = await this.prisma.sesionChat.create({
        data: {
          id: uuidv4(),
          usuarioId: usuarioId ?? null,
          canal: CanalChat.WEB,
        },
      });
    }

    await this.prisma.mensajeChat.create({
      data: {
        sesionId: sesion.id,
        rol: 'USUARIO',
        contenido: dto.mensaje,
      },
    });

    let historial = await this.redis.obtenerContextoChat(sesion.id);

    if (!historial) {
      const mensajesBD = await this.prisma.mensajeChat.findMany({
        where: { sesionId: sesion.id },
        orderBy: { creadoEn: 'asc' },
        take: 20,
      });

      historial = mensajesBD.map((m) => ({
        rol: m.rol.toLowerCase() as 'usuario' | 'asistente',
        contenido: m.contenido,
      }));
    }

    const historialSinActual = (historial as MensajeChat[]).filter(
      (m) => m.contenido !== dto.mensaje,
    );

    const resultado = await this.rag.responderConContexto(
      dto.mensaje,
      historialSinActual,
      sesion.id,
    );

    await this.prisma.mensajeChat.create({
      data: {
        sesionId: sesion.id,
        rol: 'ASISTENTE',
        contenido: resultado.respuesta,
        tokensUsados: resultado.tokensUsados,
        confianza: resultado.confianza,
        fuentesRAG: resultado.fuentesUsadas as any,
        escaladoHumano: resultado.deberiaEscalarHumano,
      },
    });

    const historialActualizado: MensajeChat[] = [
      ...(historialSinActual as MensajeChat[]),
      { rol: 'usuario', contenido: dto.mensaje },
      { rol: 'asistente', contenido: resultado.respuesta },
    ];
    await this.redis.guardarContextoChat(sesion.id, historialActualizado);

    if (usuarioId) {
      await this.actualizarMetricaIA(usuarioId).catch((err) => {
        this.logger.warn(`No se pudieron actualizar métricas: ${err.message}`);
      });
    }

    if (resultado.deberiaEscalarHumano) {
      this.logger.warn(
        JSON.stringify({
          evento: 'ESCALADO_HUMANO',
          canal: 'WEB',
          usuarioId: usuarioId ?? 'anonimo',
          sesionId: sesion.id,
          confianza: resultado.confianza,
          timestamp: new Date().toISOString(),
        }),
      );
    }

    return {
      respuesta: resultado.respuesta,
      sesionId: sesion.id,
      fuentes: resultado.fuentesUsadas,
      escaladoHumano: resultado.deberiaEscalarHumano,
    };
  }

  async obtenerHistorial(sesionId: string, usuarioId: string) {
    const sesion = await this.prisma.sesionChat.findFirst({
      where: {
        id: sesionId,
          OR: [{ usuarioId }, { usuarioId: null }],
      },
    });

    if (!sesion) throw new NotFoundException('Sesión de chat no encontrada');

    const mensajes = await this.prisma.mensajeChat.findMany({
      where: { sesionId },
      orderBy: { creadoEn: 'asc' },
    });

    return { sesionId, mensajes };
  }

  async obtenerSesiones(usuarioId: string) {
    return this.prisma.sesionChat.findMany({
      where: { usuarioId },
      orderBy: { actualizadaEn: 'desc' },
      include: {
        _count: { select: { mensajes: true } },
        mensajes: {
          orderBy: { creadoEn: 'desc' },
          take: 1,
          select: { contenido: true, creadoEn: true, rol: true },
        },
      },
    });
  }

  private async actualizarMetricaIA(usuarioId: string): Promise<void> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    await this.prisma.metricaUsuario.upsert({
      where: { usuarioId_fecha: { usuarioId, fecha: hoy } },
      update: { preguntasIA: { increment: 1 } },
      create: { usuarioId, fecha: hoy, preguntasIA: 1 },
    });
  }
}
