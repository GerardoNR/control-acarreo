export const TIPOS_PAPELERA = [
  'checador',
  'chofer',
  'camion',
  'material',
  'ubicacion',
  'proyecto',
] as const;

export type TipoPapelera = (typeof TIPOS_PAPELERA)[number];

export const PAPELERA_RETENCION_DIAS = 30;
export const PAPELERA_RETENCION_MS =
  PAPELERA_RETENCION_DIAS * 24 * 60 * 60 * 1000;

export interface PapeleraItem {
  id: number;
  nombre: string;
  tipo: TipoPapelera;
  tipo_ubicacion?: string;
  deleted_at: Date;
  delete_after: Date;
  tiene_historial: boolean;
}
