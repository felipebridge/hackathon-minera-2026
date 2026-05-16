'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Headset,
  Shield,
  Clock,
  Star,
  Play,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Eye,
  Target,
  ChevronRight,
  Wifi,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clienteApi } from '@/lib/api';
import { Skeleton } from '@/componentes/ui/skeleton';

interface Simulacion {
  id: string;
  titulo: string;
  descripcion: string;
  escenario: string;
  nivel: 'BASICO' | 'INTERMEDIO' | 'AVANZADO';
  estado: 'DESARROLLO' | 'DISPONIBLE' | 'MANTENIMIENTO';
  sdkRequerido: string;
  duracionMinutos: number;
  objetivosVR: string[];
}

const ETIQUETAS_NIVEL: Record<string, { texto: string; clase: string }> = {
  BASICO: { texto: 'Básico', clase: 'bg-exito-500/15 text-exito-400 border-exito-500/20' },
  INTERMEDIO: { texto: 'Intermedio', clase: 'bg-cobre-500/15 text-cobre-400 border-cobre-500/20' },
  AVANZADO: { texto: 'Avanzado', clase: 'bg-peligro-400/15 text-peligro-400 border-peligro-400/20' },
};

const NOMBRES_ESCENARIO: Record<string, string> = {
  tajo_abierto: 'Tajo abierto',
  interior_mina: 'Minería subterránea',
  planta_procesamiento: 'Planta de procesamiento',
  talleres: 'Área de talleres',
};

const varianteContenedor = {
  oculto: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09 } },
};

