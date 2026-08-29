import { randomInt } from 'node:crypto';
import { obtenerPartesFechaHoraOperativa } from '../common/operational-datetime';

export const LONGITUD_CODIGO_TICKET = 21;
export const MAXIMO_REINTENTOS_CODIGO_TICKET = 10;

export function generarSufijoTicket(): string {
  return randomInt(0, 10_000).toString().padStart(4, '0');
}

export function construirCodigoTicket(
  fecha: Date,
  codigoUnidad: string,
  sufijo: string,
): string {
  if (!/^\d{5}$/.test(codigoUnidad)) {
    throw new Error(
      'El código de ticket de la unidad debe contener exactamente 5 dígitos',
    );
  }
  if (!/^\d{4}$/.test(sufijo)) {
    throw new Error('El sufijo del ticket debe contener exactamente 4 dígitos');
  }

  const partes = obtenerPartesFechaHoraOperativa(fecha);
  return [
    partes.anio,
    partes.mes,
    partes.dia,
    codigoUnidad,
    partes.hora,
    partes.minuto,
    partes.segundo,
    sufijo,
  ].join('');
}
