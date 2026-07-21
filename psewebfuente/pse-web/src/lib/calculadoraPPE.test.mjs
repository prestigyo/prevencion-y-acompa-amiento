/**
 * Tests de la calculadora PPE. Ejecutables con Node sin dependencias:
 *   node src/lib/calculadoraPPE.test.mjs
 *
 * Valida los casos exigidos en el briefing:
 *   - los 3 tramos de aportación del empleado
 *   - la regla de salario > 60.000 €
 *   - la proporcionalidad de la deducción del 10% con salario 54.000 €
 *   - el tope de la reducción de Seguridad Social
 */
import assert from 'node:assert/strict';
import {
  calcularAhorroPPE,
  aportacionMaximaEmpleado,
  TOPE_REDUCCION_SS,
  TIPOS_IS,
} from './calculadoraPPE.js';

let pasados = 0;
function test(nombre, fn) {
  try {
    fn();
    pasados++;
    console.log(`  ✓ ${nombre}`);
  } catch (e) {
    console.error(`  ✗ ${nombre}`);
    console.error(`    ${e.message}`);
    process.exitCode = 1;
  }
}

const aprox = (a, b, tol = 0.01) => Math.abs(a - b) <= tol;

console.log('Calculadora PPE — tests\n');

// --- Tramos de aportación del empleado ---
test('Tramo 1: aportación <= 500 → x2,5', () => {
  assert.equal(aportacionMaximaEmpleado(500, 24000), 1250); // 500 * 2.5
  assert.equal(aportacionMaximaEmpleado(400, 24000), 1000); // 400 * 2.5
});

test('Tramo 2: 500 < aportación <= 1500 → 1250 + (a-500)*0,25', () => {
  assert.equal(aportacionMaximaEmpleado(1500, 24000), 1500); // 1250 + 1000*0.25
  assert.equal(aportacionMaximaEmpleado(1000, 24000), 1375); // 1250 + 500*0.25
});

test('Tramo 3: aportación > 1500 → igual a la aportación', () => {
  assert.equal(aportacionMaximaEmpleado(2000, 24000), 2000);
  assert.equal(aportacionMaximaEmpleado(8500, 24000), 8500);
});

test('Continuidad entre tramos en los puntos de corte (500 y 1500)', () => {
  assert.equal(aportacionMaximaEmpleado(500, 24000), 1250);
  assert.ok(aprox(aportacionMaximaEmpleado(500.01, 24000), 1250));
  assert.equal(aportacionMaximaEmpleado(1500, 24000), 1500);
  assert.ok(aprox(aportacionMaximaEmpleado(1500.01, 24000), 1500.01));
});

// --- Regla de salario > 60.000 € ---
test('Salario > 60.000 € → el empleado puede igualar la aportación', () => {
  // Sin la regla, 300 € caería en el tramo 1 (x2,5 = 750). Con salario alto = 300.
  assert.equal(aportacionMaximaEmpleado(300, 61000), 300);
  assert.equal(aportacionMaximaEmpleado(1000, 70000), 1000);
});

// --- Proporcionalidad de la deducción del 10% con salario 54.000 € ---
test('Deducción 10%: salario 54.000 € → aportación con derecho = 50% de la aportación', () => {
  const aport = 4000;
  const res = calcularAhorroPPE({ n: 1, salario: 54000, aportEmpresa: aport, tipoIS: TIPOS_IS.general });
  // 27000/54000 = 0.5 → aportConDerecho = 4000 * 0.5 = 2000
  assert.equal(res.aportConDerecho, 2000);
  // deduccionCuota = 1 * 2000 * 0.10 = 200
  assert.equal(res.deduccionCuota, 200);
});

test('Deducción 10%: salario <= 27.000 € → aportación con derecho = aportación completa', () => {
  const res = calcularAhorroPPE({ n: 1, salario: 24000, aportEmpresa: 2000, tipoIS: TIPOS_IS.general });
  assert.equal(res.aportConDerecho, 2000);
  assert.equal(res.deduccionCuota, 200); // 2000 * 0.10
});

// --- Tope de la reducción de la Seguridad Social ---
test('Reducción SS topada: aportación alta → se aplica el tope legal (~135,30 €/trab.)', () => {
  // aportEmpresa * 0.236 = 8500*0.236 = 2006 > tope → se aplica el tope.
  const res = calcularAhorroPPE({ n: 1, salario: 24000, aportEmpresa: 8500, tipoIS: TIPOS_IS.general });
  assert.ok(aprox(res.reduccionSS, TOPE_REDUCCION_SS), `esperado ~${TOPE_REDUCCION_SS.toFixed(2)}, obtenido ${res.reduccionSS}`);
});

test('Reducción SS sin topar: aportación baja → proporcional (aport * 23,6%)', () => {
  // 400 * 0.236 = 94.4 < tope(135.30) → no se topa.
  const res = calcularAhorroPPE({ n: 1, salario: 24000, aportEmpresa: 400, tipoIS: TIPOS_IS.general });
  assert.ok(aprox(res.reduccionSS, 94.4), `obtenido ${res.reduccionSS}`);
});

// --- Coherencia del total y escalado por nº de empleados ---
test('El total es la suma de las tres partidas', () => {
  const res = calcularAhorroPPE({ n: 10, salario: 24000, aportEmpresa: 1500, tipoIS: TIPOS_IS.general });
  assert.ok(aprox(res.ahorroTotalEmpresa, res.ahorroGasto + res.deduccionCuota + res.reduccionSS));
});

test('El ahorro escala linealmente con el nº de empleados', () => {
  const uno = calcularAhorroPPE({ n: 1, salario: 30000, aportEmpresa: 2000, tipoIS: TIPOS_IS.micropyme });
  const diez = calcularAhorroPPE({ n: 10, salario: 30000, aportEmpresa: 2000, tipoIS: TIPOS_IS.micropyme });
  // Tolerancia por el redondeo a céntimos por empleado (multiplicar el total ya
  // redondeado de 1 empleado ≠ calcular 10 de golpe; el desvío es de redondeo).
  assert.ok(aprox(diez.ahorroTotalEmpresa, uno.ahorroTotalEmpresa * 10, 0.1));
});

test('Saneado: aportación por encima del tope duro (8.500 €) se recorta', () => {
  const res = calcularAhorroPPE({ n: 1, salario: 24000, aportEmpresa: 99999, tipoIS: TIPOS_IS.general });
  // Se recorta a 8500 → ahorroGasto = 8500 * 0.25 = 2125
  assert.equal(res.ahorroGasto, 2125);
});

console.log(`\n${pasados} test(s) OK${process.exitCode ? ' — CON FALLOS' : ''}`);
