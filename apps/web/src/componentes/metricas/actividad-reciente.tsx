'use client';

import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatearFechaRelativa } from '@/lib/fecha';

interface ActividadItem {
  id: string;
  puntaje: number;
  aprobado: boolean;
  completadoEn: string;
  usuario: { nombre: string; apellido: string; area?: string };
  evaluacion: { titulo: string };
}

export function ActividadReciente({ datos }: { datos: ActividadItem[] }) {
  return (
    <div className="tarjeta-base p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-texto-primario">Actividad Reciente</h3>
        <p className="text-xs text-texto-muted mt-0.5">Últimas evaluaciones completadas</p>
      </div>

      {datos.length === 0 ? (
        <p className="text-sm text-texto-muted text-center py-8">Sin actividad reciente</p>
      ) : (
        <div className="space-y-3">
          {datos.map((item) => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-fondo-elevado border border-fondo-borde">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                item.aprobado ? 'bg-exito-500/10' : 'bg-peligro-500/10',
              )}>
                {item.aprobado
                  ? <CheckCircle2 className="w-4 h-4 text-exito-400" />
                  : <XCircle className="w-4 h-4 text-peligro-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-texto-primario truncate">
                  {item.usuario.nombre} {item.usuario.apellido}
                </p>
                <p className="text-xs text-texto-muted truncate">{item.evaluacion.titulo}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={cn('text-sm font-bold', item.aprobado ? 'text-exito-400' : 'text-peligro-400')}>
                  {item.puntaje.toFixed(0)}%
                </p>
                <p className="text-[10px] text-texto-muted flex items-center gap-1 justify-end">
                  <Clock className="w-2.5 h-2.5" />
                  {formatearFechaRelativa(new Date(item.completadoEn))}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
