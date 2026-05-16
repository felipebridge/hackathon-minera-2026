'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, HardHat } from 'lucide-react';
import { useTiendaAutenticacion } from '@/stores/tienda-autenticacion';

const TITULOS_RUTA: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/induccion': 'Mi Inducción',
  '/cursos': 'Cursos de Capacitación',
  '/asistente': 'Asistente IA',
  '/metricas': 'Métricas y Analytics',
  '/usuarios': 'Gestión de Usuarios',
  '/documentos': 'Base Documental',
  '/simulaciones': 'Simulaciones VR',
  '/configuracion': 'Configuración',
};

export function BarraSuperior() {
  const pathname = usePathname();
  const { usuario } = useTiendaAutenticacion();

  const titulo = TITULOS_RUTA[pathname] ?? 'Panel de Control';

  return (
    <header className="sticky top-0 z-30 bg-fondo-secundario/80 backdrop-blur-sm border-b border-fondo-borde px-6 py-4">
      <div className="flex items-center gap-4">
        <h2 className="text-base font-semibold text-texto-primario">{titulo}</h2>

        <div className="flex-1" />

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-texto-muted" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-fondo-tarjeta border border-fondo-borde rounded-lg pl-9 pr-4 py-2 text-xs text-texto-primario placeholder:text-texto-muted w-52 focus:outline-none focus:ring-1 focus:ring-mineral-500/50"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-texto-muted bg-fondo-borde px-1 rounded">
            ⌘K
          </kbd>
        </div>

        <button className="relative p-2 rounded-lg text-texto-muted hover:text-texto-primario hover:bg-fondo-elevado transition-all">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-peligro-500" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-fondo-borde">
          <div className="w-8 h-8 rounded-full bg-mineral-500/20 flex items-center justify-center text-xs font-bold text-mineral-400">
            {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-medium text-texto-primario leading-none">
              {usuario?.nombre} {usuario?.apellido}
            </p>
            <p className="text-[10px] text-texto-muted mt-0.5">{usuario?.cargo ?? usuario?.rol}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
