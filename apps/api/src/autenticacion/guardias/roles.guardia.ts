import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolUsuario } from '@prisma/client';
import { CLAVE_ROLES } from '../decoradores/roles.decorador';

@Injectable()
export class GuardiaRoles implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<RolUsuario[]>(CLAVE_ROLES, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!rolesRequeridos?.length) return true;

    const { user } = context.switchToHttp().getRequest();

    if (!user || !rolesRequeridos.includes(user.rol)) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere uno de estos roles: ${rolesRequeridos.join(', ')}`,
      );
    }

    return true;
  }
}
