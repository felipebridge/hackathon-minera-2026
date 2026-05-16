import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENTE',
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const { default: Redis } = await import('ioredis');
        const cliente = new Redis({
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD') || undefined,
          retryStrategy: (times) => Math.min(times * 500, 30000),
          lazyConnect: false,
        });

        cliente.on('connect', () => console.log('[Redis] Conexión establecida'));
        cliente.on('error', (err) => console.error('[Redis] Error:', err.message));

        return cliente;
      },
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENTE', RedisService],
})
export class RedisModule {}
