import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface RespuestaError {
  exito: false;
  codigoEstado: number;
  mensaje: string;
  errores?: string[] | Record<string, string[]>;
  marca: string;
}

@Catch()
export class FiltroHttpExcepcion implements ExceptionFilter {
  private readonly logger = new Logger(FiltroHttpExcepcion.name);

  catch(excepcion: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const respuesta = ctx.getResponse<Response>();
    const solicitud = ctx.getRequest<Request>();

    let codigoEstado = HttpStatus.INTERNAL_SERVER_ERROR;
    let mensaje = 'Error interno del servidor';
    let errores: string[] | undefined;

    if (excepcion instanceof HttpException) {
      codigoEstado = excepcion.getStatus();
      const cuerpo = excepcion.getResponse();

      if (typeof cuerpo === 'string') {
        mensaje = cuerpo;
      } else if (typeof cuerpo === 'object' && cuerpo !== null) {
        const cuerpoObj = cuerpo as Record<string, any>;
        mensaje = cuerpoObj.message ?? mensaje;
        if (Array.isArray(cuerpoObj.message)) {
          errores = cuerpoObj.message;
          mensaje = 'Error de validación';
        }
      }
    } else if (excepcion instanceof Prisma.PrismaClientKnownRequestError) {
      if (excepcion.code === 'P2002') {
        codigoEstado = HttpStatus.CONFLICT;
        mensaje = 'Ya existe un registro con esos datos únicos';
      } else if (excepcion.code === 'P2025') {
        codigoEstado = HttpStatus.NOT_FOUND;
        mensaje = 'El registro solicitado no existe';
      } else {
        this.logger.error(`Error Prisma ${excepcion.code}:`, excepcion.message);
        mensaje = 'Error al procesar la operación en base de datos';
      }
    } else if (excepcion instanceof Error) {
      this.logger.error(
        `Excepción no manejada en ${solicitud.method} ${solicitud.url}:`,
        excepcion.stack,
      );
    }

    if (codigoEstado >= 500 && process.env.NODE_ENV === 'production') {
      mensaje = 'Error interno del servidor';
    }

    const cuerpoRespuesta: RespuestaError = {
      exito: false,
      codigoEstado,
      mensaje,
      ...(errores && { errores }),
      marca: new Date().toISOString(),
    };

    respuesta.status(codigoEstado).json(cuerpoRespuesta);
  }
}
