import { Injectable, Logger } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';
import { ClienteOpenAI } from '../openai/cliente-openai';
import { RedisService } from '../../comun/redis/redis.service';
import type OpenAI from 'openai';

const SISTEMA_PROMPT_BASE = `Eres MinerIA, el experto minero disponible 24/7 para empleados en proceso de inducción y trabajadores activos de la faena en la provincia de San Juan, Argentina.

Tu rol principal es acompañar a los nuevos empleados durante su proceso de inducción y resolver dudas operativas en campo.
Tu conocimiento proviene exclusivamente de la documentación técnica oficial de la empresa, normativas mineras argentinas vigentes (Decreto 249/07, Resolución 905/2015 MTESS, Ley 24.196) y los procedimientos internos cargados en la base de conocimiento.

CONTEXTO DEL SISTEMA:
Formas parte de MinerIA, un sistema que reemplaza la inducción minera tradicional (manual + charla de 8h) por:
1. Charla introductoria reducida (~1h) con instructor
2. Simulación VR en Meta Quest 2 ("falla segura" — practicar sin riesgo real)
3. Examen obligatorio de conocimientos
4. Tú: experto IA disponible 24/7 por WhatsApp y web

MARCO NORMATIVO DE REFERENCIA (Argentina):
- Decreto 249/07: Reglamento de Higiene y Seguridad para la Actividad Minera (normativa base)
- Resolución 905/2015 MTESS: Condiciones de Higiene y Seguridad en Minería
- Ley 19.587/72: Ley de Higiene y Seguridad en el Trabajo
- Ley 24.196: Ley de Inversiones Mineras
- Normativa SECMA: Secretaría de Estado de Minería de San Juan

DIRECTRICES CRÍTICAS:
- Responde SIEMPRE en español argentino con terminología técnica minera precisa.
- Para empleados en inducción: adapta tu respuesta a su nivel. Son nuevos, priorizan la claridad sobre la exhaustividad.
- Si no encuentras la respuesta en el contexto proporcionado, di EXPLÍCITAMENTE que no tienes esa información y sugiere consultar al supervisor de turno o al instructor asignado.
- NUNCA inventes procedimientos, normativas ni datos técnicos. En minería, la información incorrecta puede costar vidas.
- Cuando cites información, menciona el documento fuente para que el empleado pueda verificar.
- Para situaciones de emergencia: PRIMERO da la instrucción crítica (evacuar / no mover / llamar al supervisor), DESPUÉS el contexto.
- Normaliza preguntas con errores ortográficos, abreviaciones técnicas o mensajes de WhatsApp informales antes de responder.

RESPUESTAS FRECUENTES EN INDUCCIÓN:
- Preguntas sobre el primer día: qué llevar, cómo llegar, con quién hablar → responde con detalle práctico
- Dudas sobre EPP para su área específica → cita el Decreto 249/07 y Resolución 905/2015 como referencia
- "¿Qué hago si...?" (situaciones de emergencia) → protocolo paso a paso, sin tecnicismos innecesarios
- Preguntas post-examen: explicar por qué su respuesta fue incorrecta → didáctico y empático

ESTRUCTURA DE RESPUESTA:
- Respuestas concisas (máx. 3-4 párrafos) para el contexto de campo o WhatsApp.
- Para procedimientos de seguridad, usa listas numeradas.
- Para alertas o emergencias, usa ⚠️ al inicio.
- Para información normativa, cita la fuente entre paréntesis.`;

export interface MensajeChat {
  rol: 'usuario' | 'asistente' | 'sistema';
  contenido: string;
}

