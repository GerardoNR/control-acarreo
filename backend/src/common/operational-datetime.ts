export const ZONA_HORARIA_OPERATIVA = 'America/Monterrey';

export interface PartesFechaHoraOperativa {
  anio: string;
  mes: string;
  dia: string;
  hora: string;
  minuto: string;
  segundo: string;
}

export function obtenerPartesFechaHoraOperativa(
  fecha: Date,
): PartesFechaHoraOperativa {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA_OPERATIVA,
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(fecha);
  const valor = (tipo: Intl.DateTimeFormatPartTypes): string => {
    const parte = partes.find((item) => item.type === tipo)?.value;
    if (!parte) throw new Error(`No fue posible obtener ${tipo}`);
    return parte;
  };

  return {
    anio: valor('year'),
    mes: valor('month'),
    dia: valor('day'),
    hora: valor('hour'),
    minuto: valor('minute'),
    segundo: valor('second'),
  };
}

export function obtenerFechaOperativa(fecha: Date): string {
  const partes = obtenerPartesFechaHoraOperativa(fecha);
  return `20${partes.anio}-${partes.mes}-${partes.dia}`;
}
