import { formatearFechaOperativa } from '../viajes/viajes.constants';

export enum EstadoLicencia {
  VIGENTE = 'VIGENTE',
  POR_VENCER = 'POR_VENCER',
  VENCIDA = 'VENCIDA',
  SIN_FECHA = 'SIN_FECHA',
}

const MILISEGUNDOS_DIA = 86_400_000;

function fechaOperativaSimple(ahora: Date): string {
  const compacta = formatearFechaOperativa(ahora);
  return `${compacta.slice(0, 4)}-${compacta.slice(4, 6)}-${compacta.slice(6, 8)}`;
}

function epochFechaSimple(fecha: string): number {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return Date.UTC(anio, mes - 1, dia);
}

export function diasParaVencimiento(
  vigencia: string,
  ahora = new Date(),
): number {
  return Math.round(
    (epochFechaSimple(vigencia) -
      epochFechaSimple(fechaOperativaSimple(ahora))) /
      MILISEGUNDOS_DIA,
  );
}

export function obtenerEstadoLicencia(
  vigencia: string | null | undefined,
  ahora = new Date(),
): EstadoLicencia {
  if (!vigencia) return EstadoLicencia.SIN_FECHA;
  const dias = diasParaVencimiento(vigencia, ahora);
  if (dias < 0) return EstadoLicencia.VENCIDA;
  if (dias <= 30) return EstadoLicencia.POR_VENCER;
  return EstadoLicencia.VIGENTE;
}
