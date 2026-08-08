/**
 * Matriz E2E PWA offline (ejecución manual en dispositivos).
 * No automatiza browser: documenta pasos reproducibles para QA de campo.
 *
 * Criterio de aceptación: un pedido queda 1 vez en servidor O permanece
 * recuperable en el dispositivo — nunca se pierde ni se duplica.
 */

const MATRIX = [
  {
    id: 'E2E-01',
    title: 'Pedido offline único',
    steps: [
      'Instalar PWA / abrir standalone con red',
      'Esperar precarga (toast App lista)',
      'Activar modo avión',
      'Crear 1 pedido offline',
      'Cerrar app completamente y reabrir',
      'Verificar pedido en Historial Offline',
      'Recuperar red → RECONECTAR APP',
      'Sincronizar pendientes',
      'Verificar exactamente 1 pedido en servidor',
    ],
  },
  {
    id: 'E2E-02',
    title: 'Cola múltiple + corte de red',
    steps: [
      'Crear 3 pedidos offline',
      'Recuperar red y reconectar',
      'Durante sync, cortar red al 2º pedido',
      'Verificar que pedidos no confirmados siguen en cola',
      'Reconectar y sync restante sin duplicar el 1º',
    ],
  },
  {
    id: 'E2E-03',
    title: 'Token vencido durante offline',
    steps: [
      'Entrar online, dejar app offline hasta expirar access token',
      'Crear pedido offline',
      'Reconectar',
      'Verificar renovación de sesión y sync exitoso',
    ],
  },
  {
    id: 'E2E-04',
    title: 'Actualización SW con cola pendiente',
    steps: [
      'Tener ≥1 pedido pendiente',
      'Forzar actualización PWA',
      'Verificar que NO se pierde la cola ni hay auto-reload destructivo',
    ],
  },
  {
    id: 'E2E-05',
    title: 'Stock insuficiente',
    steps: [
      'Crear pedido offline con stock que el servidor rechazará',
      'Reconectar y sync',
      'Pedido marcado para revisión; app permanece online',
      'Resto de pedidos (si hay) continúan sync',
    ],
  },
];

function printMatrix() {
  console.log('=== Matriz E2E PWA offline ===\n');
  for (const caseItem of MATRIX) {
    console.log(`${caseItem.id}: ${caseItem.title}`);
    caseItem.steps.forEach((step, idx) => {
      console.log(`  ${idx + 1}. ${step}`);
    });
    console.log('');
  }
  console.log(`Total casos: ${MATRIX.length}`);
}

if (require.main === module) {
  printMatrix();
}

module.exports = { MATRIX, printMatrix };
