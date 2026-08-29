"use client";

import { useEffect, useState } from "react";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { OperationSummary } from "@/components/dashboard/operation-summary";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/stat-card";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardResumen } from "@/types/dashboard";

const numberFormatter = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 3,
});

function DashboardPanelSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`${compact ? "h-48" : "h-52"} animate-pulse rounded-xl border border-[#CBD5E1] bg-white p-5`} aria-hidden="true">
      <div className="h-4 w-36 rounded bg-slate-200" />
      <div className="mt-2 h-3 w-24 rounded bg-slate-100" />
      <div className={`${compact ? "h-24" : "h-28"} mt-6 rounded-lg bg-slate-100`} />
    </div>
  );
}

export default function DashboardPage() {
  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void dashboardService.getResumen()
      .then((summary) => {
        if (!active) return;
        setResumen(summary);
        setError(false);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function retryDashboard() {
    setLoading(true);
    setError(false);
    try {
      setResumen(await dashboardService.getResumen());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <p className="text-sm font-semibold text-[#2563EB]">Panel administrativo</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#0F172A]">Dashboard</h1>
      <p className="mt-2 text-sm leading-6 text-[#475569]">Resumen ejecutivo de la operación.</p>

      {error && !resumen ? (
        <div className="mt-5 flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between" role="alert">
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">No fue posible cargar el Dashboard</p>
            <p className="mt-1 text-sm text-[#475569]">Reintenta para consultar el resumen actualizado de la operación.</p>
          </div>
          <button type="button" onClick={() => void retryDashboard()} className="rounded-lg bg-[#2563EB] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8] focus-visible:outline-offset-2">
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {loading || !resumen ? (
              Array.from({ length: 4 }, (_, index) => <StatCardSkeleton key={index} />)
            ) : (
              <>
                <StatCard label="Viajes de hoy" value={numberFormatter.format(resumen.viajes_hoy)} icon="trips" variant="primary" />
                <StatCard label="En tránsito" value={numberFormatter.format(resumen.en_transito)} icon="truck" variant="info" />
                <StatCard label="Completados hoy" value={numberFormatter.format(resumen.completados_hoy)} icon="check" variant="success" />
                <StatCard label="Cancelados hoy" value={numberFormatter.format(resumen.cancelados_hoy)} icon="cancel" variant="danger" />
              </>
            )}
          </div>

          <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">
              {loading || !resumen ? <DashboardPanelSkeleton /> : <ActivityChart data={resumen.actividad_ultimos_7_dias} />}
            </div>
            <div className="min-w-0">
              {loading || !resumen ? <DashboardPanelSkeleton compact /> : <OperationSummary data={resumen.operacion_actual} />}
            </div>
          </div>

          <div className="mt-4 min-w-0">
            {loading || !resumen ? <DashboardPanelSkeleton compact /> : (
              <VolumeChart data={resumen.volumen_ultimos_7_dias} />
            )}
          </div>
        </>
      )}
    </section>
  );
}
