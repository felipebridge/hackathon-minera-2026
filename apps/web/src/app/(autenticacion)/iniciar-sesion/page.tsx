'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, HardHat, Loader2 } from 'lucide-react';
import { useAutenticacion } from '@/hooks/usar-autenticacion';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const esquemaLogin = z.object({
  email: z.string().email('Email no válido'),
  contrasena: z.string().min(6, 'Mínimo 6 caracteres'),
});

type DatosLogin = z.infer<typeof esquemaLogin>;

export default function PaginaIniciarSesion() {
  const router = useRouter();
  const { iniciarSesion } = useAutenticacion();
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosLogin>({ resolver: zodResolver(esquemaLogin) });

  const alEnviar = async (datos: DatosLogin) => {
    setCargando(true);
    try {
      await iniciarSesion(datos.email, datos.contrasena);
      toast.success('¡Bienvenido de vuelta!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.mensaje ?? 'Credenciales inválidas');
    } finally {
      setCargando(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass-intense rounded-2xl p-8 shadow-modal"
    >
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-mineral-500/10 border border-mineral-500/20 mb-4">
          <HardHat className="w-7 h-7 text-mineral-400" />
        </div>
        <h1 className="text-2xl font-bold texto-gradiente-mineral">MinerIA</h1>
        <p className="text-texto-secundario text-sm mt-1">Sistema de Capacitación Industrial</p>
      </div>

      <form onSubmit={handleSubmit(alEnviar)} className="space-y-5">
        <div>
          <label className="text-sm font-medium text-texto-secundario block mb-2">
            Correo electrónico
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="tu@empresa.com"
            className={cn(
              'w-full bg-fondo-elevado border rounded-xl px-4 py-3 text-sm',
              'text-texto-primario placeholder:text-texto-muted',
              'focus:outline-none focus:ring-2 focus:ring-mineral-500/50 focus:border-mineral-500',
              'transition-all duration-200',
              errors.email ? 'border-peligro-500' : 'border-fondo-borde',
            )}
          />
          {errors.email && (
            <p className="text-peligro-400 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-texto-secundario block mb-2">
            Contraseña
          </label>
          <div className="relative">
            <input
              {...register('contrasena')}
              type={mostrarContrasena ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={cn(
                'w-full bg-fondo-elevado border rounded-xl px-4 py-3 pr-11 text-sm',
                'text-texto-primario placeholder:text-texto-muted',
                'focus:outline-none focus:ring-2 focus:ring-mineral-500/50 focus:border-mineral-500',
                'transition-all duration-200',
                errors.contrasena ? 'border-peligro-500' : 'border-fondo-borde',
              )}
            />
            <button
              type="button"
              onClick={() => setMostrarContrasena(!mostrarContrasena)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-texto-muted hover:text-texto-secundario transition-colors"
            >
              {mostrarContrasena ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.contrasena && (
            <p className="text-peligro-400 text-xs mt-1">{errors.contrasena.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={cargando}
          className={cn(
            'w-full bg-mineral-500 hover:bg-mineral-600 text-white',
            'font-semibold py-3 px-6 rounded-xl',
            'flex items-center justify-center gap-2',
            'transition-all duration-200',
            'shadow-glow-sm hover:shadow-glow-mineral',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          )}
        >
          {cargando ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Ingresando...
            </>
          ) : (
            'Ingresar al sistema'
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-fondo-elevado rounded-xl border border-fondo-borde">
        <p className="text-xs font-medium text-texto-secundario mb-3">Accesos de demostración:</p>
        <div className="space-y-1.5">
          {[
            { rol: 'Admin', email: 'admin@mineria.com', pass: 'Admin2024!' },
            { rol: 'Instructor', email: 'instructor@mineria.com', pass: 'Instructor2024!' },
            { rol: 'Empleado', email: 'operario@mineria.com', pass: 'Operario2024!' },
          ].map((c) => (
            <div key={c.rol} className="flex items-center gap-2 text-xs text-texto-muted">
              <span className="w-16 text-mineral-400 font-medium">{c.rol}:</span>
              <span className="font-mono">{c.email}</span>
              <span className="text-texto-terciario">/</span>
              <span className="font-mono">{c.pass}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
