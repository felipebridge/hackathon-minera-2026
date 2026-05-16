
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VERDE = '\x1b[32m';
const ROJO = '\x1b[31m';
const AMARILLO = '\x1b[33m';
const AZUL = '\x1b[34m';
const RESET = '\x1b[0m';
const NEGRITA = '\x1b[1m';

function ok(msg) { console.log(`${VERDE} ${msg}${RESET}`); }
function error(msg) { console.log(`${ROJO} ${msg}${RESET}`); }
function advertencia(msg) { console.log(`${AMARILLO}⚠️  ${msg}${RESET}`); }
function info(msg) { console.log(`${AZUL}ℹ️  ${msg}${RESET}`); }
function titulo(msg) { console.log(`\n${NEGRITA}${AZUL}━━ ${msg}${RESET}\n`); }

function ejecutar(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch {
    return null;
  }
}

function verificarVersion(programa, comando, versionMinima) {
  const salida = ejecutar(comando);
  if (!salida) {
    error(`${programa} no está instalado`);
    return false;
  }

  const version = salida.replace(/[^0-9.]/g, '').split('.')[0];
  if (parseInt(version) < versionMinima) {
    advertencia(`${programa} versión ${salida} — se recomienda >= ${versionMinima}`);
    return true;
  }

  ok(`${programa} ${salida}`);
  return true;
}

titulo('VERIFICANDO REQUISITOS DEL SISTEMA');

const nodeOk = verificarVersion('Node.js', 'node --version', 20);
const npmOk = verificarVersion('npm', 'npm --version', 10);
const dockerOk = verificarVersion('Docker', 'docker --version', 24);

if (!nodeOk || !npmOk) {
  error('Node.js >= 20 y npm >= 10 son requeridos');
  process.exit(1);
}

titulo('CONFIGURANDO VARIABLES DE ENTORNO');

const raiz = path.join(__dirname, '..');
const envEjemplo = path.join(raiz, '.env.example');
const envDestino = path.join(raiz, '.env');

if (!fs.existsSync(envDestino)) {
  fs.copyFileSync(envEjemplo, envDestino);
  ok('.env creado desde .env.example');
  advertencia('IMPORTANTE: Edita .env con tus credenciales reales antes de continuar');
} else {
  ok('.env ya existe — omitiendo copia');
}

titulo('INSTALANDO DEPENDENCIAS');

try {
  execSync('npm install', { cwd: raiz, stdio: 'inherit' });
  ok('Dependencias instaladas correctamente');
} catch {
  error('Error al instalar dependencias');
  process.exit(1);
}

titulo('CONFIGURACIÓN COMPLETADA');

console.log(`
${NEGRITA}Próximos pasos:${RESET}

  1. Edita ${AMARILLO}.env${RESET} con tus credenciales (OpenAI, WhatsApp, etc.)

  2. Levanta los servicios de base de datos:
     ${AZUL}docker-compose up -d postgres redis minio${RESET}

  3. Ejecuta las migraciones:
     ${AZUL}npm run db:migrar${RESET}

  4. Carga datos de demostración:
     ${AZUL}npm run db:seed${RESET}

  5. Inicia en modo desarrollo:
     ${AZUL}npm run dev${RESET}

  Accesos:
  • Frontend:  ${VERDE}http://localhost:3000${RESET}
  • API:       ${VERDE}http://localhost:3001/api${RESET}
  • Docs API:  ${VERDE}http://localhost:3001/api/docs${RESET}
  • MinIO:     ${VERDE}http://localhost:9001${RESET}
`);
