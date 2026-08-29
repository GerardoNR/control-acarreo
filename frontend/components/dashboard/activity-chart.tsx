import type { DashboardResumen } from "@/types/dashboard";

type Activity = DashboardResumen["actividad_ultimos_7_dias"][number];

const dateFormatter = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" });
const numberFormatter = new Intl.NumberFormat("es-MX");
const series = [
  { key: "salidas", label: "Salidas", color: "bg-[#3B82F6]" },
  { key: "completados", label: "Completados", color: "bg-emerald-500" },
  { key: "cancelados", label: "Cancelados", color: "bg-red-400" },
] as const;

function formatDate(fecha: string) {
  const [year, month, day] = fecha.split("-").map(Number);
  return dateFormatter.format(new Date(Date.UTC(year, month - 1, day)));
}

function calculateScale(maxValue: number) {
  if (maxValue <= 0) return { max: 1, step: 1 };
  const targetStep = maxValue / 4;
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const candidates = [1, 2, 2.5, 5, 10].map((value) => value * magnitude);
  const step = Math.max(
    1,
    candidates.reduce((closest, candidate) =>
      Math.abs(candidate - targetStep) < Math.abs(closest - targetStep)
        ? candidate
        : closest,
    ),
  );
  return { max: Math.ceil(maxValue / step) * step, step };
}

export function ActivityChart({ data }: { data: Activity[] }) {
  const maxValue = Math.max(0, ...data.flatMap(({ salidas, completados, cancelados }) => [salidas, completados, cancelados]));
  const hasActivity = maxValue > 0;
  const { max: scaleMax, step: scaleStep } = calculateScale(maxValue);
  const scaleTicks = Array.from(
    { length: Math.floor(scaleMax / scaleStep) + 1 },
    (_, index) => scaleMax - index * scaleStep,
  );
  const activityByDay = data.map((item) => ({
    fecha: item.fecha,
    total: item.salidas + item.completados + item.cancelados,
  }));
  const daysWithActivity = activityByDay.filter(({ total }) => total > 0).length;
  const highestActivity = Math.max(0, ...activityByDay.map(({ total }) => total));
  const busiestDays = activityByDay
    .filter(({ total }) => total > 0 && total === highestActivity)
    .map(({ fecha }) => formatDate(fecha));

  return (
    <article className="h-full min-w-0 rounded-xl border border-[#CBD5E1] bg-white p-4 sm:p-5">
      <div>
        <h2 className="text-base font-semibold text-[#0F172A]">Actividad de viajes</h2>
        <p className="mt-0.5 text-xs text-[#475569]">Últimos 7 días</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#475569]" aria-label="Series de la gráfica">
        {series.map(({ label, color }) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${color}`} aria-hidden="true" />
            {label}
          </span>
        ))}
      </div>

      <div className="mt-4" role="img" aria-label={`Actividad de viajes de los últimos 7 días. ${data.map((item) => `${formatDate(item.fecha)}: ${item.salidas} salidas, ${item.completados} completados y ${item.cancelados} cancelados`).join(". ")}`}>
        <div className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2">
          <div className="flex h-52 flex-col justify-between pb-px text-right text-[10px] tabular-nums text-[#64748B] sm:text-xs" aria-hidden="true">
            {scaleTicks.map((tick) => <span key={tick}>{numberFormatter.format(tick)}</span>)}
          </div>
          <div className="relative flex h-52 items-end gap-2 border-b border-l border-[#CBD5E1] px-1 sm:gap-5">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden="true">
              {scaleTicks.map((tick) => <span key={tick} className="border-t border-dashed border-[#E2E8F0] first:border-[#CBD5E1]" />)}
            </div>
            {data.map((item) => (
              <div key={item.fecha} className="relative z-10 flex h-full min-w-0 flex-1 items-end justify-center gap-0.5 sm:gap-1" title={`${formatDate(item.fecha)}\n- Salidas: ${numberFormatter.format(item.salidas)}\n- Completados: ${numberFormatter.format(item.completados)}\n- Cancelados: ${numberFormatter.format(item.cancelados)}`}>
                {series.map(({ key, color }) => {
                  const value = item[key];
                  const height = value > 0 ? (value / scaleMax) * 100 : 0;
                  const labelInside = height >= 16;
                  return (
                    <span key={key} className={`relative w-full max-w-5 rounded-t-sm ${color}`} style={{ height: `${height}%` }}>
                      {value > 0 && (
                        <span className={labelInside ? "absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[10px] font-semibold tabular-nums text-white drop-shadow-sm" : "absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-semibold tabular-nums text-[#334155]"}>
                          {numberFormatter.format(value)}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 ml-[2.25rem] grid grid-cols-7 gap-1 text-center text-[10px] text-[#475569] sm:text-xs">
          {data.map(({ fecha }) => <span key={fecha} className="truncate">{formatDate(fecha)}</span>)}
        </div>
      </div>

      {!hasActivity && <p className="mt-3 text-center text-xs text-[#475569]">Sin actividad registrada en este periodo.</p>}
      <p className="mt-3 border-t border-[#E2E8F0] pt-2.5 text-xs text-[#475569]">
        <span className="font-medium text-[#0F172A]">Mayor actividad:</span>{" "}
        {busiestDays.length > 0 ? busiestDays.join(" y ") : "sin actividad"}
        <span className="mx-2 text-[#CBD5E1]" aria-hidden="true">•</span>
        <span className="font-medium text-[#0F172A]">Días con actividad:</span>{" "}
        {daysWithActivity} de {data.length}
      </p>
    </article>
  );
}
