export interface EntradaCalculoAcarreoEscalonado {
  capacidadM3: string;
  distanciaPavimentoKm: string;
  distanciaTotalKm: string;
  precioPrimerKm: string;
  precioKmSubsecuente: string;
}

export interface ResultadoCalculoAcarreoEscalonado {
  m3Km: string;
  costePrimerKm: string;
  costeKmSubsecuente: string;
  importe: string;
}

const ESCALA_CANTIDAD = 3;
const ESCALA_DISTANCIA = 3;
const ESCALA_PRECIO = 4;
const ESCALA_MONEDA = 2;

export function calcularAcarreoEscalonado(
  entrada: EntradaCalculoAcarreoEscalonado,
): ResultadoCalculoAcarreoEscalonado {
  const capacidad = decimalEscalado(entrada.capacidadM3, ESCALA_CANTIDAD);
  const distanciaPavimento = decimalEscalado(
    entrada.distanciaPavimentoKm,
    ESCALA_DISTANCIA,
  );
  const distanciaTotal = decimalEscalado(
    entrada.distanciaTotalKm,
    ESCALA_DISTANCIA,
  );
  const precioPrimerKm = decimalEscalado(entrada.precioPrimerKm, ESCALA_PRECIO);
  const precioSubsecuente = decimalEscalado(
    entrada.precioKmSubsecuente,
    ESCALA_PRECIO,
  );
  const unKilometro = 10n ** BigInt(ESCALA_DISTANCIA);
  const kilometrosSubsecuentes =
    distanciaPavimento > unKilometro ? distanciaPavimento - unKilometro : 0n;

  const m3Km = multiplicarYRedondear(
    [capacidad, distanciaTotal],
    ESCALA_CANTIDAD + ESCALA_DISTANCIA,
    ESCALA_MONEDA,
  );
  const costePrimerKm = multiplicarYRedondear(
    [capacidad, precioPrimerKm],
    ESCALA_CANTIDAD + ESCALA_PRECIO,
    ESCALA_MONEDA,
  );
  const costeKmSubsecuente = multiplicarYRedondear(
    [capacidad, kilometrosSubsecuentes, precioSubsecuente],
    ESCALA_CANTIDAD + ESCALA_DISTANCIA + ESCALA_PRECIO,
    ESCALA_MONEDA,
  );

  return {
    m3Km: decimalDesdeEscalado(m3Km, ESCALA_MONEDA),
    costePrimerKm: decimalDesdeEscalado(costePrimerKm, ESCALA_MONEDA),
    costeKmSubsecuente: decimalDesdeEscalado(costeKmSubsecuente, ESCALA_MONEDA),
    importe: decimalDesdeEscalado(
      costePrimerKm + costeKmSubsecuente,
      ESCALA_MONEDA,
    ),
  };
}

function decimalEscalado(valor: string, escala: number): bigint {
  const normalizado = valor.trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalizado)) {
    throw new Error(`Decimal inválido: ${valor}`);
  }
  const [entero, fraccion = ''] = normalizado.split('.');
  if (fraccion.length > escala) {
    throw new Error(`El decimal ${valor} excede la escala ${escala}`);
  }
  return (
    BigInt(entero) * 10n ** BigInt(escala) +
    BigInt(fraccion.padEnd(escala, '0') || '0')
  );
}

function multiplicarYRedondear(
  factores: bigint[],
  escalaEntrada: number,
  escalaSalida: number,
): bigint {
  const producto = factores.reduce((total, factor) => total * factor, 1n);
  const divisor = 10n ** BigInt(escalaEntrada - escalaSalida);
  return (producto + divisor / 2n) / divisor;
}

function decimalDesdeEscalado(valor: bigint, escala: number): string {
  const divisor = 10n ** BigInt(escala);
  return `${valor / divisor}.${(valor % divisor)
    .toString()
    .padStart(escala, '0')}`;
}
