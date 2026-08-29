"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { StickyHorizontalScroll } from "@/components/tables/sticky-horizontal-scroll";
import { camionesService } from "@/services/camiones.service";
import { choferesService } from "@/services/choferes.service";
import { materialesService } from "@/services/materiales.service";
import { proyectosService } from "@/services/proyectos.service";
import { ubicacionesService } from "@/services/ubicaciones.service";
import { viajesService } from "@/services/viajes.service";
import type {
  Camion,
  Chofer,
  Material,
  Proyecto,
  Ubicacion,
} from "@/types/catalogs";
import type {
  EstadoViaje,
  ViajesPaginatedResponse,
  ViajesQuery,
} from "@/types/viajes";

const initialFilters = {
  folio: "",
  estado: "",
  proyecto_id: "",
  material_id: "",
  camion_id: "",
  chofer_id: "",
  ubicacion_origen_id: "",
  ubicacion_destino_id: "",
  fecha_desde: "",
  fecha_hasta: "",
};
const initialQuery: ViajesQuery = { page: 1, limit: 10 };
const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Monterrey",
  dateStyle: "medium",
  timeStyle: "short",
});
const numberFormatter = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 3,
});
const selectClass =
  "h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-blue-100";

function choferNombre(item: Chofer) {
  return [item.nombre, item.apellido_paterno, item.apellido_materno]
    .filter(Boolean)
    .join(" ");
}
function toOptionalId(value: string) {
  return value ? Number(value) : undefined;
}
function pageWindow(current: number, total: number) {
  const pages = new Set([1, total]);
  for (
    let page = Math.max(1, current - 1);
    page <= Math.min(total, current + 1);
    page++
  )
    pages.add(page);
  return [...pages].filter((page) => page > 0).sort((a, b) => a - b);
}