export interface RespuestaRAG {
  respuesta: string;
  fuentesUsadas: { documentoTitulo: string; similitud: number }[];
  confianza: number;
  deberiaEscalarHumano: boolean;
  tokensUsados: number;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly embeddings: EmbeddingsService,
    private readonly openai: ClienteOpenAI,
  ) {}

  async responderConContexto(
    pregunta: string,
    historial: MensajeChat[],
    sesionId: string,
  ): Promise<RespuestaRAG> {
    const preguntaNormalizada = this.normalizarPregunta(pregunta);

    const embeddingPregunta = await this.embeddings.generarEmbedding(preguntaNormalizada);
    const chunksRelevantes = await this.embeddings.buscarChunksSimilares(
      embeddingPregunta,
      5,
      0.72,
    );

    const hayContexto = chunksRelevantes.length > 0;
    const confianzaBase = hayContexto
      ? chunksRelevantes.reduce((acc, c) => acc + c.similitud, 0) / chunksRelevantes.length
      : 0;

    const contextoDocumental = this.construirContextoDocumental(chunksRelevantes);
    const mensajesOpenAI = this.prepararMensajes(historial, preguntaNormalizada, contextoDocumental);

    let respuestaTexto = '';
    let tokensUsados = 0;

    try {
      const completacion = await this.openai.obtenerCliente().chat.completions.create({
        model: this.openai.obtenerModeloChat(),
        messages: mensajesOpenAI,
        max_tokens: this.openai.obtenerMaxTokens(),
        temperature: this.openai.obtenerTemperatura(),
      });

      respuestaTexto = completacion.choices[0]?.message?.content ?? 'No pude generar una respuesta.';
      tokensUsados = completacion.usage?.total_tokens ?? 0;
    } catch (error) {
      this.logger.error(`Error en OpenAI: ${error.message}`);
      respuestaTexto = 'En este momento no puedo procesar tu consulta. Por favor, contacta directamente a tu supervisor o al departamento de seguridad para resolver tu duda urgente.';
    }

    const deberiaEscalarHumano = this.evaluarEscalamientoHumano(
      preguntaNormalizada,
      respuestaTexto,
      confianzaBase,
    );

    return {
      respuesta: respuestaTexto,
      fuentesUsadas: chunksRelevantes.map((c) => ({
        documentoTitulo: c.documentoTitulo,
        similitud: c.similitud,
      })),
      confianza: confianzaBase,
      deberiaEscalarHumano,
      tokensUsados,
    };
  }

  private construirContextoDocumental(
    chunks: { contenido: string; documentoTitulo: string; similitud: number }[],
  ): string {
    if (chunks.length === 0) {
      return 'No se encontró documentación relevante para esta consulta en la base de conocimiento.';
    }

    return chunks
      .map(
        (c, i) =>
          `[Fuente ${i + 1}: ${c.documentoTitulo} (relevancia: ${(c.similitud * 100).toFixed(0)}%)]\n${c.contenido}`,
      )
      .join('\n\n---\n\n');
  }

  private prepararMensajes(
    historial: MensajeChat[],
    pregunta: string,
    contexto: string,
  ): OpenAI.ChatCompletionMessageParam[] {
    const mensajes: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `${SISTEMA_PROMPT_BASE}\n\nCONTEXTO DOCUMENTAL DISPONIBLE:\n${contexto}`,
      },
    ];

    for (const msg of historial.slice(-10)) {
      mensajes.push({
        role: msg.rol === 'usuario' ? 'user' : msg.rol === 'asistente' ? 'assistant' : 'system',
        content: msg.contenido,
      });
    }

    mensajes.push({ role: 'user', content: pregunta });

    return mensajes;
  }

  private evaluarEscalamientoHumano(
    pregunta: string,
    respuesta: string,
    confianza: number,
  ): boolean {
    const palabrasEmergencia = [
      'accidente', 'herido', 'lesión', 'emergencia', 'derrumbe', 'explosión',
      'incendio', 'gas tóxico', 'intoxicación', 'evacuación urgente', 'atrapado',
    ];

    const preguntaLower = pregunta.toLowerCase();
    const esEmergencia = palabrasEmergencia.some((p) => preguntaLower.includes(p));

    const bajaConfianza = confianza < 0.6;
    const iaIncerta = respuesta.toLowerCase().includes('no tengo información') ||
                      respuesta.toLowerCase().includes('consultar con');

    return esEmergencia || (bajaConfianza && iaIncerta);
  }

  private normalizarPregunta(texto: string): string {
    return texto
      .toLowerCase()
      .replace(/\bds132\b/g, 'decreto 249 higiene seguridad mineria argentina')
      .replace(/\bepp\b/g, 'equipo de protección personal')
      .replace(/\biperc\b/g, 'identificación de peligros y evaluación de riesgos')
      .replace(/\bpers\b/g, 'procedimiento estándar de trabajo')
      .replace(/\bdgmn\b/g, 'secretaria de mineria de san juan')
      .replace(/\btaj\.?\s*ab/g, 'tajo abierto')
      .trim();
  }
}
