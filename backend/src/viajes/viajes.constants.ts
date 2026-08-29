import { ZONA_HORARIA_OPERATIVA } from '../common/operational-datetime';

export { ZONA_HORARIA_OPERATIVA };
export const INDICE_CAMION_EN_TRANSITO = 'UQ_viajes_camion_en_transito';
export const SECUENCIA_FOLIO_VIAJES = 'viajes_folio_seq';

export function formatearFechaOperativa(fecha: Date): string {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA_OPERATIVA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(fecha);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)?.value;

  return `${valor('year')}${valor('month')}${valor('day')}`;
}

export function construirFolioViaje(consecutivo: number, fecha: Date): string {
  return `VIA-${formatearFechaOperativa(fecha)}-${consecutivo
    .toString()
    .padStart(6, '0')}`;
}

export function esUnidadMetrosCubicos(unidad: string): boolean {
  const unidadNormalizada = unidad.trim().toLocaleLowerCase('es-MX');
  return unidadNormalizada === 'm3' || unidadNormalizada === 'm³';
}

const FORMATO_FECHA_SIMPLE = /^\d{4}-\d{2}-\d{2}$/;

export function esFechaSimple(valor: string): boolean {
  return FORMATO_FECHA_SIMPLE.test(valor);
}

export function inicioDiaOperativo(fecha: string): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const fechaValidada = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    fechaValidada.getUTCFullYear() !== anio ||
    fechaValidada.getUTCMonth() !== mes - 1 ||
    fechaValidada.getUTCDate() !== dia
  ) {
    throw new RangeError('Fecha operativa inválida');
  }

  let instante = Date.UTC(anio, mes - 1, dia);
  for (let intento = 0; intento < 3; intento += 1) {
    const partes = new Intl.DateTimeFormat('en-US', {
      timeZone: ZONA_HORARIA_OPERATIVA,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(instante));
    const numero = (tipo: Intl.DateTimeFormatPartTypes) =>
      Number(partes.find((parte) => parte.type === tipo)?.value);
    const representacionLocal = Date.UTC(
      numero('year'),
      numero('month') - 1,
      numero('day'),
      numero('hour'),
      numero('minute'),
      numero('second'),
    );
    const objetivo = Date.UTC(anio, mes - 1, dia);
    instante += objetivo - representacionLocal;
  }
  return new Date(instante);
}

export function sumarDiasFechaSimple(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const resultado = new Date(Date.UTC(anio, mes - 1, dia + dias));
  return `${resultado.getUTCFullYear()}-${String(
    resultado.getUTCMonth() + 1,
  ).padStart(2, '0')}-${String(resultado.getUTCDate()).padStart(2, '0')}`;
}
