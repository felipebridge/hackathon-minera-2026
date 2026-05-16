'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, AlertTriangle, BookOpen, Loader2, MessageSquare } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { clienteApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatearFechaRelativa } from '@/lib/fecha';

interface Mensaje {
  id: string;
  rol: 'usuario' | 'asistente';
  contenido: string;
  fuentes?: { documentoTitulo: string; similitud: number }[];
  escaladoHumano?: boolean;
  hora: Date;
}

export default function PaginaAsistente() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: '0',
      rol: 'asistente',
      contenido:
        '¡Hola! Soy MinerIA, tu asistente especializado en seguridad y procedimientos mineros. Puedes preguntarme sobre normativas, equipos, protocolos de seguridad o cualquier duda técnica. ¿En qué te puedo ayudar hoy?',
      hora: new Date(),
    },
  ]);
  const [entrada, setEntrada] = useState('');
  const [sesionId, setSesionId] = useState<string | undefined>();
  const contenedorRef = useRef<HTMLDivElement>(null);

  const { mutate: enviarMensaje, isPending } = useMutation({
    mutationFn: (mensaje: string) =>
      clienteApi.post('/api/v1/ia/chat', { mensaje, sesionId }).then((r) => r.data.datos),
    onSuccess: (datos) => {
      setSesionId(datos.sesionId);
      setMensajes((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          rol: 'asistente',
          contenido: datos.respuesta,
          fuentes: datos.fuentes,
          escaladoHumano: datos.escaladoHumano,
          hora: new Date(),
        },
      ]);
    },
    onError: () => {
      setMensajes((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          rol: 'asistente',
          contenido: 'Hubo un problema al procesar tu consulta. Por favor intenta de nuevo.',
          hora: new Date(),
        },
      ]);
    },
  });

  const alEnviar = () => {
    const texto = entrada.trim();
    if (!texto || isPending) return;

    setMensajes((prev) => [
      ...prev,
      { id: Date.now().toString(), rol: 'usuario', contenido: texto, hora: new Date() },
    ]);
    setEntrada('');
    enviarMensaje(texto);
  };

  const alPresionarTecla = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      alEnviar();
    }
  };

  useEffect(() => {
    contenedorRef.current?.scrollTo({
      top: contenedorRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [mensajes, isPending]);

  const preguntasSugeridas = [
    '¿Cuáles son los pasos para inspección pre-operacional?',
    '¿Qué dice el Decreto 249/07 sobre EPP?',
    '¿Cómo identificar gases tóxicos en mina subterránea?',
    '¿Protocolo de evacuación en tajo abierto?',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-130px)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-mineral-500/10 border border-mineral-500/20 flex items-center justify-center">
          <Bot className="w-5 h-5 text-mineral-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-texto-primario">Asistente MinerIA</h1>
          <p className="text-texto-secundario text-xs">
            IA especializada en minería • Base documental técnica
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-exito-400">
          <span className="w-2 h-2 rounded-full bg-exito-400 animate-pulse" />
          En línea
        </div>
      </div>

      <div
        ref={contenedorRef}
        className="flex-1 overflow-y-auto rounded-xl bg-fondo-secundario border border-fondo-borde p-4 space-y-4"
      >
        <AnimatePresence initial={false}>
          {mensajes.map((mensaje) => (
            <motion.div
              key={mensaje.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={cn('flex gap-3', mensaje.rol === 'usuario' ? 'justify-end' : 'justify-start')}
            >
              {mensaje.rol === 'asistente' && (
                <div className="w-8 h-8 rounded-full bg-mineral-500/20 border border-mineral-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-mineral-400" />
                </div>
              )}

              <div className={cn('max-w-[75%] space-y-2', mensaje.rol === 'usuario' ? 'items-end' : 'items-start')}>
                <div
                  className={cn(
                    'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    mensaje.rol === 'usuario'
                      ? 'bg-mineral-500 text-white rounded-br-sm'
                      : 'bg-fondo-tarjeta border border-fondo-borde text-texto-primario rounded-bl-sm',
                  )}
                >
                  <p className="whitespace-pre-wrap">{mensaje.contenido}</p>
                </div>

                {mensaje.escaladoHumano && (
                  <div className="flex items-center gap-2 text-xs text-advertencia-400 bg-advertencia-400/10 border border-advertencia-400/20 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Consulta escalada a supervisor disponible</span>
                  </div>
                )}

                {mensaje.fuentes && mensaje.fuentes.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-texto-muted flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Fuentes consultadas:
                    </p>
                    {mensaje.fuentes.map((f, i) => (
                      <div key={i} className="text-xs bg-fondo-elevado border border-fondo-borde rounded-lg px-3 py-1.5 flex items-center justify-between">
                        <span className="text-texto-secundario">{f.documentoTitulo}</span>
                        <span className="text-mineral-400 font-medium ml-2">
                          {(f.similitud * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-texto-muted">
                  {formatearFechaRelativa(mensaje.hora)}
                </p>
              </div>

              {mensaje.rol === 'usuario' && (
                <div className="w-8 h-8 rounded-full bg-fondo-elevado border border-fondo-borde flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-texto-secundario" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 items-center"
          >
            <div className="w-8 h-8 rounded-full bg-mineral-500/20 border border-mineral-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-mineral-400" />
            </div>
            <div className="bg-fondo-tarjeta border border-fondo-borde rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-mineral-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {mensajes.length === 1 && (
        <div className="flex gap-2 flex-wrap mt-3">
          {preguntasSugeridas.map((p) => (
            <button
              key={p}
              onClick={() => setEntrada(p)}
              className="text-xs text-texto-secundario bg-fondo-tarjeta hover:bg-fondo-elevado border border-fondo-borde hover:border-mineral-500/40 rounded-lg px-3 py-2 transition-all"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-3">
        <textarea
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          onKeyDown={alPresionarTecla}
          placeholder="Escribe tu consulta técnica... (Enter para enviar)"
          rows={2}
          className={cn(
            'flex-1 bg-fondo-tarjeta border border-fondo-borde rounded-xl px-4 py-3 text-sm',
            'text-texto-primario placeholder:text-texto-muted',
            'focus:outline-none focus:ring-2 focus:ring-mineral-500/50 focus:border-mineral-500',
            'resize-none transition-all',
          )}
        />
        <button
          onClick={alEnviar}
          disabled={!entrada.trim() || isPending}
          className={cn(
            'w-12 h-12 self-end bg-mineral-500 hover:bg-mineral-600 rounded-xl',
            'flex items-center justify-center',
            'transition-all shadow-glow-sm hover:shadow-glow-mineral',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
