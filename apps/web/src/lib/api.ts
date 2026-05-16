import axios from 'axios';
import Cookies from 'js-cookie';

const URL_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const clienteApi = axios.create({
  baseURL: URL_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

clienteApi.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

clienteApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const solicitudOriginal = error.config;

    if (error.response?.status === 401 && !solicitudOriginal._reintentado) {
      solicitudOriginal._reintentado = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        if (!refreshToken) throw new Error('Sin refresh token');

        const { data } = await axios.post(`${URL_BASE}/api/v1/autenticacion/renovar-token`, {
          refreshToken,
        });

        Cookies.set('accessToken', data.accessToken, { expires: 7, sameSite: 'strict' });
        solicitudOriginal.headers.Authorization = `Bearer ${data.accessToken}`;

        return clienteApi(solicitudOriginal);
      } catch {
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/iniciar-sesion';
      }
    }

    return Promise.reject(error);
  },
);
