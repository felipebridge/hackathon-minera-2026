'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users,
  Headset,
  ShieldCheck,
  MessageSquare,
  FileText,
  Award,
  ClipboardCheck,
  GraduationCap,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { TarjetaEstadistica } from '@/componentes/panel/tarjeta-estadistica';
import { GraficoEvaluaciones } from '@/componentes/metricas/grafico-evaluaciones';
import { ErroresFrecuentes } from '@/componentes/metricas/errores-frecuentes';
import { ActividadReciente } from '@/componentes/metricas/actividad-reciente';
import { GraficoInduccion } from '@/componentes/metricas/grafico-induccion';
import { clienteApi } from '@/lib/api';
import { useTiendaAutenticacion } from '@/stores/tienda-autenticacion';
import { Skeleton } from '@/componentes/ui/skeleton';

const varianteContenedor = {
  oculto: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const varianteTarjeta = {
  oculto: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function PaginaDashboard() {
  const { usuario } = useTiendaAutenticacion();
  const esAdmin = usuario?.rol === 'ADMIN' || usuario?.rol === 'INSTRUCTOR';

  const { data, isLoading } = useQuery({
    queryKey: ['metricas-dashboard'],
    queryFn: () => clienteApi.get('/api/v1/metricas/dashboard').then((r) => r.data.datos),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const kpis = data?.kpis;
  const kpisInduccion = data?.induccion;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold texto-gradiente">
          Bienvenido, {usuario?.nombre}
        </h1>
        <p className="text-texto-secundario text-sm mt-1">
          {esAdmin
            ? 'Panel de control — Sistema de inducción minera inteligente'
            : 'Tu progreso en el proceso de inducción'}
        </p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="w-4 h-4 text-mineral-400" />
          <h2 className="text-sm font-semibold text-texto-secundario uppercase tracking-wider">
            Inducción de Empleados
          </h2>
        </div>
        <motion.div
          variants={varianteContenedor}
          initial="oculto"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <motion.div variants={varianteTarjeta}>
            <TarjetaEstadistica
              titulo="En Inducción Activa"
              valor={isLoading ? null : kpisInduccion?.enCurso ?? 0}
              total={kpis?.totalUsuarios}
              icono={Users}
              color="mineral"
              descripcion="empleados nuevos en proceso"
            />
          </motion.div>
          <motion.div variants={varianteTarjeta}>
            <TarjetaEstadistica
              titulo="VR Completados"
              valor={isLoading ? null : kpisInduccion?.vrCompletados ?? 0}
              icono={Headset}
              color="cobre"
              descripcion="simulaciones Meta Quest 2"
            />
          </motion.div>
          <motion.div variants={varianteTarjeta}>
            <TarjetaEstadistica
              titulo="Exámenes Aprobados"
              valor={isLoading ? null : kpisInduccion?.examenesAprobados ?? 0}
              icono={ClipboardCheck}
              color="mineral"
              descripcion={`tasa de aprobación: ${kpisInduccion?.tasaAprobacion ?? 0}%`}
            />
          </motion.div>
          <motion.div variants={varianteTarjeta}>
            <TarjetaEstadistica
              titulo="Inducciones Completas"
              valor={isLoading ? null : kpisInduccion?.completadas ?? 0}
              icono={Award}
              color="exito"
              descripcion={`en ${kpisInduccion?.tiempoPromedioHoras ?? 0}h promedio (vs 8h trad.)`}
              destacado
            />
          </motion.div>
        </motion.div>
      </div>

      {esAdmin && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-texto-muted" />
            <h2 className="text-sm font-semibold text-texto-secundario uppercase tracking-wider">
              Operaciones del Sistema
            </h2>
          </div>
          <motion.div
            variants={varianteContenedor}
            initial="oculto"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {(
              [
                {
                  titulo: 'Accidentes Prevenidos',
                  valor: `~${kpis?.accidentesPrevenidosEstimados ?? 0}`,
                  icono: ShieldCheck,
                  color: 'exito',
                  descripcion: 'estimación por mejor preparación',
                },
                {
                  titulo: 'Consultas al Experto IA',
                  valor: kpis?.preguntasIA ?? 0,
                  icono: MessageSquare,
                  color: 'cobre',
                  descripcion: 'últimos 30 días',
                },
                {
                  titulo: 'Docs Base de Conocimiento',
                  valor: kpis?.totalDocumentos ?? 0,
                  icono: FileText,
                  color: 'mineral',
                  descripcion: 'procesados con RAG',
                },
                {
                  titulo: 'Tiempo Promedio Inducción',
                  valor: `${kpisInduccion?.tiempoPromedioHoras ?? 4.5}h`,
                  icono: Clock,
                  color: 'mineral',
                  descripcion: 'vs 8h del proceso tradicional',
                },
              ] as const
            ).map((item, i) => (
              <motion.div key={i} variants={varianteTarjeta}>
                <TarjetaEstadistica
                  titulo={item.titulo}
                  valor={isLoading ? null : item.valor}
                  icono={item.icono}
                  color={item.color}
                  descripcion={item.descripcion}
                  compacto
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <Skeleton className="h-80 rounded-xl" />
          ) : (
            <GraficoInduccion datos={data?.tendenciasInduccion ?? []} />
          )}
        </div>
        <div>
          {isLoading ? (
            <Skeleton className="h-80 rounded-xl" />
          ) : (
            <ErroresFrecuentes datos={data?.erroresFrecuentes ?? []} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <>
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </>
        ) : (
          <>
            <ActividadReciente datos={data?.actividadReciente ?? []} />
            <TarjetaProgresoEtapas datos={kpisInduccion} />
          </>
        )}
      </div>
    </div>
  );
}

interface PropsProgresosEtapas {
  datos?: {
    enCurso: number;
    charlaCompletada: number;
    vrCompletados: number;
    examenesAprobados: number;
    completadas: number;
  };
}

function TarjetaProgresoEtapas({ datos }: PropsProgresosEtapas) {
  const etapas = [
    { nombre: 'Charla Introductoria', valor: datos?.charlaCompletada ?? 0, color: 'bg-mineral-500' },
    { nombre: 'Simulación VR', valor: datos?.vrCompletados ?? 0, color: 'bg-cobre-500' },
    { nombre: 'Examen Obligatorio', valor: datos?.examenesAprobados ?? 0, color: 'bg-yellow-500' },
    { nombre: 'Inducción Completa', valor: datos?.completadas ?? 0, color: 'bg-exito-500' },
  ];

  const maximo = Math.max(...etapas.map((e) => e.valor), 1);

  return (
    <div className="tarjeta-base p-5">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-4 h-4 text-mineral-400" />
        <h3 className="text-sm font-semibold text-texto-primario">Embudo de Inducción</h3>
      </div>
      <div className="space-y-3">
        {etapas.map((etapa) => (
          <div key={etapa.nombre} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-texto-secundario">{etapa.nombre}</span>
              <span className="font-semibold text-texto-primario">{etapa.valor}</span>
            </div>
            <div className="h-2 bg-fondo-borde rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${etapa.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${(etapa.valor / maximo) * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-texto-muted mt-4 leading-relaxed">
        El embudo muestra cuántos empleados completaron cada etapa del proceso de inducción.
        La diferencia entre etapas indica dónde se producen abandonos.
      </p>
    </div>
  );
}
