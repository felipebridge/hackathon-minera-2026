'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Headset,
  ClipboardCheck,
  MessageSquare,
  CheckCircle2,
  Clock,
  ChevronRight,
  Trophy,
  AlertCircle,
  Play,
  BookOpen,
  PhoneCall,
  Star,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clienteApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

type EtapaId = 'CHARLA_INTRODUCTORIA' | 'SIMULACION_VR' | 'EXAMEN_OBLIGATORIO' | 'EXPERTO_IA';
type EstadoInduccion = 'EN_CURSO' | 'COMPLETADA' | 'SUSPENDIDA' | 'REPROBADA';

interface InduccionData {
  id: string;
  estado: EstadoInduccion;
  etapaActual: EtapaId;
  charlaCompletada: boolean;
  charlaCompletadaEn: string | null;
  vrCompletado: boolean;
  vrCompletadoEn: string | null;
  vrPuntaje: number | null;
  vrIntentos: number;
  examenAprobado: boolean;
  examenAprobadoEn: string | null;
  examenPuntaje: number | null;
  examenIntentos: number;
  completadaEn: string | null;
  tiempoTotalHoras: number | null;
  instructor: { nombre: string; apellido: string } | null;
}

const ETAPAS_INDUCCION = [
  {
    id: 'CHARLA_INTRODUCTORIA' as EtapaId,
    numero: 1,
    titulo: 'Charla Introductoria',
    subtitulo: 'Con instructor especializado',
    descripcion:
      'Sesión presencial reducida con tu instructor asignado. Se cubre el marco legal minero, mapa de instalaciones, zonas de riesgo y reglas fundamentales de convivencia segura en la faena.',
    duracion: '~1 hora',
    icono: GraduationCap,
    colorClase: 'mineral',
    beneficio: 'Reducida de 8h a 1h gracias a VR e IA',
    accion: 'Marcar como completada',
  },
  {
    id: 'SIMULACION_VR' as EtapaId,
    numero: 2,
    titulo: 'Simulación VR',
    subtitulo: 'Meta Quest 2 — Falla segura',
    descripcion:
      'Recorre virtualmente la faena en Meta Quest 2. Experimenta situaciones de riesgo reales (derrumbes, gases, emergencias) sin peligro físico. El principio de "falla segura": aprender de los errores sin consecuencias reales.',
    duracion: '25-30 min',
    icono: Headset,
    colorClase: 'cobre',
    beneficio: 'Experiencia inmersiva 6DOF con hand tracking',
    accion: 'Iniciar simulación',
  },
  {
    id: 'EXAMEN_OBLIGATORIO' as EtapaId,
    numero: 3,
    titulo: 'Examen Obligatorio',
    subtitulo: 'Mínimo 70% para aprobar',
    descripcion:
      'Evaluación de conocimientos obligatoria antes de acceder a la faena. Cubre el Decreto 249/07, identificación de peligros específicos de tu área y protocolos de emergencia. Máximo 3 intentos.',
    duracion: '30 min',
    icono: ClipboardCheck,
    colorClase: 'advertencia',
    beneficio: 'Preguntas adaptadas a tu rol y área de trabajo',
    accion: 'Comenzar examen',
  },
  {
    id: 'EXPERTO_IA' as EtapaId,
    numero: 4,
    titulo: 'Experto Minero IA 24/7',
    subtitulo: 'WhatsApp + Web · Siempre disponible',
    descripcion:
      'Una vez completado el proceso, tienes acceso permanente al asistente IA especializado. Resuelve dudas en campo vía WhatsApp, consulta normativas, procedimientos y protocolos en tiempo real sin esperar a tu supervisor.',
    duracion: 'Acceso permanente',
    icono: MessageSquare,
    colorClase: 'exito',
    beneficio: 'Respuestas basadas en documentación oficial de tu empresa',
    accion: 'Abrir asistente',
  },
];

