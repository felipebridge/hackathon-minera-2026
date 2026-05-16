'use client';

import { TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

interface CursoPopular {
  id: string;
  titulo: string;
  categoria: string;
  _count: { asignaciones: number; certificaciones: number };
}

export function CursosPopulares({ datos }: { datos: CursoPopular[] }) {
  return (
    <div className="tarjeta-base p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-cobre-400" />
        <div>
          <h3 className="text-sm font-semibold text-texto-primario">Cursos Más Populares</h3>
          <p className="text-xs text-texto-muted mt-0.5">Por número de asignaciones</p>
        </div>
      </div>

      {datos.length === 0 ? (
        <p className="text-sm text-texto-muted text-center py-8">Sin datos disponibles</p>
      ) : (
        <div className="space-y-3">
          {datos.map((curso, i) => (
            <Link key={curso.id} href={`/cursos/${curso.id}`}>
              <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-fondo-elevado transition-colors cursor-pointer group">
                <span className="w-6 h-6 rounded-md bg-mineral-500/10 text-mineral-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-texto-primario truncate group-hover:text-mineral-300 transition-colors">
                    {curso.titulo}
                  </p>
                  <p className="text-xs text-texto-muted">{curso.categoria}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-texto-muted">
                    <Users className="w-3 h-3" />
                    {curso._count.asignaciones}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
