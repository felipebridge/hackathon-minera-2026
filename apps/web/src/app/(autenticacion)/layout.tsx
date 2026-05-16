import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
};

export default function LayoutAutenticacion({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-fondo bg-malla-industrial flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-mineral-700/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-mineral-800/10 blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
