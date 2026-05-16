import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../comun/prisma/prisma.service';
import { IAService } from '../ia/ia.service';
import axios from 'axios';
import * as crypto from 'crypto';

interface MensajeWhatsapp {
  telefono: string;
  tipo: 'text' | 'audio' | 'image' | 'document';
  contenido: string;
  mediaId?: string;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly ia: IAService,
  ) {}

  verificarWebhook(modo: string, token: string, desafio: string): string {
    const tokenEsperado = this.config.getOrThrow('WHATSAPP_WEBHOOK_SECRETO');

    if (modo === 'subscribe' && token === tokenEsperado) {
      this.logger.log('Webhook de WhatsApp verificado correctamente');
      return desafio;
    }

    throw new BadRequestException('Token de verificación inválido');
  }

  verificarFirma(payload: string, firma: string): boolean {
    const appSecret = this.config.get('WHATSAPP_WEBHOOK_SECRETO', '');
    const hashEsperado = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(`sha256=${hashEsperado}`),
      Buffer.from(firma),
    );
  }

  async procesarWebhook(payload: any): Promise<void> {
    const entradas = payload?.entry ?? [];

    for (const entrada of entradas) {
      const cambios = entrada?.changes ?? [];

      for (const cambio of cambios) {
        const valor = cambio?.value;
        const mensajes = valor?.messages ?? [];

        for (const mensaje of mensajes) {
          await this.procesarMensajeIndividual(mensaje, valor).catch((err) => {
            this.logger.error(`Error procesando mensaje WA ${mensaje.id}: ${err.message}`);
          });
        }
      }
    }
  }

  private async procesarMensajeIndividual(mensaje: any, valor: any): Promise<void> {
    const telefono = mensaje.from;
    const tipo = mensaje.type;

    let textoConsulta = '';

    if (tipo === 'text') {
      textoConsulta = mensaje.text?.body ?? '';
    } else if (tipo === 'audio') {
      textoConsulta = await this.transcribirAudio(mensaje.audio?.id);
    } else if (tipo === 'image' || tipo === 'document') {
      await this.enviarMensajeTexto(
        telefono,
        'Por el momento solo proceso mensajes de texto y audio. Para documentos, puedes adjuntarlos desde la plataforma web.',
      );
      return;
    } else {
      this.logger.debug(`Tipo de mensaje no soportado: ${tipo}`);
      return;
    }

    if (!textoConsulta.trim()) return;

    await this.marcarComoLeido(mensaje.id);

    const sesionWA = await this.obtenerOCrearSesion(telefono);

    const respuestaComando = await this.manejarComandos(textoConsulta, telefono, sesionWA);
    if (respuestaComando) return;

    await this.enviarEstadoEscribiendo(telefono);

    const { respuesta, escaladoHumano } = await this.ia.enviarMensaje(
      {
        mensaje: textoConsulta,
        sesionId: sesionWA.sesionChatId ?? undefined,
      },
      sesionWA.usuarioId ?? undefined,
    );

    if (escaladoHumano) {
      await this.enviarMensajeTexto(
        telefono,
        `${respuesta}\n\n⚠️ *Esta consulta ha sido escalada a un supervisor.* Un especialista te contactará pronto.`,
      );
      await this.prisma.sesionWhatsapp.update({
        where: { id: sesionWA.id },
        data: { ultimoMensaje: new Date(), estado: 'ESPERANDO_HUMANO' },
      });
      this.logger.warn(
        JSON.stringify({
          evento: 'ESCALADO_HUMANO',
          telefono,
          usuarioId: sesionWA.usuarioId ?? 'anonimo',
          sesionId: sesionWA.id,
          timestamp: new Date().toISOString(),
        }),
      );
    } else {
      await this.enviarMensajeTexto(telefono, respuesta);
      await this.prisma.sesionWhatsapp.update({
        where: { id: sesionWA.id },
        data: { ultimoMensaje: new Date() },
      });
    }
  }

  private async manejarComandos(
    texto: string,
    telefono: string,
    sesion: any,
  ): Promise<boolean> {
    const cmd = texto.trim().toLowerCase();

    if (cmd === '/inicio' || cmd === 'hola' || cmd === 'menu') {
      await this.enviarMensajeTexto(
        telefono,
        `👷 *MinerIA — Experto Minero 24/7*\n\n` +
        `Soy tu asistente especializado, disponible a cualquier hora para resolver dudas sobre:\n\n` +
        `📋 *Inducción y normativas*\n` +
        `• Decreto 249/07 y Resolución 905/2015\n` +
        `• Procedimientos de tu área específica\n` +
        `• Qué esperar en tu primer día\n\n` +
        `⛑️ *Seguridad operativa*\n` +
        `• EPP correcto para cada zona\n` +
        `• Identificación de riesgos\n` +
        `• Protocolos de emergencia\n\n` +
        `💬 *Envía /emergencia si hay una situación urgente*\n\n` +
        `¿En qué puedo ayudarte hoy?`,
      );
      return true;
    }

    if (cmd === '/induccion' || cmd === 'mi induccion' || cmd === 'mi inducción') {
      await this.enviarMensajeTexto(
        telefono,
        `📚 *Tu proceso de inducción tiene 4 etapas:*\n\n` +
        `1️⃣ *Charla introductoria* — con tu instructor (~1 hora)\n` +
        `2️⃣ *Simulación VR* — práctica en Meta Quest 2 sin riesgo\n` +
        `3️⃣ *Examen obligatorio* — mínimo 70% para aprobar\n` +
        `4️⃣ *Experto IA 24/7* — soy yo, disponible siempre\n\n` +
        `Para ver tu progreso detallado, ingresa a la plataforma web.\n` +
        `¿Tienes alguna duda sobre alguna de las etapas?`,
      );
      return true;
    }

    if (cmd === '/emergencia') {
      await this.enviarMensajeTexto(
        telefono,
        `🚨 *PROTOCOLO DE EMERGENCIA*\n\n` +
        `1. EVACUÁ la zona de inmediato\n` +
        `2. Contactá a la Sala de Control de la mina\n` +
        `3. Avisá a tu supervisor de turno\n` +
        `4. NO reingresés sin autorización del jefe de área\n\n` +
        `📞 El número de emergencias está en tu credencial de acceso y en la cartelería de portería.`,
      );
      return true;
    }

    return false;
  }

  private async obtenerOCrearSesion(telefono: string) {
    let sesion = await this.prisma.sesionWhatsapp.findUnique({
      where: { telefono },
    });

    if (!sesion) {
      const usuario = await this.prisma.usuario.findUnique({
        where: { telefono },
        select: { id: true },
      });

      sesion = await this.prisma.sesionWhatsapp.create({
        data: {
          telefono,
          usuarioId: usuario?.id ?? null,
        },
      });
    }

    return sesion;
  }

  private async transcribirAudio(mediaId: string): Promise<string> {
    try {
      const token = this.config.get('WHATSAPP_TOKEN_ACCESO');

      const urlRespuesta = await axios.get(
        `${this.config.get('WHATSAPP_URL_API')}/${mediaId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const audioResponse = await axios.get(urlRespuesta.data.url, {
        responseType: 'arraybuffer',
        headers: { Authorization: `Bearer ${token}` },
      });

      const { Readable } = await import('stream');
      const stream = Readable.from(Buffer.from(audioResponse.data));
      (stream as any).path = 'audio.ogg';

      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: this.config.get('OPENAI_API_KEY') });

      const transcripcion = await openai.audio.transcriptions.create({
        file: stream as any,
        model: 'whisper-1',
        language: 'es',
      });

      return transcripcion.text;
    } catch (error) {
      this.logger.error(`Error transcribiendo audio: ${error.message}`);
      return '';
    }
  }

  async enviarMensajeTexto(telefono: string, texto: string): Promise<void> {
    const token = this.config.get('WHATSAPP_TOKEN_ACCESO');
    const numeroId = this.config.get('WHATSAPP_NUMERO_ID');
    const urlApi = this.config.get('WHATSAPP_URL_API');

    try {
      await axios.post(
        `${urlApi}/${numeroId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: telefono,
          type: 'text',
          text: { body: texto, preview_url: false },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      this.logger.error(`Error enviando mensaje WA a ${telefono}: ${error.message}`);
    }
  }

  private async marcarComoLeido(mensajeId: string): Promise<void> {
    const token = this.config.get('WHATSAPP_TOKEN_ACCESO');
    const numeroId = this.config.get('WHATSAPP_NUMERO_ID');
    const urlApi = this.config.get('WHATSAPP_URL_API');

    try {
      await axios.post(
        `${urlApi}/${numeroId}/messages`,
        { messaging_product: 'whatsapp', status: 'read', message_id: mensajeId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch {
      
    }
  }

  private async enviarEstadoEscribiendo(_telefono: string): Promise<void> {
    await new Promise((r) => setTimeout(r, 500));
  }
}
