"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { CatalogAlert } from "@/components/catalogs/catalog-ui";
import {
  MetricCard,
  ProgressBar,
  StateBadge,
  quantity,
} from "@/components/operations/operation-ui";
import { StickyHorizontalScroll } from "@/components/tables/sticky-horizontal-scroll";
import { ordenesAcarreoService } from "@/services/ordenes-acarreo.service";
import type { OrdenAcarreoDetalle } from "@/types/ordenes-acarreo";
export default function OrdenDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [item, setItem] = useState<OrdenAcarreoDetalle | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    ordenesAcarreoService
      .get(Number(id))
      .then(setItem)
      .catch(() => setError("No fue posible cargar la orden."));
  }, [id]);
  if (error) return <CatalogAlert variant="error">{error}</CatalogAlert>;
  if (!item) return <p className="p-8">Cargando…</p>;
  return (
    <section>
      <Link
        href="/dashboard/ordenes-acarreo"
        className="text-sm font-semibold text-blue-600"
      >
        ← Volver a órdenes
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-blue-600">Orden de acarreo</p>
          <h2 className="text-3xl font-semibold">{item.folio}</h2>
          <p className="mt-1 text-[#475569]">
            {item.proyecto.nombre} · {item.material.nombre}
          </p>
        </div>
        <StateBadge>{item.estado.replace("_", " ")}</StateBadge>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Solicitado"
          value={quantity(item.cantidad_solicitada, item.unidad_medida)}
        />
        <MetricCard
          label="Transportado"
          value={quantity(item.transportado, item.unidad_medida)}
        />
        <MetricCard
          label="Pendiente"
          value={quantity(item.pendiente, item.unidad_medida)}
          detail={
            Number(item.excedente) > 0
              ? `Excedente: ${quantity(item.excedente, item.unidad_medida)}`
              : undefined
          }
        />
        <MetricCard
          label="Viajes completados"
          value={item.viajes_completados}
        />
        <MetricCard
          label="Avance"
          value={<ProgressBar value={item.avance_porcentaje} />}
        />
      </div>
      <div className="mt-5 grid gap-4 rounded-xl border border-[#CBD5E1] bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Info l="Origen" v={item.ubicacion_origen.nombre} />
        <Info l="Destino" v={item.ubicacion_destino.nombre} />
        <Info l="Fecha inicio" v={item.fecha_inicio} />
        <Info l="Fecha fin" v={item.fecha_fin ?? "—"} />
        <div className="sm:col-span-2 lg:col-span-4">
          <Info l="Observaciones" v={item.observaciones ?? "—"} />
        </div>
      </div>
      <h2 className="mt-8 text-xl font-semibold">Viajes relacionados</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-[#CBD5E1] bg-white">
        <StickyHorizontalScroll>
          <table className="admin-table min-w-230">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600">
              <tr>
                {[
                  "Folio",
                  "Camión",
                  "Chofer",
                  "Cantidad",
                  "Salida",
                  "Llegada",
                  "Estado",
                ].map((x) => (
                  <th className="px-4 py-3" key={x}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {item.viajes.length ? (
                item.viajes.map((v) => (
                  <tr key={v.id}>
                    <td className="px-4 py-3">
                      <Link
                        className="font-semibold text-blue-600"
                        href={`/dashboard/viajes/${v.id}`}
                      >
                        {v.folio}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {v.camion.numero_economico ?? v.camion.placas}
                    </td>
                    <td className="px-4 py-3">
                      {[v.chofer.nombre, v.chofer.apellido_paterno]
                        .filter(Boolean)
                        .join(" ")}
                    </td>
                    <td className="px-4 py-3">
                      {quantity(v.cantidad, v.unidad_medida)}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(v.fecha_hora_salida).toLocaleString("es-MX")}
                    </td>
                    <td className="px-4 py-3">
                      {v.fecha_hora_llegada
                        ? new Date(v.fecha_hora_llegada).toLocaleString("es-MX")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StateBadge>{v.estado}</StateBadge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Aún no hay viajes relacionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </StickyHorizontalScroll>
      </div>
    </section>
  );
}
function Info({ l, v }: { l: string; v: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-slate-500">{l}</dt>
      <dd className="mt-1 text-sm text-slate-900">{v}</dd>
    </div>
  );
}
