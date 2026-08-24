"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { dashboardService } from "@/services/dashboard.service";
import type { DashboardResumen, ViajeResumen } from "@/types/dashboard";

const numberFormatter = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 3 });
const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Monterrey",
  dateStyle: "medium",
  timeStyle: "short",
});

export default function DashboardPage() {
  const [resumen, setResumen] = useState<DashboardResumen | null>(null);
  const [viajes, setViajes] = useState<ViajeResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const [summary, recentTrips] = await Promise.all([
        dashboardService.getResumen(),
        dashboardService.getViajesRecientes(),
      ]);
      setResumen(summary);
      setViajes(recentTrips.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([
      dashboardService.getResumen(),
      dashboardService.getViajesRecientes(),
    ])
      .then(([summary, recentTrips]) => {
        if (!active) return;
        setResumen(summary);
        setViajes(recentTrips.data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function retryDashboard() {
    setLoading(true);
    setError(false);
    void loadDashboard();
  }

  const volumen = resumen?.volumen_transportado.length
    ? resumen.volumen_transportado
        .map(({ cantidad, unidad_medida }) => `${numberFormatter.format(cantidad)} ${unidad_medida}`)
        .join(" · ")
    : "0";

  return (
    <section>
      <p className="text-sm font-semibold text-[#2563EB]">Panel administrativo</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#0F172A]">Dashboard</h1>
      <p className="mt-2 text-sm leading-6 text-[#475569]">Resumen general de operaciones.</p>

      {error ? (
        <div className="mt-6 flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#475569]">No fue posible cargar el resumen de operaciones.</p>
          <button type="button" onClick={retryDashboard} className="rounded-lg bg-[#2563EB] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]">
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {loading || !resumen ? (
              Array.from({ length: 5 }, (_, index) => <StatCardSkeleton key={index} />)
            ) : (
              <>
                <StatCard label="Viajes de hoy" value={numberFormatter.format(resumen.viajes_hoy)} icon="trips" variant="primary" />
                <StatCard label="En tránsito" value={numberFormatter.format(resumen.en_transito)} icon="truck" variant="info" />
                <StatCard label="Completados" value={numberFormatter.format(resumen.completados_hoy)} icon="check" variant="success" />
                <StatCard label="Cancelados" value={numberFormatter.format(resumen.cancelados_hoy)} icon="cancel" variant="danger" />
                <StatCard label="Volumen transportado" value={volumen} icon="volume" variant="primary" />
              </>
            )}
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-[#CBD5E1] bg-white">
            <div className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] px-4 py-3.5 sm:px-5">
              <div>
                <h2 className="text-base font-semibold text-[#0F172A]">Viajes recientes</h2>
                <p className="mt-0.5 text-xs text-[#475569]">Últimas salidas registradas</p>
              </div>
              <Link href="/dashboard/viajes" className="whitespace-nowrap text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]">Ver viajes</Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-210 text-left text-sm">
                <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase tracking-wide text-[#475569]">
                  <tr>
                    <th className="px-5 py-3">Folio</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Camión</th><th className="px-4 py-3">Ruta</th><th className="px-4 py-3">Material</th><th className="px-5 py-3">Salida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {loading ? (
                    Array.from({ length: 3 }, (_, index) => <tr key={index} className="animate-pulse"><td colSpan={6} className="px-5 py-4"><div className="h-4 rounded bg-slate-100" /></td></tr>)
                  ) : viajes.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-[#475569]">No hay viajes registrados.</td></tr>
                  ) : (
                    viajes.map((viaje) => (
                      <tr key={viaje.id} className="text-[#0F172A] hover:bg-[#F8FAFC]">
                        <td className="whitespace-nowrap px-5 py-3.5 font-medium">{viaje.folio}</td>
                        <td className="px-4 py-3.5"><StatusBadge estado={viaje.estado} /></td>
                        <td className="px-4 py-3.5"><p className="font-medium">{viaje.camion.numero_economico ?? "Sin número"}</p><p className="mt-0.5 text-xs text-[#475569]">{viaje.camion.placas}</p></td>
                        <td className="px-4 py-3.5"><p className="max-w-44 truncate">{viaje.ubicacion_origen.nombre}</p><p className="my-0.5 text-xs text-[#94A3B8]">↓</p><p className="max-w-44 truncate">{viaje.ubicacion_destino.nombre}</p></td>
                        <td className="max-w-44 truncate px-4 py-3.5">{viaje.material.nombre}</td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-[#475569]">{dateFormatter.format(new Date(viaje.fecha_hora_salida))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
