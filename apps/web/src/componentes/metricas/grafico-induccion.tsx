'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { GraduationCap } from 'lucide-react';

interface DatoInduccionDiario {
  fecha: string;
  iniciadas: number;
  completadas: number;
  vrCompletados: number;
}

interface PropsGraficoInduccion {
  datos: DatoInduccionDiario[];
}

function TooltipPersonalizado({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="glass rounded-xl border border-fondo-borde p-3 shadow-tarjeta text-xs space-y-1.5">
      <p className="font-semibold text-texto-primario mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-texto-secundario">{entry.name}:</span>
          <span className="font-semibold text-texto-primario">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function GraficoInduccion({ datos }: PropsGraficoInduccion) {
  const datosDemo: DatoInduccionDiario[] = datos.length > 0 ? datos : [
    { fecha: 'Lun', iniciadas: 3, completadas: 1, vrCompletados: 2 },
    { fecha: 'Mar', iniciadas: 5, completadas: 2, vrCompletados: 4 },
    { fecha: 'Mié', iniciadas: 2, completadas: 3, vrCompletados: 2 },
    { fecha: 'Jue', iniciadas: 4, completadas: 2, vrCompletados: 3 },
    { fecha: 'Vie', iniciadas: 6, completadas: 4, vrCompletados: 5 },
    { fecha: 'Sáb', iniciadas: 1, completadas: 2, vrCompletados: 1 },
    { fecha: 'Hoy', iniciadas: 2, completadas: 1, vrCompletados: 2 },
  ];

  return (
    <div className="tarjeta-base p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-mineral-400" />
          <div>
            <h3 className="text-sm font-semibold text-texto-primario">Actividad de Inducción</h3>
            <p className="text-xs text-texto-muted">Últimos 7 días</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold texto-gradiente-mineral">
            {datosDemo.reduce((s, d) => s + d.completadas, 0)}
          </p>
          <p className="text-xs text-texto-muted">completadas esta semana</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={datosDemo}
          margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
          barGap={2}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2435" vertical={false} />
          <XAxis
            dataKey="fecha"
            tick={{ fill: '#6B7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6B7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<TooltipPersonalizado />} cursor={{ fill: 'rgba(61, 90, 254, 0.05)' }} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
            formatter={(value) => (
              <span style={{ color: '#9CA3AF' }}>{value}</span>
            )}
          />
          <Bar
            dataKey="iniciadas"
            name="Iniciadas"
            fill="#3D5AFE"
            fillOpacity={0.7}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="vrCompletados"
            name="VR completado"
            fill="#FF6D00"
            fillOpacity={0.7}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="completadas"
            name="Completadas"
            fill="#00C853"
            fillOpacity={0.85}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
