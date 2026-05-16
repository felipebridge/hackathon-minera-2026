import { Injectable, Logger } from '@nestjs/common';
import { ClienteOpenAI } from '../openai/cliente-openai';
import { PrismaService } from '../../comun/prisma/prisma.service';
import { RedisService } from '../../comun/redis/redis.service';
import * as crypto from 'crypto';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);

  constructor(
    private readonly openai: ClienteOpenAI,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async generarEmbedding(texto: string): Promise<number[]> {
    const hash = crypto.createHash('sha256').update(texto).digest('hex');
    const claveCache = `embedding:${hash}`;

    const cachedado = await this.redis.obtener<number[]>(claveCache);
    if (cachedado) return cachedado;

    try {
      const respuesta = await this.openai.obtenerCliente().embeddings.create({
        model: this.openai.obtenerModeloEmbeddings(),
        input: texto,
        encoding_format: 'float',
      });

      const embedding = respuesta.data[0].embedding;

      await this.redis.establecer(claveCache, embedding, 604800);

      return embedding;
    } catch (error) {
      this.logger.error(`Error generando embedding: ${error.message}`);
      throw error;
    }
  }

  async generarEmbeddingsLote(textos: string[]): Promise<number[][]> {
    const TAMANO_LOTE = 100;
    const resultados: number[][] = [];

    for (let i = 0; i < textos.length; i += TAMANO_LOTE) {
      const lote = textos.slice(i, i + TAMANO_LOTE);

      try {
        const respuesta = await this.openai.obtenerCliente().embeddings.create({
          model: this.openai.obtenerModeloEmbeddings(),
          input: lote,
          encoding_format: 'float',
        });

        resultados.push(...respuesta.data.map((d) => d.embedding));
        this.logger.debug(`Lote ${Math.floor(i / TAMANO_LOTE) + 1} procesado (${lote.length} textos)`);
      } catch (error) {
        this.logger.error(`Error en lote ${i}-${i + TAMANO_LOTE}: ${error.message}`);
        throw error;
      }
    }

    return resultados;
  }

  async buscarChunksSimilares(
    embedding: number[],
    limite = 5,
    umbralSimilitud = 0.75,
  ): Promise<{ id: string; contenido: string; similitud: number; documentoId: string; documentoTitulo: string }[]> {
    const vectorSQL = `[${embedding.join(',')}]`;

    const resultados = await this.prisma.$queryRaw<
      { id: string; contenido: string; similitud: number; documento_id: string; titulo: string }[]
    >`
      SELECT
        c.id,
        c.contenido,
        1 - (c.embedding <=> ${vectorSQL}::vector) AS similitud,
        c.documento_id,
        d.titulo
      FROM chunks_documentos c
      JOIN documentos d ON d.id = c.documento_id
      WHERE d.estado = 'LISTO'
        AND c.embedding IS NOT NULL
        AND 1 - (c.embedding <=> ${vectorSQL}::vector) > ${umbralSimilitud}
      ORDER BY c.embedding <=> ${vectorSQL}::vector
      LIMIT ${limite}
    `;

    return resultados.map((r) => ({
      id: r.id,
      contenido: r.contenido,
      similitud: Number(r.similitud),
      documentoId: r.documento_id,
      documentoTitulo: r.titulo,
    }));
  }
}