export default function ViajesPage() {
  const [result, setResult] = useState<ViajesPaginatedResponse | null>(null);
  const [query, setQuery] = useState<ViajesQuery>(initialQuery);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [catalogError, setCatalogError] = useState(false);
  const [moreFilters, setMoreFilters] = useState(false);
  const [catalogs, setCatalogs] = useState<{
    proyectos: Proyecto[];
    materiales: Material[];
    camiones: Camion[];
    choferes: Chofer[];
    ubicaciones: Ubicacion[];
  }>({
    proyectos: [],
    materiales: [],
    camiones: [],
    choferes: [],
    ubicaciones: [],
  });

  useEffect(() => {
    let active = true;
    void viajesService
      .list(query)
      .then((data) => {
        if (active) setResult(data);
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
  }, [query]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      proyectosService.list(),
      materialesService.list(),
      camionesService.list(),
      choferesService.list(),
      ubicacionesService.list(),
    ])
      .then(([proyectos, materiales, camiones, choferes, ubicaciones]) => {
        if (active)
          setCatalogs({
            proyectos,
            materiales,
            camiones,
            choferes,
            ubicaciones,
          });
      })
      .catch(() => {
        if (active) setCatalogError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  function runQuery(next: ViajesQuery) {
    setLoading(true);
    setError(false);
    setQuery(next);
  }

  function applyFilters() {
    const folio = filters.folio.trim();
    runQuery({
      page: 1,
      limit: query.limit,
      folio: folio || undefined,
      estado: (filters.estado || undefined) as EstadoViaje | undefined,
      proyecto_id: toOptionalId(filters.proyecto_id),
      material_id: toOptionalId(filters.material_id),
      camion_id: toOptionalId(filters.camion_id),
      chofer_id: toOptionalId(filters.chofer_id),
      ubicacion_origen_id: toOptionalId(filters.ubicacion_origen_id),
      ubicacion_destino_id: toOptionalId(filters.ubicacion_destino_id),
      fecha_desde: filters.fecha_desde || undefined,
      fecha_hasta: filters.fecha_hasta || undefined,
    });
  }

  function clearFilters() {
    setFilters(initialFilters);
    runQuery({ page: 1, limit: query.limit });
  }
  const hasFilters = Object.values(filters).some(Boolean);
  const total = result?.meta.total ?? 0;
  const first = total ? (query.page - 1) * query.limit + 1 : 0;
  const last = Math.min(query.page * query.limit, total);
  const pages = useMemo(
    () => pageWindow(query.page, result?.meta.total_pages ?? 0),
    [query.page, result?.meta.total_pages],
  );

  const rowOffset = (query.page - 1) * query.limit;

  return (
    <section>
      <p className="text-sm font-semibold text-[#2563EB]">Panel administrativo</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#0F172A]">Viajes</h1>
      <p className="mt-2 text-sm leading-6 text-[#475569]">
        Consulta y seguimiento de operaciones de transporte.
      </p>
      <div className="mt-4 rounded-xl border border-[#CBD5E1] bg-white p-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            applyFilters();
          }}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label htmlFor="viajes-folio">
              <span className="mb-1.5 block text-xs font-semibold text-[#475569]">
                Buscar por
              </span>
              <input
                id="viajes-folio"
                type="search"
                className={selectClass}
                maxLength={19}
                placeholder="Folio del viaje..."
                value={filters.folio}
                onChange={(event) =>
                  setFilters({ ...filters, folio: event.target.value })
                }
              />
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-[#475569]">
                Estado
              </span>
              <select
                className={selectClass}
                value={filters.estado}
                onChange={(event) =>
                  setFilters({ ...filters, estado: event.target.value })
                }
              >
                <option value="">Todos</option>
                <option value="en_transito">En tránsito</option>
                <option value="completado">Completados</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-[#475569]">
                Proyecto
              </span>
              <select
                className={selectClass}
                value={filters.proyecto_id}
                onChange={(event) =>
                  setFilters({ ...filters, proyecto_id: event.target.value })
                }
              >
                <option value="">Todos</option>
                {catalogs.proyectos.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                    {item.activo ? "" : " (inactivo)"}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-[#475569]">
                  Desde
                </span>
                <input
                  type="date"
                  className={selectClass}
                  value={filters.fecha_desde}
                  onChange={(event) =>
                    setFilters({ ...filters, fecha_desde: event.target.value })
                  }
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-[#475569]">
                  Hasta
                </span>
                <input
                  type="date"
                  className={selectClass}
                  value={filters.fecha_hasta}
                  onChange={(event) =>
                    setFilters({ ...filters, fecha_hasta: event.target.value })
                  }
                />
              </label>
            </div>
          </div>
          {moreFilters ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <FilterSelect
                label="Material"
                value={filters.material_id}
                onChange={(value) =>
                  setFilters({ ...filters, material_id: value })
                }
              >
                {catalogs.materiales.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                    {item.activo ? "" : " (inactivo)"}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Camión"
                value={filters.camion_id}
                onChange={(value) =>
                  setFilters({ ...filters, camion_id: value })
                }
              >
                {catalogs.camiones.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.numero_economico ?? item.placas}
                    {item.activo ? "" : " (inactivo)"}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Chofer"
                value={filters.chofer_id}
                onChange={(value) =>
                  setFilters({ ...filters, chofer_id: value })
                }
              >
                {catalogs.choferes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {choferNombre(item)}
                    {item.activo ? "" : " (inactivo)"}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Origen"
                value={filters.ubicacion_origen_id}
                onChange={(value) =>
                  setFilters({ ...filters, ubicacion_origen_id: value })
                }
              >
                {catalogs.ubicaciones.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                    {item.activo ? "" : " (inactivo)"}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Destino"
                value={filters.ubicacion_destino_id}
                onChange={(value) =>
                  setFilters({ ...filters, ubicacion_destino_id: value })
                }
              >
                {catalogs.ubicaciones.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                    {item.activo ? "" : " (inactivo)"}
                  </option>
                ))}
              </FilterSelect>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="h-9 rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
            >
              Aplicar filtros
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="h-9 rounded-lg border border-[#CBD5E1] px-4 text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9]"
            >
              Limpiar filtros
            </button>
            <button
              type="button"
              onClick={() => setMoreFilters((value) => !value)}
              className="text-sm font-semibold text-[#2563EB]"
            >
              {moreFilters ? "Menos filtros" : "Más filtros"}
            </button>
            {catalogError ? (
              <span className="text-xs text-amber-700">
                No se pudieron cargar algunos catálogos.
              </span>
            ) : null}
          </div>
        </form>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-[#CBD5E1] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-4 py-3">
          <p className="text-sm text-[#475569]">
            {loading
              ? "Consultando viajes…"
              : `Mostrando ${first}–${last} de ${total}`}
          </p>
          <label className="flex items-center gap-2 text-sm text-[#475569]">
            Por página
            <select
              className="h-9 rounded-lg border border-[#CBD5E1] bg-white px-2"
              value={query.limit}
              onChange={(event) =>
                runQuery({
                  ...query,
                  page: 1,
                  limit: Number(event.target.value),
                })
              }
            >
              {[10, 25, 50, 100].map((limit) => (
                <option key={limit}>{limit}</option>
              ))}
            </select>
          </label>
        </div>
        {error ? (
          <div className="flex items-center justify-between gap-4 p-5">
            <p className="text-sm text-[#475569]">
              No fue posible cargar los viajes.
            </p>
            <button
              type="button"
              onClick={() => runQuery({ ...query })}
              className="text-sm font-semibold text-[#2563EB]"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <StickyHorizontalScroll>
            <table className="admin-table indi-numbered min-w-290">
              <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#475569]">
                <tr>
                  <th className="w-14 px-5 py-3">#</th>
                  <th className="px-4 py-3">Folio</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Camión</th>
                  <th className="px-4 py-3">Proyecto</th>
                  <th className="px-4 py-3">Ruta</th>
                  <th className="px-4 py-3">Material / cantidad</th>
                  <th className="px-4 py-3">Salida</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {loading ? (
                  Array.from({ length: 5 }, (_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td colSpan={9} className="px-5 py-4">
                        <div className="h-4 rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : !result?.data.length ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-10 text-center text-[#475569]"
                    >
                      <p>
                        {hasFilters
                          ? "No hay viajes que coincidan con los filtros seleccionados."
                          : "No se encontraron viajes."}
                      </p>
                      {hasFilters ? (
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="mt-2 font-semibold text-[#2563EB]"
                        >
                          Limpiar filtros
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ) : (
                  result.data.map((viaje, index) => (
                    <tr key={viaje.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-5 py-3.5 tabular-nums text-[#64748B]">
                        {rowOffset + index + 1}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-medium text-[#0F172A]">
                        {viaje.folio}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge estado={viaje.estado} />
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-[#0F172A]">
                          {viaje.camion.numero_economico ?? "Sin económico"}
                        </p>
                        <p className="text-xs text-[#475569]">
                          {viaje.camion.placas}
                        </p>
                      </td>
                      <td className="max-w-44 truncate px-4 py-3.5 text-[#475569]">
                        {viaje.proyecto.nombre}
                      </td>
                      <td className="px-4 py-3.5 text-[#475569]">
                        <p className="max-w-40 truncate">
                          {viaje.ubicacion_origen.nombre}
                        </p>
                        <p className="text-xs text-[#94A3B8]">↓</p>
                        <p className="max-w-40 truncate">
                          {viaje.ubicacion_destino.nombre}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="max-w-40 truncate text-[#0F172A]">
                          {viaje.material.nombre}
                        </p>
                        <p className="text-xs text-[#475569]">
                          {numberFormatter.format(
                            Number(viaje.cantidad_salida),
                          )}{" "}
                          {viaje.unidad_medida}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[#475569]">
                        {dateFormatter.format(
                          new Date(viaje.fecha_hora_salida),
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/dashboard/viajes/${viaje.id}`}
                          className="whitespace-nowrap text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
                        >
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </StickyHorizontalScroll>
        )}
        {!error && (result?.meta.total_pages ?? 0) > 1 ? (
          <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-[#E2E8F0] px-4 py-3">
            <PageButton
              disabled={query.page === 1}
              onClick={() => runQuery({ ...query, page: query.page - 1 })}
            >
              Anterior
            </PageButton>
            {pages.map((page, index) => (
              <span key={page} className="contents">
                {index > 0 && page - pages[index - 1] > 1 ? (
                  <span className="px-1 text-[#94A3B8]">…</span>
                ) : null}
                <PageButton
                  active={page === query.page}
                  onClick={() => runQuery({ ...query, page })}
                >
                  {page}
                </PageButton>
              </span>
            ))}
            <PageButton
              disabled={query.page === result?.meta.total_pages}
              onClick={() => runQuery({ ...query, page: query.page + 1 })}
            >
              Siguiente
            </PageButton>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-semibold text-[#475569]">
        {label}
      </span>
      <select
        className={selectClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Todos</option>
        {children}
      </select>
    </label>
  );
}
function PageButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`h-8 min-w-8 rounded-md px-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${active ? "bg-[#2563EB] text-white" : "border border-[#CBD5E1] bg-white text-[#475569] hover:bg-[#F1F5F9]"}`}
    >
      {children}
    </button>
  );
}
