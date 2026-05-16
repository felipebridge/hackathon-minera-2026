'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropsTarjetaEstadistica {
  titulo: string;
  valor: string | number | null;
  total?: number;
  icono: LucideIcon;
  color: 'mineral' | 'cobre' | 'exito' | 'peligro';
  descripcion?: string;
  compacto?: boolean;
  destacado?: boolean;
}

const COLORES = {
  mineral: {
    fondo: 'bg-mineral-500/10',
    borde: 'border-mineral-500/20',
    icono: 'text-mineral-400',
    valor: 'text-mineral-300',
    glow: 'shadow-glow-sm',
  },
  cobre: {
    fondo: 'bg-cobre-500/10',
    borde: 'border-cobre-500/20',
    icono: 'text-cobre-400',
    valor: 'text-cobre-400',
    glow: '',
  },
  exito: {
    fondo: 'bg-exito-500/10',
    borde: 'border-exito-500/20',
    icono: 'text-exito-400',
    valor: 'text-exito-400',
    glow: '',
  },
  peligro: {
    fondo: 'bg-peligro-500/10',
    borde: 'border-peligro-500/20',
    icono: 'text-peligro-400',
    valor: 'text-peligro-400',
    glow: '',
  },
};

export function TarjetaEstadistica({
  titulo,
  valor,
  total,
  icono: Icono,
  color,
  descripcion,
  compacto = false,
  destacado = false,
}: PropsTarjetaEstadistica) {
  const estilos = COLORES[color];

  return (
    <div
      className={cn(
        'tarjeta-base p-5 transition-all duration-200',
        destacado && `${estilos.glow} border-${color === 'mineral' ? 'mineral' : color}-500/30`,
        compacto && 'p-4',
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-texto-muted uppercase tracking-wider mb-1">
            {titulo}
          </p>

          {valor === null ? (
            <div className="skeleton h-7 w-20 mt-1" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className={cn('text-2xl font-bold', compacto ? 'text-xl' : 'text-2xl', estilos.valor)}>
                {valor}
              </span>
              {total !== undefined && (
                <span className="text-sm text-texto-muted">/ {total}</span>
              )}
            </div>
          )}

          {descripcion && (
            <p className="text-xs text-texto-muted mt-1 leading-tight">{descripcion}</p>
          )}
        </div>

        <div className={cn('p-2.5 rounded-xl flex-shrink-0', estilos.fondo, `border ${estilos.borde}`)}>
          <Icono className={cn('w-5 h-5', estilos.icono)} />
        </div>
      </div>
    </div>
  );
}
