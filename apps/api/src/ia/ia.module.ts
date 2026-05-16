import { Module } from '@nestjs/common';
import { IAController } from './ia.controller';
import { IAService } from './ia.service';
import { RagService } from './rag/rag.service';
import { EmbeddingsService } from './rag/embeddings.service';
import { ChunkingService } from './rag/chunking.service';
import { ClienteOpenAI } from './openai/cliente-openai';

@Module({
  controllers: [IAController],
  providers: [IAService, RagService, EmbeddingsService, ChunkingService, ClienteOpenAI],
  exports: [IAService, RagService, EmbeddingsService, ChunkingService],
})
export class IAModule {}
