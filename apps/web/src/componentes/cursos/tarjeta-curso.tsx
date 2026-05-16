'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, BookOpen, Award, ChevronRight, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropsTarjetaCurso {
  curso: {
    id: string;
    titulo: string;
    descripcion: string;
    categoria: string;
    nivel: 'BASICO' | 'INTERMEDIO' | 'AVANZADO';
    duracionHoras: number;
    estado: string;
    _count?: { modulos: number };
    progresos?: { porcentaje: number; completado: boolean }[];
  };
}

const COLORES_NIVEL = {
  BASICO: 'text-exito-400 bg-exito-400/10 border-exito-400/20',
  INTERMEDIO: 'text-advertencia-400 bg-advertencia-400/10 border-advertencia-400/20',
  AVANZADO: 'text-peligro-400 bg-peligro-400/10 border-peligro-400/20',
};

const ETIQUETA_NIVEL = {
  BASICO: 'Básico',
  INTERMEDIO: 'Intermedio',
  AVANZADO: 'Avanzado',
};

export function TarjetaCurso({ curso }: PropsTarjetaCurso) {
  const progreso = curso.progresos?.[0];
  const porcentaje = progreso?.porcentaje ?? 0;
  const completado = progreso?.completado ?? false;

  return (
    <Link href={`/cursos/${curso.id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        className="tarjeta-base p-5 flex flex-col gap-4 cursor-pointer group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-md border uppercase tracking-wide',
                COLORES_NIVEL[curso.nivel],
              )}>
                {ETIQUETA_NIVEL[curso.nivel]}
              </span>
              <span className="text-[10px] text-texto-muted">{curso.categoria}</span>
            </div>
            <h3 className="text-sm font-semibold text-texto-primario leading-snug group-hover:text-mineral-300 transition-colors">
              {curso.titulo}
            </h3>
          </div>

          {completado && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-exito-500/10 border border-exito-500/20 flex items-center justify-center">
              <Award className="w-4 h-4 text-exito-400" />
            </div>
          )}
        </div>

        <p className="text-xs text-texto-muted line-clamp-2 leading-relaxed">
          {curso.descripcion}
        </p>

        {progreso && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-texto-muted">Progreso</span>
              <span className="text-[10px] font-semibold text-mineral-400">{porcentaje.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 bg-fondo-elevado rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  completado ? 'bg-exito-500' : 'bg-gradiente-mineral',
                )}
                initial={{ width: 0 }}
                animate={{ width: `${porcentaje}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 pt-1 border-t border-fondo-borde">
          <div className="flex items-center gap-1.5 text-xs text-texto-muted">
            <Clock className="w-3.5 h-3.5" />
            {curso.duracionHoras}h
          </div>
          <div className="flex items-center gap-1.5 text-xs text-texto-muted">
            <BookOpen className="w-3.5 h-3.5" />
            {curso._count?.modulos ?? 0} módulos
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs text-mineral-400 group-hover:gap-2 transition-all">
            {progreso ? 'Continuar' : 'Iniciar'}
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
