import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class ClienteOpenAI implements OnModuleInit {
  private readonly logger = new Logger(ClienteOpenAI.name);
  private cliente: OpenAI;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const apiKey = this.config.get<string>('OPENAI_API_KEY', 'sk-placeholder');
    const esPlaceholder = !apiKey || apiKey.startsWith('sk-placeholder') || apiKey === 'sk-...';

    this.cliente = new OpenAI({
      apiKey: esPlaceholder ? 'sk-placeholder' : apiKey,
      timeout: 60000,
      maxRetries: 2,
    });

    if (esPlaceholder) {
      this.logger.warn('⚠️  OPENAI_API_KEY no configurada — el chat IA y RAG no funcionarán. Agrega tu clave en .env');
    } else {
      this.logger.log('Cliente OpenAI inicializado');
    }
  }

  obtenerCliente(): OpenAI {
    return this.cliente;
  }

  obtenerModeloChat(): string {
    return this.config.get('OPENAI_MODELO_CHAT', 'gpt-4o');
  }

  obtenerModeloEmbeddings(): string {
    return this.config.get('OPENAI_MODELO_EMBEDDINGS', 'text-embedding-3-large');
  }

  obtenerMaxTokens(): number {
    return this.config.get<number>('OPENAI_MAX_TOKENS', 2048);
  }

  obtenerTemperatura(): number {
    return this.config.get<number>('OPENAI_TEMPERATURA', 0.3);
  }
}
