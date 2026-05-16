'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  MessageSquare,
  FileText,
  BarChart3,
  Cpu,
  Settings,
  LogOut,
  HardHat,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTiendaAutenticacion } from '@/stores/tienda-autenticacion';

interface ItemNavegacion {
  etiqueta: string;
  icono: React.ElementType;
  href: string;
  soloAdmin?: boolean;
  soloInstructor?: boolean;
  soloEmpleado?: boolean;
  destacado?: boolean;
  badge?: number;
}

const ITEMS_NAVEGACION: ItemNavegacion[] = [
  {
    etiqueta: 'Mi Inducción',
    icono: GraduationCap,
    href: '/induccion',
    soloEmpleado: true,
    destacado: true,
  },
  { etiqueta: 'Dashboard', icono: LayoutDashboard, href: '/dashboard' },
  { etiqueta: 'Mis Cursos', icono: BookOpen, href: '/cursos' },
  { etiqueta: 'Experto IA 24/7', icono: MessageSquare, href: '/asistente' },
  { etiqueta: 'Simulaciones VR', icono: Cpu, href: '/simulaciones' },
  { etiqueta: 'Métricas', icono: BarChart3, href: '/metricas', soloAdmin: true },
  { etiqueta: 'Usuarios', icono: Users, href: '/usuarios', soloAdmin: true },
  { etiqueta: 'Documentos', icono: FileText, href: '/documentos', soloInstructor: true },
];

export function BarraLateral() {
  const pathname = usePathname();
  const router = useRouter();
  const { usuario, cerrarSesion } = useTiendaAutenticacion();

  const esAdmin = usuario?.rol === 'ADMIN';
  const esInstructor = usuario?.rol === 'ADMIN' || usuario?.rol === 'INSTRUCTOR';
  const esEmpleado = usuario?.rol === 'EMPLEADO';

  const itemsVisibles = ITEMS_NAVEGACION.filter((item) => {
    if (item.soloAdmin && !esAdmin) return false;
    if (item.soloInstructor && !esInstructor) return false;
    if (item.soloEmpleado && !esEmpleado) return false;
    return true;
  });

  const alCerrarSesion = () => {
    cerrarSesion();
    router.push('/iniciar-sesion');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-fondo-secundario border-r border-fondo-borde flex flex-col z-40">
      <div className="p-5 border-b border-fondo-borde">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-mineral-500/10 border border-mineral-500/20 flex items-center justify-center">
            <HardHat className="w-5 h-5 text-mineral-400" />
          </div>
          <div>
            <p className="text-sm font-bold texto-gradiente-mineral leading-none">MinerIA</p>
            <p className="text-[10px] text-texto-muted mt-0.5">Inducción Inteligente</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {itemsVisibles.map((item) => {
          const Icono = item.icono;
          const activo = pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} className="block">
              <div
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  activo
                    ? 'bg-mineral-500/15 text-mineral-300 border border-mineral-500/20'
                    : item.destacado
                    ? 'text-mineral-300 bg-mineral-500/10 border border-mineral-500/20 hover:bg-mineral-500/20'
                    : 'text-texto-secundario hover:bg-fondo-elevado hover:text-texto-primario border border-transparent',
                )}
              >
                {activo && (
                  <motion.div
                    layoutId="indicador-nav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-mineral-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icono
                  className={cn(
                    'w-4.5 h-4.5 flex-shrink-0',
                    activo ? 'text-mineral-400' : 'text-texto-muted',
                  )}
                />
                <span>{item.etiqueta}</span>
                {activo && <ChevronRight className="w-3.5 h-3.5 ml-auto text-mineral-400 opacity-60" />}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-fondo-borde space-y-2">
        <Link href="/configuracion">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-texto-secundario hover:bg-fondo-elevado hover:text-texto-primario transition-all border border-transparent cursor-pointer">
            <Settings className="w-4 h-4 text-texto-muted" />
            Configuración
          </div>
        </Link>

        <div className="flex items-center gap-3 px-3 py-2.5 bg-fondo-elevado rounded-xl border border-fondo-borde">
          <div className="w-8 h-8 rounded-full bg-mineral-500/20 flex items-center justify-center text-xs font-bold text-mineral-400">
            {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-texto-primario truncate">
              {usuario?.nombre} {usuario?.apellido}
            </p>
            <p className="text-xs text-texto-muted truncate">{usuario?.rol}</p>
          </div>
          <button
            onClick={alCerrarSesion}
            className="p-1.5 rounded-lg text-texto-muted hover:text-peligro-400 hover:bg-peligro-400/10 transition-all"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
