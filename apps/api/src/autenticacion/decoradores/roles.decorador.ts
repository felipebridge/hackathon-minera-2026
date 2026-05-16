import { SetMetadata } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';

export const CLAVE_ROLES = 'roles';

export const Roles = (...roles: RolUsuario[]) => SetMetadata(CLAVE_ROLES, roles);
