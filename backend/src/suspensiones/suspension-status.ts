import { formatearFechaOperativa } from '../viajes/viajes.constants';

function fechaLocal(fecha: Date): string {
  const valor = formatearFechaOperativa(fecha);
  return `${valor.slice(0, 4)}-${valor.slice(4, 6)}-${valor.slice(6)}`;
}

export function suspensionEstaVigente(
  suspension: {
    fecha_inicio: string;
    fecha_fin: string | null;
    indefinida: boolean;
    finalizada_at: Date | null;
  },
  fecha = new Date(),
): boolean {
  const hoy = fechaLocal(fecha);
  return (
    suspension.finalizada_at === null &&
    suspension.fecha_inicio <= hoy &&
    (suspension.indefinida ||
      (suspension.fecha_fin !== null && suspension.fecha_fin >= hoy))
  );
}
