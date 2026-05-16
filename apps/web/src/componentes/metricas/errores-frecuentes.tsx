'use client';

import { AlertTriangle } from 'lucide-react';

interface ErrorFrecuente {
  categoria: string;
  totalErrores: number;
}

const ETIQUETAS_CATEGORIA: Record<string, string> = {
  normativa: 'Normativa Decreto 249/07',
  gases_toxicos: 'Gases Tóxicos',
  jerarquia_controles: 'Jerarquía de Controles',
  inspeccion_equipos: 'Inspección de Equipos',
  riesgos_especificos: 'Riesgos Específicos',
};

export function ErroresFrecuentes({ datos }: { datos: ErrorFrecuente[] }) {
  const maximo = Math.max(...datos.map((d) => d.totalErrores), 1);

  return (
    <div className="tarjeta-base p-5 h-full">
      <div className="flex items-center gap-2 mb-5">
        <AlertTriangle className="w-4 h-4 text-advertencia-400" />
        <div>
          <h3 className="text-sm font-semibold text-texto-primario">Errores Frecuentes</h3>
          <p className="text-xs text-texto-muted mt-0.5">Áreas de conocimiento débiles</p>
        </div>
      </div>

      {datos.length === 0 ? (
        <p className="text-sm text-texto-muted text-center py-8">Sin datos suficientes</p>
      ) : (
        <div className="space-y-4">
          {datos.slice(0, 6).map((item) => (
            <div key={item.categoria}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-texto-secundario">
                  {ETIQUETAS_CATEGORIA[item.categoria] ?? item.categoria}
                </span>
                <span className="text-xs font-semibold text-advertencia-400">
                  {item.totalErrores}
                </span>
              </div>
              <div className="h-1.5 bg-fondo-elevado rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-advertencia-500 to-cobre-500 rounded-full transition-all duration-700"
                  style={{ width: `${(item.totalErrores / maximo) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
