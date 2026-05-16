import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { FiltroHttpExcepcion } from './comun/filtros/http-excepcion.filtro';

function validarVariablesEntorno(): void {
  const requeridas = ['DATABASE_URL', 'JWT_SECRETO', 'NODE_ENV'];
  const faltantes = requeridas.filter((v) => !process.env[v]);
  if (faltantes.length > 0) {
    throw new Error(
      `[Startup] Variables de entorno críticas faltantes: ${faltantes.join(', ')}. ` +
      'Copia .env.example a .env y completa los valores reales.',
    );
  }
}

async function iniciar() {
  validarVariablesEntorno();
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configuracion = app.get(ConfigService);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);

  app.useLogger(logger);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'], 
          styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'fonts.googleapis.com'],
          imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
          fontSrc: ["'self'", 'fonts.gstatic.com'],
        },
      },
    }),
  );

  const origenesCors = configuracion.get<string>('CORS_ORIGENES', 'http://localhost:3000');
  app.enableCors({
    origin: origenesCors.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.enableVersioning({ type: VersioningType.URI });
  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new FiltroHttpExcepcion());

  if (configuracion.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('MinerIA — API de Capacitación')
      .setDescription(
        'API REST del sistema inteligente de capacitación minera. ' +
        'Incluye autenticación JWT, gestión de cursos, motor IA/RAG e integración WhatsApp.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'jwt',
      )
      .addTag('autenticacion', 'Registro, login y gestión de tokens')
      .addTag('usuarios', 'Gestión de usuarios y roles')
      .addTag('cursos', 'Cursos, módulos y progreso')
      .addTag('evaluaciones', 'Evaluaciones y resultados')
      .addTag('ia', 'Chat inteligente y RAG')
      .addTag('whatsapp', 'Integración con WhatsApp Cloud API')
      .addTag('documentos', 'Gestión documental para la base RAG')
      .addTag('metricas', 'Dashboard y KPIs de capacitación')
      .addTag('simulaciones', 'Módulo de realidad virtual')
      .build();

    const documento = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, documento, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const puerto = configuracion.get<number>('API_PUERTO', 3001);
  await app.listen(puerto);

  logger.log(`API iniciada en: http://localhost:${puerto}/api`, 'Bootstrap');

  if (configuracion.get('NODE_ENV') !== 'production') {
    logger.log(`Swagger: http://localhost:${puerto}/api/docs`, 'Bootstrap');
  }
}

iniciar();
