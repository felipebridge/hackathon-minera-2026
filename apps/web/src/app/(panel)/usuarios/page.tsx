'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, UserPlus, MoreVertical, Shield, UserCheck, UserX, Clock } from 'lucide-react';
import { clienteApi } from '@/lib/api';
import { Skeleton } from '@/componentes/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatearFecha } from '@/lib/fecha';
import toast from 'react-hot-toast';

const COLORES_ROL = {
  ADMIN: 'bg-peligro-500/10 text-peligro-400 border-peligro-500/20',
  INSTRUCTOR: 'bg-cobre-500/10 text-cobre-400 border-cobre-500/20',
  EMPLEADO: 'bg-mineral-500/10 text-mineral-400 border-mineral-500/20',
};

export default function PaginaUsuarios() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['usuarios', pagina, busqueda],
    queryFn: () =>
      clienteApi
        .get('/api/v1/usuarios', { params: { pagina, busqueda: busqueda || undefined } })
        .then((r) => r.data.datos),
    staleTime: 60 * 1000,
  });

  const { mutate: cambiarEstado } = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      clienteApi.patch(`/api/v1/usuarios/${id}/estado`, { estado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Estado actualizado correctamente');
    },
    onError: () => toast.error('No se pudo actualizar el estado'),
  });

  const usuarios = data?.usuarios ?? [];
  const totalPaginas = data?.paginas ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold texto-gradiente">Gestión de Usuarios</h1>
          <p className="text-texto-secundario text-sm mt-1">
            {data?.total ?? 0} usuario{data?.total !== 1 ? 's' : ''} en el sistema
          </p>
        </div>
        <button className="flex items-center gap-2 bg-mineral-500 hover:bg-mineral-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-glow-sm">
          <UserPlus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-texto-muted" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
          placeholder="Buscar por nombre, apellido o email..."
          className="w-full max-w-md bg-fondo-tarjeta border border-fondo-borde rounded-xl pl-10 pr-4 py-2.5 text-sm text-texto-primario placeholder:text-texto-muted focus:outline-none focus:ring-2 focus:ring-mineral-500/50"
        />
      </div>

      <div className="bg-fondo-tarjeta border border-fondo-borde rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-fondo-borde bg-fondo-elevado/50">
                {['Usuario', 'Rol', 'Área', 'Estado', 'Último acceso', 'Acciones'].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-texto-muted uppercase tracking-wider px-5 py-3.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-fondo-borde">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <Skeleton className="h-4 w-full rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                : usuarios.map((u: any) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-fondo-elevado/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-mineral-500/20 flex items-center justify-center text-sm font-semibold text-mineral-400">
                            {u.nombre[0]}{u.apellido[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-texto-primario">
                              {u.nombre} {u.apellido}
                            </p>
                            <p className="text-xs text-texto-muted">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('text-xs font-medium px-2.5 py-1 rounded-md border', COLORES_ROL[u.rol as keyof typeof COLORES_ROL])}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-texto-secundario">{u.area ?? '—'}</p>
                        <p className="text-xs text-texto-muted">{u.cargo ?? ''}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn(
                          'flex items-center gap-1.5 text-xs font-medium w-fit',
                          u.estado === 'ACTIVO' ? 'text-exito-400' : 'text-texto-muted',
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', u.estado === 'ACTIVO' ? 'bg-exito-400' : 'bg-texto-muted')} />
                          {u.estado}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs text-texto-muted">
                          {u.ultimoAcceso ? formatearFecha(new Date(u.ultimoAcceso)) : 'Nunca'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {u.estado === 'ACTIVO' ? (
                            <button
                              onClick={() => cambiarEstado({ id: u.id, estado: 'INACTIVO' })}
                              className="p-1.5 rounded-lg text-texto-muted hover:text-peligro-400 hover:bg-peligro-400/10 transition-all"
                              title="Desactivar"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => cambiarEstado({ id: u.id, estado: 'ACTIVO' })}
                              className="p-1.5 rounded-lg text-texto-muted hover:text-exito-400 hover:bg-exito-400/10 transition-all"
                              title="Activar"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-fondo-borde">
            <p className="text-xs text-texto-muted">Página {pagina} de {totalPaginas}</p>
            <div className="flex gap-2">
              <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={pagina === 1} className="px-3 py-1.5 text-xs bg-fondo-elevado border border-fondo-borde rounded-lg text-texto-secundario hover:border-mineral-500/40 disabled:opacity-40 transition-all">
                Anterior
              </button>
              <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="px-3 py-1.5 text-xs bg-fondo-elevado border border-fondo-borde rounded-lg text-texto-secundario hover:border-mineral-500/40 disabled:opacity-40 transition-all">
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
