import type { EstadoViaje } from "@/types/viajes";

const statusStyles: Record<EstadoViaje, { label: string; className: string }> = {
  en_transito: { label: "En tránsito", className: "bg-sky-50 text-sky-700 ring-sky-200" },
  completado: { label: "Completado", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  cancelado: { label: "Cancelado", className: "bg-red-50 text-red-700 ring-red-200" },
};

export function StatusBadge({ estado }: { estado: EstadoViaje }) {
  const status = statusStyles[estado];
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${status.className}`}>{status.label}</span>;
}
