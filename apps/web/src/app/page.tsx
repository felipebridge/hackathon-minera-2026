import { redirect } from 'next/navigation';

// Redirigir la raíz al dashboard si hay sesión, o al login
export default function PaginaRaiz() {
  redirect('/dashboard');
}