const COLORES_ETAPA: Record<string, { bg: string; borde: string; texto: string; icono: string }> = {
  mineral: {
    bg: 'bg-mineral-500/10',
    borde: 'border-mineral-500/30',
    texto: 'text-mineral-300',
    icono: 'text-mineral-400',
  },
  cobre: {
    bg: 'bg-cobre-500/10',
    borde: 'border-cobre-500/30',
    texto: 'text-cobre-300',
    icono: 'text-cobre-400',
  },
  advertencia: {
    bg: 'bg-yellow-500/10',
    borde: 'border-yellow-500/30',
    texto: 'text-yellow-300',
    icono: 'text-yellow-400',
  },
  exito: {
    bg: 'bg-exito-500/10',
    borde: 'border-exito-500/30',
    texto: 'text-exito-300',
    icono: 'text-exito-400',
  },
};

function estadoEtapa(
  etapaId: EtapaId,
  induccion: InduccionData | null,
): 'completada' | 'activa' | 'bloqueada' {
  if (!induccion) return etapaId === 'CHARLA_INTRODUCTORIA' ? 'activa' : 'bloqueada';

  const completadas: Record<EtapaId, boolean> = {
    CHARLA_INTRODUCTORIA: induccion.charlaCompletada,
    SIMULACION_VR: induccion.vrCompletado,
    EXAMEN_OBLIGATORIO: induccion.examenAprobado,
    EXPERTO_IA: induccion.estado === 'COMPLETADA',
  };

  if (completadas[etapaId]) return 'completada';
  if (induccion.etapaActual === etapaId) return 'activa';
  return 'bloqueada';
}

