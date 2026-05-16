import { PrismaClient, Prisma, RolUsuario, NivelCurso, EstadoCurso, TipoContenido, TipoPregunta, EstadoInduccion, EtapaInduccion } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const RONDAS_BCRYPT = 12;

async function hash(contrasena: string) {
  return bcrypt.hash(contrasena, RONDAS_BCRYPT);
}

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@mineria.com' },
    update: {},
    create: {
      nombre: 'Carlos',
      apellido: 'Mendoza',
      email: 'admin@mineria.com',
      contrasenaHash: await hash('Admin2024!'),
      rol: RolUsuario.ADMIN,
      cargo: 'Gerente de Capacitación',
      area: 'Recursos Humanos',
      telefono: '+5426442001001',
    },
  });

  const instructor = await prisma.usuario.upsert({
    where: { email: 'instructor@mineria.com' },
    update: {},
    create: {
      nombre: 'Ana',
      apellido: 'Torres',
      email: 'instructor@mineria.com',
      contrasenaHash: await hash('Instructor2024!'),
      rol: RolUsuario.INSTRUCTOR,
      cargo: 'Instructora de Seguridad',
      area: 'Operaciones',
      telefono: '+5426442002002',
    },
  });

  const empleado1 = await prisma.usuario.upsert({
    where: { email: 'operario@mineria.com' },
    update: {},
    create: {
      nombre: 'Pedro',
      apellido: 'González',
      email: 'operario@mineria.com',
      contrasenaHash: await hash('Operario2024!'),
      rol: RolUsuario.EMPLEADO,
      cargo: 'Operador de Maquinaria',
      area: 'Producción',
      telefono: '+5426442003003',
    },
  });

  const empleado2 = await prisma.usuario.upsert({
    where: { email: 'operario2@mineria.com' },
    update: {},
    create: {
      nombre: 'María',
      apellido: 'Soto',
      email: 'operario2@mineria.com',
      contrasenaHash: await hash('Operario2024!'),
      rol: RolUsuario.EMPLEADO,
      cargo: 'Técnico de Voladura',
      area: 'Perforación y Voladura',
      telefono: '+5426442004004',
    },
  });

  console.log('✅ Usuarios creados');

  const cursoSeguridad = await prisma.curso.upsert({
    where: { id: 'curso-seguridad-001' },
    update: {},
    create: {
      id: 'curso-seguridad-001',
      titulo: 'Seguridad e Higiene Industrial en Minería',
      descripcion:
        'Fundamentos esenciales de seguridad para operarios mineros. Cubre normativas vigentes, identificación de riesgos, uso de EPP y protocolos de emergencia.',
      categoria: 'Seguridad',
      nivel: NivelCurso.BASICO,
      estado: EstadoCurso.ACTIVO,
      duracionHoras: 8,
      requisitos: [],
      objetivos: [
        'Identificar los principales riesgos en operaciones mineras de San Juan',
        'Aplicar correctamente el uso de equipos de protección personal',
        'Ejecutar protocolos de emergencia y evacuación',
        'Conocer el Decreto 249/07 y la Resolución 905/2015 de seguridad minera',
      ],
      etiquetas: ['seguridad', 'EPP', 'normativa', 'básico', 'obligatorio'],
    },
  });

  const cursoExplosivos = await prisma.curso.upsert({
    where: { id: 'curso-explosivos-001' },
    update: {},
    create: {
      id: 'curso-explosivos-001',
      titulo: 'Manejo Seguro de Explosivos y Voladura',
      descripcion:
        'Capacitación especializada en el manejo, almacenamiento y detonación de explosivos industriales según normativa argentina (Decreto 249/07, ANMaC). Incluye simulación de procedimientos.',
      categoria: 'Voladura',
      nivel: NivelCurso.AVANZADO,
      estado: EstadoCurso.ACTIVO,
      duracionHoras: 16,
      requisitos: ['curso-seguridad-001'],
      objetivos: [
        'Clasificar correctamente los tipos de explosivos industriales',
        'Aplicar procedimientos de carga y voladura seguros',
        'Identificar y gestionar incidentes con explosivos',
        'Cumplir con el Decreto 249/07 y normativa ANMaC vigente',
      ],
      etiquetas: ['explosivos', 'voladura', 'avanzado', 'especialización'],
    },
  });

  const cursoMaquinaria = await prisma.curso.upsert({
    where: { id: 'curso-maquinaria-001' },
    update: {},
    create: {
      id: 'curso-maquinaria-001',
      titulo: 'Operación de Maquinaria Pesada en Minería',
      descripcion:
        'Operación segura de equipos de minería a cielo abierto: palas, cargadores, camiones de gran tonelaje y equipos de perforación.',
      categoria: 'Operaciones',
      nivel: NivelCurso.INTERMEDIO,
      estado: EstadoCurso.ACTIVO,
      duracionHoras: 12,
      requisitos: ['curso-seguridad-001'],
      objetivos: [
        'Operar equipos de minería según procedimientos estándar',
        'Realizar inspecciones pre-operacionales efectivas',
        'Gestionar situaciones de riesgo mecánico',
        'Aplicar técnicas de manejo eficiente',
      ],
      etiquetas: ['maquinaria', 'operaciones', 'equipo pesado', 'intermedio'],
    },
  });

  console.log('✅ Cursos creados');

  const modulos = [
    {
      cursoId: cursoSeguridad.id,
      titulo: 'Introducción a la Seguridad Minera',
      descripcion: 'Marco legal, estadísticas de accidentabilidad y cultura de seguridad.',
      orden: 1,
      tipoContenido: TipoContenido.TEXTO,
      duracionMinutos: 45,
      contenido: {
        html: '<h2>Marco legal de la seguridad minera en Argentina — San Juan</h2><p>El Decreto 249/07 establece el Reglamento de Higiene y Seguridad para la Actividad Minera...</p>',
      },
    },
    {
      cursoId: cursoSeguridad.id,
      titulo: 'Identificación y Evaluación de Riesgos',
      descripcion: 'Metodología IPERC, matrices de riesgo y medidas de control.',
      orden: 2,
      tipoContenido: TipoContenido.VIDEO,
      duracionMinutos: 60,
      videoUrl: 'https://ejemplo.com/video-iperc',
      contenido: Prisma.JsonNull,
    },
    {
      cursoId: cursoSeguridad.id,
      titulo: 'Equipos de Protección Personal',
      descripcion: 'Selección, uso y mantenimiento del EPP según tipo de riesgo.',
      orden: 3,
      tipoContenido: TipoContenido.TEXTO,
      duracionMinutos: 45,
      contenido: {
        html: '<h2>Equipos de Protección Personal (EPP)</h2>...',
      },
    },
    {
      cursoId: cursoSeguridad.id,
      titulo: 'Evaluación: Seguridad e Higiene Industrial',
      descripcion: 'Evaluación final del módulo de seguridad.',
      orden: 4,
      tipoContenido: TipoContenido.EVALUACION,
      duracionMinutos: 30,
      contenido: Prisma.JsonNull,
    },
  ];

  for (const modulo of modulos) {
    await prisma.modulo.upsert({
      where: {
        id: `modulo-${modulo.cursoId}-${modulo.orden}`,
      },
      update: {},
      create: {
        id: `modulo-${modulo.cursoId}-${modulo.orden}`,
        ...modulo,
      },
    });
  }

  console.log('✅ Módulos creados');

  const moduloEvaluacion = await prisma.modulo.findFirst({
    where: { cursoId: cursoSeguridad.id, tipoContenido: TipoContenido.EVALUACION },
  });

  if (moduloEvaluacion) {
    const evaluacion = await prisma.evaluacion.upsert({
      where: { id: 'eval-seguridad-001' },
      update: {},
      create: {
        id: 'eval-seguridad-001',
        moduloId: moduloEvaluacion.id,
        titulo: 'Evaluación: Seguridad e Higiene Industrial',
        descripcion: 'Demuestra tu comprensión de los conceptos fundamentales de seguridad minera.',
        tiempoLimiteMin: 30,
        puntajeAprobacion: 70,
        intentosPermitidos: 3,
        aleatorizar: true,
      },
    });

    const preguntas = [
      {
        texto:
          '¿Qué establece el Decreto 249/07 en Argentina respecto a la actividad minera?',
        tipo: TipoPregunta.OPCION_MULTIPLE,
        opciones: [
          { texto: 'Reglamenta la higiene y seguridad para la actividad minera', esCorrecta: true },
          { texto: 'Regula los salarios mínimos del sector minero', esCorrecta: false },
          { texto: 'Establece normas de exportación de minerales', esCorrecta: false },
          { texto: 'Define los impuestos aplicables a la minería', esCorrecta: false },
        ],
        explicacion:
          'El Decreto 249/07 es el Reglamento de Higiene y Seguridad para la Actividad Minera en Argentina. Establece las condiciones mínimas de seguridad e higiene que deben cumplirse en todas las operaciones mineras del país, complementado por la Resolución 905/2015 del MTESS.',
        categoriaError: 'normativa',
        orden: 1,
      },
      {
        texto:
          'Un operario detecta gases con olor a huevo podrido en un túnel subterráneo. ¿Cuál es la acción correcta inmediata?',
        tipo: TipoPregunta.SITUACIONAL,
        opciones: [
          {
            texto: 'Evacuar inmediatamente y dar aviso a supervisión',
            esCorrecta: true,
          },
          {
            texto: 'Continuar el trabajo con mascarilla respiratoria estándar',
            esCorrecta: false,
          },
          {
            texto: 'Ventilar manualmente abriendo compuertas',
            esCorrecta: false,
          },
          {
            texto: 'Esperar 15 minutos para ver si el olor desaparece',
            esCorrecta: false,
          },
        ],
        explicacion:
          'El olor a huevo podrido indica presencia de H₂S (sulfuro de hidrógeno), gas extremadamente tóxico. La evacuación inmediata es la única respuesta correcta.',
        categoriaError: 'gases_toxicos',
        orden: 2,
      },
      {
        texto: '¿Verdadero o Falso? El EPP puede reemplazar las medidas de control en la fuente del peligro.',
        tipo: TipoPregunta.VERDADERO_FALSO,
        opciones: [
          { texto: 'Falso', esCorrecta: true },
          { texto: 'Verdadero', esCorrecta: false },
        ],
        explicacion:
          'El EPP es el último recurso en la jerarquía de controles (eliminación → sustitución → controles de ingeniería → controles administrativos → EPP). Nunca reemplaza controles más efectivos.',
        categoriaError: 'jerarquia_controles',
        orden: 3,
      },
      {
        texto: '¿Cuál de los siguientes es un riesgo específico de la minería a cielo abierto que NO existe en operaciones subterráneas?',
        tipo: TipoPregunta.OPCION_MULTIPLE,
        opciones: [
          { texto: 'Taludes y derrumbes de pared de pit', esCorrecta: true },
          { texto: 'Exposición a gases tóxicos', esCorrecta: false },
          { texto: 'Ruido industrial', esCorrecta: false },
          { texto: 'Accidentes con maquinaria', esCorrecta: false },
        ],
        explicacion:
          'Los taludes del pit representan un riesgo exclusivo de la minería a cielo abierto, con potencial de falla geotécnica masiva.',
        categoriaError: 'riesgos_especificos',
        orden: 4,
      },
      {
        texto: '¿Con qué frecuencia mínima debe realizarse la inspección pre-operacional de una máquina de gran tonelaje?',
        tipo: TipoPregunta.OPCION_MULTIPLE,
        opciones: [
          { texto: 'Antes de cada turno de trabajo', esCorrecta: true },
          { texto: 'Una vez por semana', esCorrecta: false },
          { texto: 'Una vez al mes', esCorrecta: false },
          { texto: 'Solo cuando hay falla evidente', esCorrecta: false },
        ],
        explicacion:
          'La inspección pre-operacional (check list) debe realizarse al inicio de cada turno, sin excepción. Es una medida crítica para detectar fallas antes de operar.',
        categoriaError: 'inspeccion_equipos',
        orden: 5,
      },
    ];

    for (let i = 0; i < preguntas.length; i++) {
      const p = preguntas[i];
      await prisma.pregunta.upsert({
        where: { id: `pregunta-eval-001-${i + 1}` },
        update: {},
        create: {
          id: `pregunta-eval-001-${i + 1}`,
          evaluacionId: evaluacion.id,
          ...p,
          opciones: p.opciones,
        },
      });
    }
  }

  console.log('✅ Evaluaciones y preguntas creadas');

  await prisma.cursoAsignado.upsert({
    where: { usuarioId_cursoId: { usuarioId: empleado1.id, cursoId: cursoSeguridad.id } },
    update: {},
    create: { usuarioId: empleado1.id, cursoId: cursoSeguridad.id },
  });

  await prisma.cursoAsignado.upsert({
    where: { usuarioId_cursoId: { usuarioId: empleado1.id, cursoId: cursoMaquinaria.id } },
    update: {},
    create: { usuarioId: empleado1.id, cursoId: cursoMaquinaria.id },
  });

  await prisma.cursoAsignado.upsert({
    where: { usuarioId_cursoId: { usuarioId: empleado2.id, cursoId: cursoSeguridad.id } },
    update: {},
    create: { usuarioId: empleado2.id, cursoId: cursoSeguridad.id },
  });

  await prisma.cursoAsignado.upsert({
    where: { usuarioId_cursoId: { usuarioId: empleado2.id, cursoId: cursoExplosivos.id } },
    update: {},
    create: { usuarioId: empleado2.id, cursoId: cursoExplosivos.id },
  });

  console.log('✅ Asignaciones de cursos creadas');

  const progresoExistente = await prisma.progreso.findFirst({
    where: { usuarioId: empleado1.id, cursoId: cursoSeguridad.id, moduloId: null },
  });
  if (!progresoExistente) {
    await prisma.progreso.create({
      data: {
        usuarioId: empleado1.id,
        cursoId: cursoSeguridad.id,
        porcentaje: 75,
        tiempoSegundos: 10800,
        completado: false,
      },
    });
  }

  console.log('✅ Progreso de demo creado');

  await prisma.simulacion.upsert({
    where: { id: 'sim-induccion-tajo-001' },
    update: {},
    create: {
      id: 'sim-induccion-tajo-001',
      titulo: 'Inducción VR: Primer Día en el Pit',
      descripcion:
        'Simulación de inducción completa para nuevos empleados en tajo abierto. Cubre recorrido seguro de instalaciones, identificación de zonas de riesgo y protocolos de emergencia. El entorno VR permite "cometer errores sin consecuencias reales" — el principio de falla segura.',
      escenario: 'tajo_abierto',
      nivel: NivelCurso.BASICO,
      sdkRequerido: 'meta-quest-2',
      duracionMinutos: 25,
      objetivosVR: [
        'Reconocer la señalización de seguridad del área de tajo',
        'Identificar y usar correctamente el EPP para cada zona',
        'Practicar el protocolo de comunicación de radios de emergencia',
        'Responder correctamente ante una simulación de derrumbe de talud',
        'Localizar puntos de evacuación y zonas de reunión',
      ],
      archivoManifesto: {
        sdkVersion: '60.0',
        appId: 'com.mineria.induccion.tajo',
        entryScene: 'TajoOpenPit_Day1',
        handTracking: true,
        locomotion: 'teleport',
        fallbackMode: 'monoscopic',
        achievements: [
          { id: 'epp_correcto', name: 'EPP Correcto', points: 25 },
          { id: 'evacuacion_exitosa', name: 'Evacuación Exitosa', points: 50 },
          { id: 'comunicacion_radio', name: 'Comunicación Efectiva', points: 25 },
        ],
        passingScore: 70,
        maxAttempts: 5,
        callbacks: {
          onComplete: '/api/v1/simulaciones/webhook/completado',
          onFail: '/api/v1/simulaciones/webhook/fallido',
        },
      },
    },
  });

  await prisma.simulacion.upsert({
    where: { id: 'sim-induccion-subterranea-001' },
    update: {},
    create: {
      id: 'sim-induccion-subterranea-001',
      titulo: 'Inducción VR: Operaciones Subterráneas',
      descripcion:
        'Recorrido de inducción por galería subterránea. El empleado experimenta situaciones de riesgo controladas (gases, derrumbe parcial, falla eléctrica) y debe aplicar los procedimientos correctos. Diseñado para Meta Quest 2 con 6DOF.',
      escenario: 'interior_mina',
      nivel: NivelCurso.BASICO,
      sdkRequerido: 'meta-quest-2',
      duracionMinutos: 30,
      objetivosVR: [
        'Detectar presencia de gases tóxicos con detector virtual',
        'Ejecutar evacuación de galería en condiciones de visibilidad reducida',
        'Aplicar protocolo de bloqueo y etiquetado (LOTO) en equipo eléctrico',
        'Reportar condición sub-estándar mediante sistema de observación preventiva',
      ],
      archivoManifesto: {
        sdkVersion: '60.0',
        appId: 'com.mineria.induccion.subterranea',
        entryScene: 'Underground_Gallery_A',
        handTracking: true,
        locomotion: 'teleport',
        hapticFeedback: true,
        passingScore: 70,
        maxAttempts: 5,
        callbacks: {
          onComplete: '/api/v1/simulaciones/webhook/completado',
          onFail: '/api/v1/simulaciones/webhook/fallido',
        },
      },
    },
  });

  console.log('✅ Simulaciones VR de inducción creadas');

  await prisma.induccionEmpleado.upsert({
    where: { usuarioId: empleado1.id },
    update: {},
    create: {
      usuarioId: empleado1.id,
      instructorId: instructor.id,
      estado: EstadoInduccion.EN_CURSO,
      etapaActual: EtapaInduccion.EXAMEN_OBLIGATORIO,
      charlaCompletada: true,
      charlaCompletadaEn: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      simulacionVrId: 'sim-induccion-tajo-001',
      vrCompletado: true,
      vrCompletadoEn: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      vrPuntaje: 82.5,
      vrIntentos: 2,
      examenAprobado: false,
      examenIntentos: 0,
    },
  });

  await prisma.induccionEmpleado.upsert({
    where: { usuarioId: empleado2.id },
    update: {},
    create: {
      usuarioId: empleado2.id,
      instructorId: instructor.id,
      estado: EstadoInduccion.COMPLETADA,
      etapaActual: EtapaInduccion.EXPERTO_IA,
      charlaCompletada: true,
      charlaCompletadaEn: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      simulacionVrId: 'sim-induccion-tajo-001',
      vrCompletado: true,
      vrCompletadoEn: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      vrPuntaje: 91.0,
      vrIntentos: 1,
      examenAprobado: true,
      examenAprobadoEn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      examenPuntaje: 88.0,
      examenIntentos: 1,
      completadaEn: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      tiempoTotalHoras: 4.5,
    },
  });

  console.log('✅ Inducciones de empleados creadas');

  console.log('\n✅ Seed completado exitosamente.');
  console.log('\n📋 Credenciales de acceso:');
  console.log('   Admin:      admin@mineria.com       / Admin2024!');
  console.log('   Instructor: instructor@mineria.com  / Instructor2024!');
  console.log('   Empleado:   operario@mineria.com    / Operario2024!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
