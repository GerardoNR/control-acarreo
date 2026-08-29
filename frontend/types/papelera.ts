export type TipoPapelera =
  "checador" | "chofer" | "camion" | "material" | "ubicacion" | "proyecto";

export interface PapeleraItem {
  id: number;
  nombre: string;
  tipo: TipoPapelera;
  tipo_ubicacion?: "banco" | "frente";
  deleted_at: string;
  delete_after: string;
  tiene_historial: boolean;
}