export default function PaginaInduccion() {
  const queryClient = useQueryClient();

  const { data: induccion, isLoading } = useQuery<InduccionData>({
    queryKey: ['mi-induccion'],
    queryFn: () =>
      clienteApi.get('/api/v1/induccion/mi-induccion').then((r) => r.data.datos),
  });

  const mutacionIniciar = useMutation({
    mutationFn: () => clienteApi.post('/api/v1/induccion/iniciar').then((r) => r.data),
    onSuccess: () => {
      toast.success('Inducción iniciada. ¡Bienvenido al equipo!');
      queryClient.invalidateQueries({ queryKey: ['mi-induccion'] });
    },
  });

  const porcentajeProgreso = induccion
    ? ([
        induccion.charlaCompletada,
        induccion.vrCompletado,
        induccion.examenAprobado,
        induccion.estado === 'COMPLETADA',
      ].filter(Boolean).length /
        4) *
      100
    : 0;

  const estaCompletada = induccion?.estado === 'COMPLETADA';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2 text-texto-muted text-sm">
          <BookOpen className="w-4 h-4" />
          <span>Proceso de inducción obligatorio</span>
        </div>
        <h1 className="text-3xl font-bold texto-gradiente-mineral">
          Mi Inducción Minera
        </h1>
        <p className="text-texto-secundario">
          Completa las 4 etapas para obtener tu habilitación de acceso a faena.
          Este proceso reemplaza la inducción tradicional de 8 horas con una experiencia
          más efectiva, segura y moderna.
        </p>
      </motion.div>

      <AnimatePresence>
        {estaCompletada && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-2xl border border-exito-500/30 bg-exito-500/10 p-6"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-exito-500/5 to-transparent" />
            <div className="relative flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-exito-500/20 border border-exito-500/30 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-7 h-7 text-exito-400" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-exito-300">
                  ¡Inducción completada con éxito!
                </p>
                <p className="text-sm text-texto-secundario mt-0.5">
                  Estás habilitado para acceder a la faena. Tiempo total:{' '}
                  <span className="text-exito-300 font-medium">
                    {induccion?.tiempoTotalHoras?.toFixed(1)}h
                  </span>
                  {' '}vs 8h de inducción tradicional.
                </p>
              </div>
              <Link href="/asistente">
                <button className="px-4 py-2 rounded-xl bg-exito-500/20 border border-exito-500/30 text-exito-300 text-sm font-medium hover:bg-exito-500/30 transition-all">
                  Consultar IA 24/7
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="tarjeta-base p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-mineral-400" />
            <span className="text-sm font-medium text-texto-primario">
              Progreso de inducción
            </span>
          </div>
          <span className="text-xl font-bold texto-gradiente-mineral">
            {porcentajeProgreso.toFixed(0)}%
          </span>
        </div>
        <div className="h-2.5 bg-fondo-borde rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-mineral-600 to-mineral-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${porcentajeProgreso}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {ETAPAS_INDUCCION.map((e, i) => (
            <span
              key={e.id}
              className={cn(
                'text-xs',
                estadoEtapa(e.id, induccion ?? null) === 'completada'
                  ? 'text-exito-400'
                  : estadoEtapa(e.id, induccion ?? null) === 'activa'
                  ? 'text-mineral-300'
                  : 'text-texto-muted',
              )}
            >
              {i + 1}. {e.titulo.split(' ')[0]}
            </span>
          ))}
        </div>
      </motion.div>

      {induccion?.instructor && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-fondo-borde bg-fondo-elevado"
        >
          <div className="w-9 h-9 rounded-full bg-mineral-500/20 flex items-center justify-center text-xs font-bold text-mineral-400">
            {induccion.instructor.nombre[0]}{induccion.instructor.apellido[0]}
          </div>
          <div>
            <p className="text-sm font-medium text-texto-primario">
              {induccion.instructor.nombre} {induccion.instructor.apellido}
            </p>
            <p className="text-xs text-texto-muted">Instructor asignado a tu inducción</p>
          </div>
          <PhoneCall className="w-4 h-4 text-texto-muted ml-auto" />
        </motion.div>
      )}

      {!isLoading && !induccion && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="tarjeta-base p-8 text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-mineral-500/10 border border-mineral-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-mineral-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-texto-primario">
              Tu inducción aún no ha sido iniciada
            </p>
            <p className="text-sm text-texto-secundario mt-1">
              Un administrador debe asignarte un instructor para comenzar el proceso.
            </p>
          </div>
          <button
            onClick={() => mutacionIniciar.mutate()}
            disabled={mutacionIniciar.isPending}
            className="px-6 py-2.5 rounded-xl bg-mineral-500 text-white font-medium hover:bg-mineral-600 transition-all disabled:opacity-50"
          >
            {mutacionIniciar.isPending ? 'Iniciando...' : 'Solicitar inicio de inducción'}
          </button>
        </motion.div>
      )}

      <div className="space-y-4">
        {ETAPAS_INDUCCION.map((etapa, idx) => {
          const estado = estadoEtapa(etapa.id, induccion ?? null);
          const Icono = etapa.icono;
          const colores = COLORES_ETAPA[etapa.colorClase];

          return (
            <motion.div
              key={etapa.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.08 }}
              className={cn(
                'tarjeta-base overflow-hidden transition-all duration-300',
                estado === 'activa' && 'ring-1 ring-mineral-500/30',
                estado === 'bloqueada' && 'opacity-60',
              )}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center border',
                        estado === 'completada'
                          ? 'bg-exito-500/15 border-exito-500/30'
                          : estado === 'activa'
                          ? cn(colores.bg, colores.borde)
                          : 'bg-fondo-borde/50 border-fondo-borde',
                      )}
                    >
                      {estado === 'completada' ? (
                        <CheckCircle2 className="w-6 h-6 text-exito-400" />
                      ) : (
                        <Icono
                          className={cn(
                            'w-6 h-6',
                            estado === 'activa' ? colores.icono : 'text-texto-muted',
                          )}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-texto-muted uppercase tracking-wider">
                        Etapa {etapa.numero}
                      </span>
                      {estado === 'completada' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-exito-500/15 text-exito-400 border border-exito-500/20">
                          COMPLETADA
                        </span>
                      )}
                      {estado === 'activa' && (
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                            colores.bg,
                            colores.texto,
                            colores.borde,
                          )}
                        >
                          EN CURSO
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-texto-primario mt-0.5">
                      {etapa.titulo}
                    </h3>
                    <p className="text-xs text-texto-muted">{etapa.subtitulo}</p>
                    <p className="text-sm text-texto-secundario mt-2 leading-relaxed">
                      {etapa.descripcion}
                    </p>

                    {estado === 'completada' && etapa.id === 'SIMULACION_VR' && induccion?.vrPuntaje && (
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-exito-400">
                          <Star className="w-3.5 h-3.5" />
                          <span>Puntaje: <strong>{induccion.vrPuntaje.toFixed(0)}%</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-texto-muted">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{induccion.vrIntentos} intento{induccion.vrIntentos !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    )}
                    {estado === 'completada' && etapa.id === 'EXAMEN_OBLIGATORIO' && induccion?.examenPuntaje && (
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-exito-400">
                          <Star className="w-3.5 h-3.5" />
                          <span>Puntaje: <strong>{induccion.examenPuntaje.toFixed(0)}%</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-texto-muted">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{induccion.examenIntentos} intento{induccion.examenIntentos !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-mineral-400 flex-shrink-0" />
                      <span className="text-xs text-texto-muted italic">{etapa.beneficio}</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right space-y-2">
                    <div className="flex items-center gap-1 justify-end text-xs text-texto-muted">
                      <Clock className="w-3 h-3" />
                      <span>{etapa.duracion}</span>
                    </div>
                    {estado === 'activa' && (
                      <BotonAccion etapaId={etapa.id} etiqueta={etapa.accion} />
                    )}
                  </div>
                </div>
              </div>

              {idx < ETAPAS_INDUCCION.length - 1 && (
                <div className="absolute left-[2.5rem] h-4 w-px bg-fondo-borde" />
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="tarjeta-base p-6"
      >
        <h3 className="text-sm font-semibold text-texto-primario mb-4 flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-mineral-400" />
          ¿Por qué este proceso es mejor que la inducción tradicional?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-fondo-borde p-4 space-y-3">
            <p className="text-xs font-bold text-texto-muted uppercase tracking-wider">
              Antes — Inducción Tradicional
            </p>
            {[
              'Manual impreso de 80+ páginas',
              'Charla magistral de 8 horas',
              'Sin práctica real antes de ingresar',
              'Sin soporte fuera del horario laboral',
              'Evaluación única sin retroalimentación',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs text-texto-muted">
                <span className="mt-0.5 text-peligro-400">✗</span>
                {item}
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-mineral-500/20 bg-mineral-500/5 p-4 space-y-3">
            <p className="text-xs font-bold texto-gradiente-mineral uppercase tracking-wider">
              Ahora — MinerIA
            </p>
            {[
              'Charla introductoria de 1 hora (focalizada)',
              'VR inmersiva: practica sin riesgo físico',
              'Experimenta emergencias reales en entorno seguro',
              'Experto IA disponible 24/7 por WhatsApp',
              'Examen adaptado a tu rol y área de trabajo',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-xs text-texto-secundario">
                <span className="mt-0.5 text-exito-400">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function BotonAccion({ etapaId, etiqueta }: { etapaId: EtapaId; etiqueta: string }) {
  const href: Partial<Record<EtapaId, string>> = {
    SIMULACION_VR: '/simulaciones',
    EXAMEN_OBLIGATORIO: '/evaluaciones',
    EXPERTO_IA: '/asistente',
  };

  const destino = href[etapaId];

  if (destino) {
    return (
      <Link href={destino}>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mineral-500/15 border border-mineral-500/25 text-mineral-300 text-xs font-medium hover:bg-mineral-500/25 transition-all">
          <Play className="w-3 h-3" />
          {etiqueta}
        </button>
      </Link>
    );
  }

  return (
    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-mineral-500/15 border border-mineral-500/25 text-mineral-300 text-xs font-medium hover:bg-mineral-500/25 transition-all">
      <CheckCircle2 className="w-3 h-3" />
      {etiqueta}
    </button>
  );
}
