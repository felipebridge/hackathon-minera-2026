import { useTiendaAutenticacion } from '@/stores/tienda-autenticacion';
import { clienteApi } from '@/lib/api';

export function useAutenticacion() {
  const { iniciarSesion, cerrarSesion, usuario, estaAutenticado } = useTiendaAutenticacion();

  const iniciarSesionConEmail = async (email: string, contrasena: string) => {
    const { data } = await clienteApi.post('/api/v1/autenticacion/iniciar-sesion', {
      email,
      contrasena,
    });

    if (data.exito) {
      iniciarSesion({
        usuario: data.usuario,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    }

    return data;
  };

  return {
    iniciarSesion: iniciarSesionConEmail,
    cerrarSesion,
    usuario,
    estaAutenticado,
    esAdmin: usuario?.rol === 'ADMIN',
    esInstructor: usuario?.rol === 'ADMIN' || usuario?.rol === 'INSTRUCTOR',
  };
}
