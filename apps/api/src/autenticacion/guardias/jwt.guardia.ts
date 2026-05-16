import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { CLAVE_RUTA_PUBLICA } from '../decoradores/ruta-publica.decorador';

@Injectable()
export class GuardiaJwt extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const esPublica = this.reflector.getAllAndOverride<boolean>(CLAVE_RUTA_PUBLICA, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (esPublica) return true;

    return super.canActivate(context);
  }
}
