import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UsuarioActual = createParamDecorator(
  (campo: string | undefined, ctx: ExecutionContext) => {
    const solicitud = ctx.switchToHttp().getRequest();
    const usuario = solicitud.user;
    return campo ? usuario?.[campo] : usuario;
  },
);
