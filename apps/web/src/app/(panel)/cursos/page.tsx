'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, Filter } from 'lucide-react';
import { useState } from 'react';
import { TarjetaCurso } from '@/componentes/cursos/tarjeta-curso';
import { clienteApi } from '@/lib/api';
import { useTiendaAutenticacion } from '@/stores/tienda-autenticacion';
import { Skeleton } from '@/componentes/ui/skeleton';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const NIVELES = ['Todos', 'BASICO', 'INTERMEDIO', 'AVANZADO'];

export default function PaginaCursos() {
  const { usuario } = useTiendaAutenticacion();
  const [busqueda, setBusqueda] = useState('');
  const [nivelFiltro, setNivelFiltro] = useState('Todos');

  const { data: cursos = [], isLoading } = useQuery({
    queryKey: ['cursos'],
    queryFn: () => clienteApi.get('/api/v1/cursos').then((r) => r.data.datos),
    staleTime: 2 * 60 * 1000,
  });

  const cursosFiltrados = cursos.filter((c: any) => {
    const coincideBusqueda =
      !busqueda ||
      c.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.descripcion.toLowerCase().includes(busqueda.toLowerCase());

    const coincideNivel = nivelFiltro === 'Todos' || c.nivel === nivelFiltro;

    return coincideBusqueda && coincideNivel;
  });

  const esAdmin = usuario?.rol === 'ADMIN' || usuario?.rol === 'INSTRUCTOR';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold texto-gradiente">Cursos de Capacitación</h1>
          <p className="text-texto-secundario text-sm mt-1">
            {cursosFiltrados.length} curso{cursosFiltrados.length !== 1 ? 's' : ''} disponible{cursosFiltrados.length !== 1 ? 's' : ''}
          </p>
        </div>
        {esAdmin && (
          <Link
            href="/cursos/nuevo"
            className="flex items-center gap-2 bg-mineral-500 hover:bg-mineral-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-glow-sm"
          >
            <Plus className="w-4 h-4" />
            Nuevo Curso
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-texto-muted" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar cursos..."
            className="w-full bg-fondo-tarjeta border border-fondo-borde rounded-xl pl-10 pr-4 py-2.5 text-sm text-texto-primario placeholder:text-texto-muted focus:outline-none focus:ring-2 focus:ring-mineral-500/50 focus:border-mineral-500"
          />
        </div>

        <div className="flex gap-2">
          {NIVELES.map((nivel) => (
            <button
              key={nivel}
              onClick={() => setNivelFiltro(nivel)}
              className={cn(
                'px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                nivelFiltro === nivel
                  ? 'bg-mineral-500 text-white shadow-glow-sm'
                  : 'bg-fondo-tarjeta border border-fondo-borde text-texto-secundario hover:border-mineral-500/40',
              )}
            >
              {nivel === 'Todos' ? 'Todos' : nivel.charAt(0) + nivel.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : cursosFiltrados.length === 0 ? (
        <div className="text-center py-16 text-texto-secundario">
          <Filter className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No se encontraron cursos</p>
          <p className="text-sm mt-1 text-texto-muted">Prueba cambiando los filtros de búsqueda</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.05 }}
        >
          {cursosFiltrados.map((curso: any, i: number) => (
            <motion.div
              key={curso.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
            >
              <TarjetaCurso curso={curso} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
