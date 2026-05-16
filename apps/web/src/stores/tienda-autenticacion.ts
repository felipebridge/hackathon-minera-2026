import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { clienteApi } from '@/lib/api';

interface UsuarioSesion {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'ADMIN' | 'INSTRUCTOR' | 'EMPLEADO';
  avatarUrl?: string;
  cargo?: string;
  area?: string;
}

interface EstadoAutenticacion {
  usuario: UsuarioSesion | null;
  accessToken: string | null;
  refreshToken: string | null;
  estaAutenticado: boolean;
  iniciarSesion: (datos: { usuario: UsuarioSesion; accessToken: string; refreshToken: string }) => void;
  cerrarSesion: () => void;
  actualizarUsuario: (datos: Partial<UsuarioSesion>) => void;
}

export const useTiendaAutenticacion = create<EstadoAutenticacion>()(
  persist(
    (set, get) => ({
      usuario: null,
      accessToken: null,
      refreshToken: null,
      estaAutenticado: false,

      iniciarSesion: ({ usuario, accessToken, refreshToken }) => {
        Cookies.set('accessToken', accessToken, { expires: 7, sameSite: 'strict' });
        Cookies.set('refreshToken', refreshToken, { expires: 30, sameSite: 'strict' });

        set({ usuario, accessToken, refreshToken, estaAutenticado: true });
      },

      cerrarSesion: () => {
        const { refreshToken } = get();

        if (refreshToken) {
          clienteApi
            .post('/api/v1/autenticacion/cerrar-sesion', { refreshToken })
            .catch(() => null); // el logout local no debe bloquearse si el backend falla
        }

        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');

        set({ usuario: null, accessToken: null, refreshToken: null, estaAutenticado: false });
      },

      actualizarUsuario: (datos) => {
        set((estado) => ({
          usuario: estado.usuario ? { ...estado.usuario, ...datos } : null,
        }));
      },
    }),
    {
      name: 'mineria-sesion',
      partialize: (estado) => ({
        usuario: estado.usuario,
        estaAutenticado: estado.estaAutenticado,
        // los tokens no se persisten aquí — viven en cookies
      }),
    },
  ),
);
