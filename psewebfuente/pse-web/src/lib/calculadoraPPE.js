/**
 * Módulo de cálculo del ahorro fiscal de un Plan de Pensiones de Empleo (PPE/PPPC).
 *
 * Función pura, sin dependencias ni efectos secundarios, para poder:
 *   - testarse con Node (ver calculadoraPPE.test.mjs), y
 *   - reutilizarse tal cual en la isla interactiva de la landing.
 *
 * IMPORTANTE: la lógica reproduce EXACTAMENTE la especificada en el briefing
 * del consultor. Es una estimación orientativa; no constituye asesoramiento
 * fiscal. Cualquier ajuste de tramos o límites debe hacerse aquí (fuente única).
 */

// --- Constantes de la normativa (revisar cada ejercicio) ---
export const TOPE_APORTACION_EMPRESA = 8500;   // € por empleado/año (tope duro del input)
export const LIMITE_CONJUNTO = 10000;          // € empresa + trabajador/año
export const UMBRAL_SALARIO_DEDUCCION = 27000; // € salario bruto para la deducción íntegra del 10%
export const PORC_DEDUCCION_CUOTA = 0.10;      // 10% de la aportación con derecho
export const TIPO_CC_SS = 0.236;               // 23,6% contingencias comunes (cuota empresarial)
export const BASE_MIN_DIARIA_G8 = 44.1;        // € base mínima diaria grupo de cotización 8
// Tope de la reducción de SS por trabajador/año = 13 × (23,6% × 44,1 €) ≈ 135,30 €
export const TOPE_REDUCCION_SS = 13 * TIPO_CC_SS * BASE_MIN_DIARIA_G8;

export const TIPOS_IS = {
  general: 0.25,     // 25% general
  micropyme: 0.23,   // 23% microempresa
  nuevaCreacion: 0.15, // 15% entidades de nueva creación
};

/**
 * Redondeo a 2 decimales sin arrastrar errores de coma flotante.
 */
function r2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Aportación máxima adicional que el propio empleado puede realizar
 * (informativo). Reproduce los tramos del briefing.
 *
 * @param {number} aportEmpresa aportación anual de la empresa por empleado
 * @param {number} salario salario bruto anual del empleado
 * @returns {number} límite adicional estimado para la aportación del trabajador
 */
export function aportacionMaximaEmpleado(aportEmpresa, salario) {
  // Regla especial por salario alto: el trabajador puede igualar la aportación empresarial.
  if (salario > 60000) return r2(aportEmpresa);

  if (aportEmpresa <= 500) return r2(aportEmpresa * 2.5);
  if (aportEmpresa <= 1500) return r2(1250 + (aportEmpresa - 500) * 0.25);
  return r2(aportEmpresa);
}

/**
 * Calcula el desglose de ahorro fiscal anual para la empresa.
 *
 * @param {Object} params
 * @param {number} params.n número de empleados adheridos (1–250)
 * @param {number} params.salario salario bruto medio anual (€)
 * @param {number} params.aportEmpresa aportación anual de la empresa por empleado (0–8.500 €)
 * @param {number} params.tipoIS tipo del Impuesto de Sociedades en tanto por uno (0.25/0.23/0.15)
 * @returns {Object} desglose con las tres partidas de ahorro, total y datos informativos
 */
export function calcularAhorroPPE({ n, salario, aportEmpresa, tipoIS }) {
  // Saneado defensivo de entradas.
  n = Math.max(0, Math.floor(Number(n) || 0));
  salario = Math.max(0, Number(salario) || 0);
  aportEmpresa = Math.min(TOPE_APORTACION_EMPRESA, Math.max(0, Number(aportEmpresa) || 0));
  tipoIS = Number(tipoIS) || 0;

  const aportacionTotalEmpresa = n * aportEmpresa;

  // 1. Ahorro por deducción como gasto de personal (reduce la base imponible del IS).
  const ahorroGasto = aportacionTotalEmpresa * tipoIS;

  // 2. Deducción en la cuota íntegra del IS (10% de la aportación con derecho).
  const aportConDerecho = salario <= UMBRAL_SALARIO_DEDUCCION
    ? aportEmpresa
    : aportEmpresa * UMBRAL_SALARIO_DEDUCCION / salario;
  const deduccionCuota = n * aportConDerecho * PORC_DEDUCCION_CUOTA;

  // 3. Reducción en la cuota de la Seguridad Social por contingencias comunes (con tope legal).
  const reduccionSS = n * Math.min(aportEmpresa * TIPO_CC_SS, TOPE_REDUCCION_SS);

  const ahorroTotalEmpresa = ahorroGasto + deduccionCuota + reduccionSS;

  // 4. Aportación adicional máxima del empleado (informativo) y límite conjunto.
  const aportMaxEmpleado = aportacionMaximaEmpleado(aportEmpresa, salario);

  // % de recuperación de lo aportado vía ahorro fiscal el primer año.
  const porcRecuperacion = aportacionTotalEmpresa > 0
    ? (ahorroTotalEmpresa / aportacionTotalEmpresa) * 100
    : 0;

  return {
    aportacionTotalEmpresa: r2(aportacionTotalEmpresa),
    ahorroGasto: r2(ahorroGasto),
    deduccionCuota: r2(deduccionCuota),
    reduccionSS: r2(reduccionSS),
    ahorroTotalEmpresa: r2(ahorroTotalEmpresa),
    aportConDerecho: r2(aportConDerecho),
    aportMaxEmpleado: r2(aportMaxEmpleado),
    limiteConjunto: LIMITE_CONJUNTO,
    porcRecuperacion: r2(porcRecuperacion),
  };
}

export default calcularAhorroPPE;
