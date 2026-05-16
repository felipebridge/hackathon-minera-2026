import { Injectable, Logger } from '@nestjs/common';

interface ChunkTexto {
  contenido: string;
  indice: number;
  paginaInicio?: number;
  paginaFin?: number;
  metadatos?: Record<string, any>;
}

@Injectable()
export class ChunkingService {
  private readonly logger = new Logger(ChunkingService.name);

  private readonly TOKENS_POR_CHUNK = 800;
  private readonly TOKENS_SOLAPAMIENTO = 100;
  private readonly CHARS_POR_TOKEN_APROX = 4;

  dividirTexto(
    texto: string,
    metadatosBase?: Record<string, any>,
  ): ChunkTexto[] {
    const tamanoChunk = this.TOKENS_POR_CHUNK * this.CHARS_POR_TOKEN_APROX;
    const solapamiento = this.TOKENS_SOLAPAMIENTO * this.CHARS_POR_TOKEN_APROX;

    const textoPreprocesado = this.preprocesarTexto(texto);
    const chunks: ChunkTexto[] = [];

    const parrafos = textoPreprocesado.split(/\n{2,}/);
    let chunkActual = '';
    let indice = 0;

    for (const parrafo of parrafos) {
      const parrafoLimpio = parrafo.trim();
      if (!parrafoLimpio) continue;

      if (parrafoLimpio.length > tamanoChunk) {
        if (chunkActual.trim()) {
          chunks.push(this.crearChunk(chunkActual.trim(), indice++, metadatosBase));
          chunkActual = '';
        }
        const subChunks = this.dividirPorOraciones(parrafoLimpio, tamanoChunk, solapamiento, indice, metadatosBase);
        chunks.push(...subChunks);
        indice += subChunks.length;
        continue;
      }

      if (chunkActual.length + parrafoLimpio.length + 2 > tamanoChunk) {
        if (chunkActual.trim()) {
          chunks.push(this.crearChunk(chunkActual.trim(), indice++, metadatosBase));
          chunkActual = this.obtenerSolapamiento(chunkActual, solapamiento);
        }
      }

      chunkActual += (chunkActual ? '\n\n' : '') + parrafoLimpio;
    }

    if (chunkActual.trim()) {
      chunks.push(this.crearChunk(chunkActual.trim(), indice, metadatosBase));
    }

    this.logger.debug(`Texto dividido en ${chunks.length} chunks`);
    return chunks;
  }

  private dividirPorOraciones(
    texto: string,
    tamanoMax: number,
    solapamiento: number,
    indiceBase: number,
    metadatos?: Record<string, any>,
  ): ChunkTexto[] {
    const oraciones = texto.match(/[^.!?]+[.!?]+/g) ?? [texto];
    const chunks: ChunkTexto[] = [];
    let actual = '';
    let indice = indiceBase;

    for (const oracion of oraciones) {
      if (actual.length + oracion.length > tamanoMax) {
        if (actual.trim()) {
          chunks.push(this.crearChunk(actual.trim(), indice++, metadatos));
          actual = this.obtenerSolapamiento(actual, solapamiento);
        }
      }
      actual += oracion;
    }

    if (actual.trim()) {
      chunks.push(this.crearChunk(actual.trim(), indice, metadatos));
    }

    return chunks;
  }

  private crearChunk(contenido: string, indice: number, metadatos?: Record<string, any>): ChunkTexto {
    return { contenido, indice, metadatos };
  }

  private obtenerSolapamiento(texto: string, largo: number): string {
    return texto.slice(-largo);
  }

  private preprocesarTexto(texto: string): string {
    return texto
      .replace(/\f/g, '\n')
      .replace(/[ \t]{3,}/g, '  ')
      .replace(/\n{4,}/g, '\n\n\n')
      .replace(/[^\S\n]{2,}/g, ' ')
      .trim();
  }
}
