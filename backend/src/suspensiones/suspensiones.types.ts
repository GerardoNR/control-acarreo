import { TipoEntidadSuspension } from './suspension.entity';

export const MOTIVOS_SUSPENSION: Record<TipoEntidadSuspension, string[]> = {
  [TipoEntidadSuspension.CHECADOR]: [
    'Administrativo',
    'Vacaciones',
    'Incapacidad',
    'Permiso',
    'Otro',
  ],
  [TipoEntidadSuspension.CHOFER]: [
    'Licencia/documentación',
    'Incapacidad',
    'Vacaciones',
    'Permiso',
    'Sanción',
    'Administrativo',
    'Otro',
  ],
  [TipoEntidadSuspension.CAMION]: [
    'Mantenimiento preventivo',
    'Mantenimiento correctivo',
    'Avería',
    'Documentación',
    'Fuera de servicio',
    'Otro',
  ],
  [TipoEntidadSuspension.UBICACION]: [
    'Acceso restringido',
    'Condiciones climáticas',
    'Mantenimiento',
    'Cierre temporal',
    'Seguridad',
    'Operación',
    'Otro',
  ],
};

export interface SuspensionResumen {
  id: number;
  motivo: string;
  observaciones: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  indefinida: boolean;
}
