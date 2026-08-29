import Link from "next/link";
import type { DashboardResumen } from "@/types/dashboard";

type Volume = DashboardResumen["volumen_ultimos_7_dias"][number];

const numberFormatter = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 3,
});

export function VolumeChart({ data }: { data: Volume[] }) {
  const totals = Array.from(
    data.reduce((byUnit, item) => {
      const current = byUnit.get(item.unidad_medida) ?? {
        cantidad: 0,
        fechas: new Set<string>(),
      };
      current.cantidad += item.cantidad;
      if (item.cantidad > 0) current.fechas.add(item.fecha);
      byUnit.set(item.unidad_medida, current);
      return byUnit;
    }, new Map<string, { cantidad: number; fechas: Set<string> }>())
  );

  return (
    <article className="flex h-full min-w-0 flex-col rounded-xl border border-[#CBD5E1] bg-white p-4 sm:p-5">
      <div>
        <h2 className="text-base font-semibold text-[#0F172A]">
          Material transportado
        </h2>
        <p className="mt-0.5 text-xs text-[#475569]">Últimos 7 días</p>
      </div>

      {totals.length === 0 ? (
        <p className="my-6 text-sm text-[#475569]">
          No hay volumen transportado registrado en los últimos 7 días.
        </p>
      ) : (
        <dl className="my-4 flex flex-wrap gap-x-10 gap-y-3" aria-label="Material transportado por unidad de medida">
          {totals.map(([unit, total]) => (
            <div key={unit} className="min-w-28">
              <dt className="sr-only">Unidad {unit}</dt>
              <dd className="text-2xl font-semibold tracking-tight text-[#0F172A]">
                {numberFormatter.format(total.cantidad)}{" "}
                <span className="text-base font-medium text-[#475569]">{unit}</span>
              </dd>
              <p className="mt-0.5 text-xs text-[#475569]">
                {total.fechas.size} {total.fechas.size === 1 ? "día" : "días"} con movimientos
              </p>
            </div>
          ))}
        </dl>
      )}

      <Link href="/dashboard/reportes" className="mt-auto inline-flex w-fit items-center text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] focus-visible:outline-offset-2">
        Ver reportes <span className="ml-1" aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
