import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

import { PrismaModule } from './comun/prisma/prisma.module';
import { RedisModule } from './comun/redis/redis.module';
import { AutenticacionModule } from './autenticacion/autenticacion.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { CursosModule } from './cursos/cursos.module';
import { EvaluacionesModule } from './evaluaciones/evaluaciones.module';
import { IAModule } from './ia/ia.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { DocumentosModule } from './documentos/documentos.module';
import { MetricasModule } from './metricas/metricas.module';
import { SimulacionesModule } from './simulaciones/simulaciones.module';
import { AlmacenamientoModule } from './comun/almacenamiento/almacenamiento.module';
import { InduccionModule } from './induccion/induccion.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      cache: true,
    }),

    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const esProduccion = config.get('NODE_ENV') === 'production';
        return {
          transports: [
            new winston.transports.Console({
              format: esProduccion
                ? winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.json(),
                  )
                : winston.format.combine(
                    winston.format.colorize(),
                    winston.format.timestamp({ format: 'HH:mm:ss' }),
                    winston.format.printf(({ timestamp, level, message, context }) => {
                      return `[${timestamp}] ${level} [${context ?? 'App'}]: ${message}`;
                    }),
                  ),
            }),
            ...(esProduccion
              ? [
                  new winston.transports.File({
                    filename: 'logs/errores.log',
                    level: 'error',
                    format: winston.format.combine(
                      winston.format.timestamp(),
                      winston.format.json(),
                    ),
                  }),
                  new winston.transports.File({
                    filename: 'logs/combinado.log',
                    format: winston.format.combine(
                      winston.format.timestamp(),
                      winston.format.json(),
                    ),
                  }),
                ]
              : []),
          ],
        };
      },
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'corto',
            ttl: 60000,
            limit: 30,
          },
          {
            name: 'largo',
            ttl: parseInt(config.get('RATE_LIMIT_VENTANA_MS', '900000')),
            limit: parseInt(config.get('RATE_LIMIT_MAX_SOLICITUDES', '100')),
          },
        ],
      }),
    }),

    ScheduleModule.forRoot(),

    PrismaModule,
    RedisModule,
    AlmacenamientoModule,

    AutenticacionModule,
    UsuariosModule,
    CursosModule,
    EvaluacionesModule,
    IAModule,
    WhatsappModule,
    DocumentosModule,
    MetricasModule,
    SimulacionesModule,
    InduccionModule,
  ],
})
export class AppModule {}
