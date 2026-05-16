import { SetMetadata } from '@nestjs/common';

export const CLAVE_RUTA_PUBLICA = 'esRutaPublica';

export const RutaPublica = () => SetMetadata(CLAVE_RUTA_PUBLICA, true);
