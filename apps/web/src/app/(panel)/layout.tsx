'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarraLateral } from '@/componentes/diseno/barra-lateral';
import { BarraSuperior } from '@/componentes/diseno/barra-superior';
import { useTiendaAutenticacion } from '@/stores/tienda-autenticacion';

export default function LayoutPanel({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { usuario, estaAutenticado } = useTiendaAutenticacion();

  useEffect(() => {
    if (!estaAutenticado) {
      router.replace('/iniciar-sesion');
    }
  }, [estaAutenticado, router]);

  if (!estaAutenticado || !usuario) {
    return (
      <div className="min-h-screen bg-fondo flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-mineral-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fondo flex">
      <BarraLateral />
      <div className="flex-1 flex flex-col min-w-0 ml-64">
        <BarraSuperior />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
