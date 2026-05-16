import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Proveedores } from '@/componentes/proveedores';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'MinerIA — Capacitación Inteligente',
    template: '%s | MinerIA',
  },
  description:
    'Sistema enterprise de capacitación minera con IA, evaluaciones adaptativas e integración WhatsApp',
  keywords: ['minería', 'capacitación', 'IA', 'seguridad minera', 'e-learning industrial'],
  robots: { index: false, follow: false }, // No indexar — sistema interno
};

export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="bg-fondo text-texto-primario antialiased">
        <Proveedores>{children}</Proveedores>
      </body>
    </html>
  );
}