const varianteTarjeta = {
  oculto: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function PaginaSimulaciones() {
  const { data: simulaciones, isLoading } = useQuery<Simulacion[]>({
    queryKey: ['simulaciones'],
    queryFn: () => clienteApi.get('/api/v1/simulaciones').then((r) => r.data.datos),
  });

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-2xl font-bold texto-gradiente-mineral">Simulaciones VR</h1>
        <p className="text-texto-secundario text-sm">
          Entrena en entornos mineros realistas con Meta Quest 2 sin exponerte a riesgos reales.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-2xl border border-cobre-500/25 bg-gradient-to-r from-cobre-500/10 via-cobre-500/5 to-transparent p-6"
      >
        <div className="absolute top-0 right-0 w-64 h-full opacity-10">
          <div className="w-full h-full bg-gradient-to-l from-cobre-500 to-transparent" />
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cobre-500/20 border border-cobre-500/30 flex items-center justify-center">
                <Shield className="w-4 h-4 text-cobre-400" />
              </div>
              <span className="text-cobre-300 font-bold text-sm uppercase tracking-wider">
                Principio de Falla Segura
              </span>
            </div>
            <p className="text-texto-primario font-medium leading-relaxed">
              En minería, los errores en el trabajo real cuestan vidas. La VR cambia eso:
              puedes{' '}
              <span className="text-cobre-300 font-semibold">
                cometer errores sin consecuencias reales
              </span>
              , aprender de ellos, y llegar a la faena con experiencia práctica.
            </p>
            <p className="text-sm text-texto-secundario">
              Cada simulación recrea situaciones reales de riesgo — gases tóxicos, derrumbes,
              fallos eléctricos — en un entorno donde equivocarse es parte del aprendizaje.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-texto-muted uppercase tracking-wider">
              Tecnología requerida
            </p>
            <div className="space-y-2">
              {[
                { icono: Headset, texto: 'Meta Quest 2', desc: 'Headset VR' },
                { icono: Eye, texto: '6 Grados de libertad', desc: 'Movimiento completo' },
                { icono: Wifi, texto: 'Hand tracking', desc: 'Sin controladores' },
                { icono: Zap, texto: 'SDK 60.0+', desc: 'OpenXR compatible' },
              ].map((item) => {
                const Ic = item.icono;
                return (
                  <div key={item.texto} className="flex items-center gap-2.5 text-xs">
                    <div className="w-6 h-6 rounded-md bg-cobre-500/15 flex items-center justify-center flex-shrink-0">
                      <Ic className="w-3.5 h-3.5 text-cobre-400" />
                    </div>
                    <div>
                      <span className="font-medium text-texto-primario">{item.texto}</span>
                      <span className="text-texto-muted"> — {item.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {[
          {
            numero: '01',
            titulo: 'Recibe el equipo',
            desc: 'Tu instructor te entrega el Meta Quest 2 cargado y configurado.',
          },
          {
            numero: '02',
            titulo: 'Explora el entorno',
            desc: 'Recorre virtualmente tu área de trabajo y aprende la señalización.',
          },
          {
            numero: '03',
            titulo: 'Enfrenta situaciones',
            desc: 'El sistema genera eventos de riesgo que debes resolver correctamente.',
          },
          {
            numero: '04',
            titulo: 'Obtén tu puntaje',
            desc: 'Con 70%+ apruebas y avanzas al examen obligatorio de inducción.',
          },
        ].map((paso) => (
          <div
            key={paso.numero}
            className="tarjeta-base p-4 space-y-2"
          >
            <span className="text-2xl font-black texto-gradiente-mineral opacity-60">
              {paso.numero}
            </span>
            <p className="text-xs font-semibold text-texto-primario">{paso.titulo}</p>
            <p className="text-[11px] text-texto-muted leading-relaxed">{paso.desc}</p>
          </div>
        ))}
      </motion.div>

      <div>
        <h2 className="text-sm font-semibold text-texto-secundario uppercase tracking-wider mb-4">
          Simulaciones disponibles
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        ) : (
          <motion.div
            variants={varianteContenedor}
            initial="oculto"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {(simulaciones ?? SIMULACIONES_DEMO).map((sim) => (
              <TarjetaSimulacion key={sim.id} simulacion={sim} />
            ))}
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="tarjeta-base p-6"
      >
        <h3 className="text-sm font-semibold text-texto-primario mb-5 flex items-center gap-2">
          <Target className="w-4 h-4 text-mineral-400" />
          Por qué la VR es más efectiva que el video o el manual
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              metrica: '70%',
              descripcion: 'Tasa de retención con VR inmersiva',
              vs: 'vs 10% con texto impreso',
              color: 'text-exito-400',
            },
            {
              metrica: '4×',
              descripcion: 'Más rápido en completar la inducción',
              vs: 'vs proceso tradicional de 8h',
              color: 'text-cobre-400',
            },
            {
              metrica: '0',
              descripcion: 'Riesgo físico durante el aprendizaje',
              vs: 'el principio de falla segura',
              color: 'text-mineral-400',
            },
          ].map((stat) => (
            <div key={stat.metrica} className="text-center space-y-1">
              <p className={cn('text-4xl font-black', stat.color)}>{stat.metrica}</p>
              <p className="text-sm font-medium text-texto-primario">{stat.descripcion}</p>
              <p className="text-xs text-texto-muted">{stat.vs}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function TarjetaSimulacion({ simulacion }: { simulacion: Simulacion }) {
  const nivel = ETIQUETAS_NIVEL[simulacion.nivel] ?? ETIQUETAS_NIVEL.BASICO;
  const disponible = simulacion.estado === 'DISPONIBLE';
  const escenarioNombre = NOMBRES_ESCENARIO[simulacion.escenario] ?? simulacion.escenario;

  return (
    <motion.div variants={varianteTarjeta}>
      <div className="tarjeta-base overflow-hidden hover:-translate-y-1 transition-transform duration-300 cursor-pointer group">
        <div className="relative h-32 bg-gradient-to-br from-fondo-elevado to-fondo-borde overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20h40M20 0v40' stroke='%233D5AFE' stroke-width='0.5'/%3E%3C/svg%3E")`,
            }}
          />

          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                disponible ? 'bg-exito-400 animate-pulse' : 'bg-yellow-500',
              )}
            />
            <span className="text-[10px] font-medium text-texto-muted uppercase">
              {disponible ? 'Disponible' : simulacion.estado.toLowerCase()}
            </span>
          </div>

          <div
            className={cn(
              'absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold border',
              nivel.clase,
            )}
          >
            {nivel.texto}
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-cobre-500/10 border border-cobre-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Headset className="w-8 h-8 text-cobre-400" />
            </div>
          </div>

          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-fondo-primario/80 border border-fondo-borde backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-cobre-400" />
            <span className="text-[10px] font-medium text-texto-muted">
              {simulacion.sdkRequerido ?? 'meta-quest-2'}
            </span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold text-texto-primario leading-snug">
                {simulacion.titulo}
              </h3>
              <div className="flex items-center gap-1 flex-shrink-0 text-xs text-texto-muted">
                <Clock className="w-3 h-3" />
                <span>{simulacion.duracionMinutos}min</span>
              </div>
            </div>
            <p className="text-xs text-texto-muted mt-0.5">{escenarioNombre}</p>
          </div>

          <p className="text-xs text-texto-secundario leading-relaxed line-clamp-2">
            {simulacion.descripcion}
          </p>

          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-texto-muted uppercase tracking-wider">
              Objetivos de aprendizaje
            </p>
            {simulacion.objetivosVR.slice(0, 3).map((obj, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-texto-secundario">
                <CheckCircle2 className="w-3 h-3 text-exito-400 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{obj}</span>
              </div>
            ))}
            {simulacion.objetivosVR.length > 3 && (
              <p className="text-[10px] text-texto-muted pl-4.5">
                +{simulacion.objetivosVR.length - 3} objetivos más
              </p>
            )}
          </div>

          <button
            disabled={!disponible}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all',
              disponible
                ? 'bg-cobre-500/15 border border-cobre-500/25 text-cobre-300 hover:bg-cobre-500/25'
                : 'bg-fondo-borde border border-fondo-borde text-texto-muted cursor-not-allowed',
            )}
          >
            {disponible ? (
              <>
                <Play className="w-4 h-4" />
                Iniciar simulación VR
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                En mantenimiento
              </>
            )}
          </button>

          <p className="text-center text-[10px] text-texto-muted">
            Puntaje mínimo requerido: <span className="text-cobre-400 font-semibold">70%</span>
            {' '}· Máx. 5 intentos
          </p>
        </div>
      </div>
    </motion.div>
  );
}

const SIMULACIONES_DEMO: Simulacion[] = [
  {
    id: 'sim-induccion-tajo-001',
    titulo: 'Inducción VR: Primer Día en el Pit',
    descripcion:
      'Simulación de inducción completa para nuevos empleados en tajo abierto. Recorre el área, identifica zonas de riesgo y practica protocolos de emergencia en entorno seguro.',
    escenario: 'tajo_abierto',
    nivel: 'BASICO',
    estado: 'DISPONIBLE',
    sdkRequerido: 'meta-quest-2',
    duracionMinutos: 25,
    objetivosVR: [
      'Reconocer la señalización de seguridad del área de tajo',
      'Identificar y usar correctamente el EPP para cada zona',
      'Practicar el protocolo de comunicación de radios de emergencia',
      'Responder correctamente ante una simulación de derrumbe de talud',
      'Localizar puntos de evacuación y zonas de reunión',
    ],
  },
  {
    id: 'sim-induccion-subterranea-001',
    titulo: 'Inducción VR: Operaciones Subterráneas',
    descripcion:
      'Recorrido de inducción por galería subterránea. Experimenta situaciones de riesgo controladas y aplica los procedimientos correctos de seguridad.',
    escenario: 'interior_mina',
    nivel: 'BASICO',
    estado: 'DISPONIBLE',
    sdkRequerido: 'meta-quest-2',
    duracionMinutos: 30,
    objetivosVR: [
      'Detectar presencia de gases tóxicos con detector virtual',
      'Ejecutar evacuación de galería en condiciones de visibilidad reducida',
      'Aplicar protocolo de bloqueo y etiquetado (LOTO) en equipo eléctrico',
      'Reportar condición sub-estándar mediante observación preventiva',
    ],
  },
];
