import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

@Injectable()
export class AlmacenamientoService {
  private readonly logger = new Logger(AlmacenamientoService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = config.get('ALMACENAMIENTO_ENDPOINT');

    this.s3 = new S3Client({
      region: config.get('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY', ''),
      },
      ...(endpoint && {
        endpoint,
        forcePathStyle: true, 
      }),
    });

    this.bucket = config.get('AWS_BUCKET_NOMBRE', 'mineria-capacitacion-docs');
  }

  async subir(buffer: Buffer, clave: string, tipoMime: string): Promise<string> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: clave,
        Body: buffer,
        ContentType: tipoMime,
        Metadata: {
          'uploaded-by': 'mineria-api',
          'upload-date': new Date().toISOString(),
        },
      }),
    );

    const endpoint = this.config.get('ALMACENAMIENTO_ENDPOINT');
    if (endpoint) {
      return `${endpoint}/${this.bucket}/${clave}`;
    }

    return `https://${this.bucket}.s3.${this.config.get('AWS_REGION', 'us-east-1')}.amazonaws.com/${clave}`;
  }

  async descargar(urlOClave: string): Promise<Buffer> {
    const clave = this.extraerClave(urlOClave);

    const respuesta = await this.s3.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: clave }),
    );

    const chunks: Uint8Array[] = [];
    for await (const chunk of respuesta.Body as Readable) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async eliminar(urlOClave: string): Promise<void> {
    const clave = this.extraerClave(urlOClave);
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: clave }));
  }

  async generarUrlPresignada(urlOClave: string, ttlSegundos = 3600): Promise<string> {
    const clave = this.extraerClave(urlOClave);
    const comando = new GetObjectCommand({ Bucket: this.bucket, Key: clave });
    return getSignedUrl(this.s3, comando, { expiresIn: ttlSegundos });
  }

  private extraerClave(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        const parsed = new URL(url);
        const pathParts = parsed.pathname.split('/');
        const bucketIndex = pathParts.indexOf(this.bucket);
        if (bucketIndex !== -1) {
          return pathParts.slice(bucketIndex + 1).join('/');
        }
      } catch {
      }
    }
    return url;
  }
}
