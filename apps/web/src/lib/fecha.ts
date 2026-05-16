import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatearFechaRelativa(fecha: Date): string {
  return formatDistanceToNow(fecha, { addSuffix: true, locale: es });
}

export function formatearFecha(fecha: Date): string {
  return format(fecha, 'dd MMM yyyy', { locale: es });
}

export function formatearFechaHora(fecha: Date): string {
  return format(fecha, "dd/MM/yyyy 'a las' HH:mm", { locale: es });
}
