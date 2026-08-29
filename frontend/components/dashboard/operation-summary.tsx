import Link from "next/link";
import { Icon, type IconName } from "@/components/admin/icons";
import type { DashboardResumen } from "@/types/dashboard";

type Operation = DashboardResumen["operacion_actual"];
const numberFormatter = new Intl.NumberFormat("es-MX");

export function OperationSummary({ data }: { data: Operation }) {
  const indicators: Array<{ label: string; value: number; icon: IconName }> = [
    { label: "Camiones operando", value: data.camiones_operando, icon: "truck" },
    { label: "Proyectos activos", value: data.proyectos_activos, icon: "folder" },
    { label: "Viajes en tránsito", value: data.viajes_en_transito, icon: "trips" },
  ];

  return (
    <article className="flex h-full flex-col rounded-xl border border-[#CBD5E1] bg-white p-4 sm:p-5">
      <h2 className="text-base font-semibold text-[#0F172A]">Operación actual</h2>
      <div className="mt-4 grid gap-2.5">
        {indicators.map(({ label, value, icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-lg bg-[#F8FAFC] px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#DBEAFE] text-[#2563EB]">
              <Icon name={icon} className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 text-sm text-[#475569]">{label}</span>
            <strong className="tabular-nums text-[#0F172A]">{numberFormatter.format(value)}</strong>
          </div>
        ))}
      </div>

      <Link href="/dashboard/viajes" className="mt-4 inline-flex w-fit items-center text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] focus-visible:outline-offset-2">
        Ver viajes <span className="ml-1" aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
