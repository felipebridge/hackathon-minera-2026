import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../comun/prisma/prisma.service';
import { EmbeddingsService } from '../ia/rag/embeddings.service';
import { ChunkingService } from '../ia/rag/chunking.service';
import { AlmacenamientoService } from '../comun/almacenamiento/almacenamiento.service';
import { EstadoDocumento } from '@prisma/client';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class DocumentosService {
  private readonly logger = new Logger(DocumentosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingsService,
    private readonly chunking: ChunkingService,
    private readonly almacenamiento: AlmacenamientoService,
  ) {}

  async subir(
    archivo: Express.Multer.File,
    datos: { titulo: string; descripcion?: string; categoria?: string },
    usuarioId: string,
  ) {
    const claveArchivo = `documentos/${Date.now()}-${archivo.originalname.replace(/\s+/g, '_')}`;
    const url = await this.almacenamiento.subir(
      archivo.buffer,
      claveArchivo,
      archivo.mimetype,
    );

    const documento = await this.prisma.documento.create({
      data: {
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        categoria: datos.categoria,
        archivoUrl: url,
        nombreArchivo: archivo.originalname,
        tipoMime: archivo.mimetype,
        tamanoBytes: BigInt(archivo.size),
        estado: EstadoDocumento.PENDIENTE,
        cargadoPorId: usuarioId,
      },
    });

    this.procesarDocumento(documento.id).catch((err) => {
      this.logger.error(`Error en procesamiento background de ${documento.id}: ${err.message}`);
    });

    return documento;
  }

  async procesarDocumento(documentoId: string): Promise<void> {
    const documento = await this.prisma.documento.findUnique({
      where: { id: documentoId },
    });

    if (!documento) throw new NotFoundException('Documento no encontrado');

    await this.prisma.documento.update({
      where: { id: documentoId },
      data: { estado: EstadoDocumento.PROCESANDO },
    });

    try {
      const buffer = await this.almacenamiento.descargar(documento.archivoUrl);
      let textoExtraido = '';

      if (documento.tipoMime === 'application/pdf') {
        const resultado = await pdfParse(buffer);
        textoExtraido = resultado.text;
      } else {
        textoExtraido = buffer.toString('utf-8');
      }

      if (!textoExtraido.trim()) {
        throw new BadRequestException('No se pudo extraer texto del documento');
      }

      const chunks = this.chunking.dividirTexto(textoExtraido, {
        documentoTitulo: documento.titulo,
        documentoId: documento.id,
      });

      await this.prisma.chunkDocumento.deleteMany({
        where: { documentoId },
      });

      const textos = chunks.map((c) => c.contenido);
      const embeddingsLote = await this.embeddings.generarEmbeddingsLote(textos);

      const LOTE = 50;
      for (let i = 0; i < chunks.length; i += LOTE) {
        const loteChunks = chunks.slice(i, i + LOTE);
        const loteEmbeddings = embeddingsLote.slice(i, i + LOTE);

        await this.prisma.$transaction(
          loteChunks.map((chunk, j) =>
            this.prisma.$executeRaw`
              INSERT INTO chunks_documentos (id, documento_id, contenido, embedding, indice, metadatos, creado_en)
              VALUES (
                gen_random_uuid(),
                ${documentoId},
                ${chunk.contenido},
                ${`[${loteEmbeddings[j].join(',')}]`}::vector,
                ${chunk.indice},
                ${JSON.stringify(chunk.metadatos ?? {})}::jsonb,
                NOW()
              )
            `,
          ),
        );

        this.logger.debug(
          `Procesados chunks ${i + 1}-${Math.min(i + LOTE, chunks.length)} de ${chunks.length}`,
        );
      }

      await this.prisma.documento.update({
        where: { id: documentoId },
        data: {
          estado: EstadoDocumento.LISTO,
          totalChunks: chunks.length,
        },
      });

      this.logger.log(
        `Documento "${documento.titulo}" procesado: ${chunks.length} chunks con embeddings`,
      );
    } catch (error) {
      await this.prisma.documento.update({
        where: { id: documentoId },
        data: {
          estado: EstadoDocumento.ERROR,
          errorProcesado: error.message,
        },
      });

      this.logger.error(`Error procesando documento ${documentoId}: ${error.message}`);
      throw error;
    }
  }

  async listar(pagina = 1, limite = 20) {
    const saltar = (pagina - 1) * limite;
    const [total, documentos] = await this.prisma.$transaction([
      this.prisma.documento.count(),
      this.prisma.documento.findMany({
        skip: saltar,
        take: limite,
        orderBy: { creadoEn: 'desc' },
        include: {
          cargadoPor: { select: { nombre: true, apellido: true, email: true } },
          _count: { select: { chunks: true } },
        },
      }),
    ]);

    return { documentos, total, pagina, paginas: Math.ceil(total / limite) };
  }

  async eliminar(id: string): Promise<void> {
    const doc = await this.prisma.documento.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Documento no encontrado');

    await this.almacenamiento.eliminar(doc.archivoUrl).catch((err) => {
      this.logger.warn(`No se pudo eliminar archivo de S3: ${err.message}`);
    });

    await this.prisma.documento.delete({ where: { id } });
  }
}
