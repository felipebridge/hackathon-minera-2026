import { Injectable, Inject } from '@nestjs/common';
import type { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENTE') private readonly redis: Redis) {}

  async obtener<T>(clave: string): Promise<T | null> {
    const valor = await this.redis.get(clave);
    if (!valor) return null;
    try {
      return JSON.parse(valor) as T;
    } catch {
      return valor as unknown as T;
    }
  }

  async establecer<T>(clave: string, valor: T, ttlSegundos?: number): Promise<void> {
    const serializado = JSON.stringify(valor);
    if (ttlSegundos) {
      await this.redis.setex(clave, ttlSegundos, serializado);
    } else {
      await this.redis.set(clave, serializado);
    }
  }

  async eliminar(...claves: string[]): Promise<void> {
    if (claves.length > 0) {
      await this.redis.del(...claves);
    }
  }

  async existeClave(clave: string): Promise<boolean> {
    const resultado = await this.redis.exists(clave);
    return resultado === 1;
  }

  async incrementar(clave: string, ttlSegundos?: number): Promise<number> {
    const valor = await this.redis.incr(clave);
    if (valor === 1 && ttlSegundos) {
      await this.redis.expire(clave, ttlSegundos);
    }
    return valor;
  }

  async obtenerClaves(patron: string): Promise<string[]> {
    return this.redis.keys(patron);
  }

  async ttl(clave: string): Promise<number> {
    return this.redis.ttl(clave);
  }

  async guardarContextoChat(sesionId: string, mensajes: any[], ttlSegundos = 3600): Promise<void> {
    await this.establecer(`chat:${sesionId}:contexto`, mensajes, ttlSegundos);
  }

  async obtenerContextoChat(sesionId: string): Promise<any[] | null> {
    return this.obtener(`chat:${sesionId}:contexto`);
  }

  async invalidarContextoChat(sesionId: string): Promise<void> {
    await this.eliminar(`chat:${sesionId}:contexto`);
  }
}
