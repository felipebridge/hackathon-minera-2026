'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface DatoEvaluacion {
  fecha: string;
  total: number;
  aprobadas: number;
  tasaAprobacion: number;
}

interface PropsGrafico {
  datos: DatoEvaluacion[];
}

const TooltipPersonalizado = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass-intense rounded-xl p-3 text-xs space-y-1.5 border border-mineral-500/20">
      <p className="font-medium text-texto-secundario">
        {format(parseISO(label), 'dd MMM', { locale: es })}
      </p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-texto-muted">{p.name}:</span>
          <span className="font-medium text-texto-primario">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function GraficoEvaluaciones({ datos }: PropsGrafico) {
  if (datos.length === 0) {
    return (
      <div className="tarjeta-base p-5 h-80 flex items-center justify-center">
        <p className="text-texto-muted text-sm">Sin datos de evaluaciones en los últimos 30 días</p>
      </div>
    );
  }

  return (
    <div className="tarjeta-base p-5">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-texto-primario">Evaluaciones — Últimos 30 días</h3>
        <p className="text-xs text-texto-muted mt-0.5">Total y aprobaciones diarias</p>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={datos} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="gradienteTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3D5AFE" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3D5AFE" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradienteAprobadas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1E2435" vertical={false} />
          <XAxis
            dataKey="fecha"
            tickFormatter={(v) => format(parseISO(v), 'dd/MM', { locale: es })}
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#64748B', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<TooltipPersonalizado />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#94A3B8', paddingTop: '12px' }}
          />

          <Area
            type="monotone"
            dataKey="total"
            name="Total"
            stroke="#3D5AFE"
            strokeWidth={2}
            fill="url(#gradienteTotal)"
            dot={false}
            activeDot={{ r: 4, fill: '#3D5AFE' }}
          />
          <Area
            type="monotone"
            dataKey="aprobadas"
            name="Aprobadas"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#gradienteAprobadas)"
            dot={false}
            activeDot={{ r: 4, fill: '#10B981' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
