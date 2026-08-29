"use client";

import { Fragment, useEffect, useState, type ReactNode } from "react";
import { CatalogAlert } from "@/components/catalogs/catalog-ui";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { StickyHorizontalScroll } from "@/components/tables/sticky-horizontal-scroll";
import { camionesService } from "@/services/camiones.service";
import { choferesService } from "@/services/choferes.service";
import { materialesService } from "@/services/materiales.service";
import { proyectosService } from "@/services/proyectos.service";
import { reportesService } from "@/services/reportes.service";
import { ubicacionesService } from "@/services/ubicaciones.service";
import type { Camion, Chofer, Material, Proyecto, Ubicacion } from "@/types/catalogs";
import type { ReportesResumen, ReportesViajesQuery, ReportesViajesResponse } from "@/types/reportes";

const emptyFilters = { folio: "", estado: "", proyecto_id: "", material_id: "", camion_id: "", chofer_id: "", ubicacion_origen_id: "", ubicacion_destino_id: "", fecha_desde: "", fecha_hasta: "" };
const inputClass = "h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-blue-100";
const dateFormatter = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Monterrey", dateStyle: "medium", timeStyle: "short" });
const numberFormatter = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 3 });
const dayFormatter = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Monterrey", dateStyle: "full" });
type PageSize = 20 | 50 | 100 | "todos";

export default function ReportesPage() {
  const [resumen, setResumen] = useState<ReportesResumen | null>(null);
  const [result, setResult] = useState<ReportesViajesResponse | null>(null);
  const [filters, setFilters] = useState(emptyFilters);
  const [query, setQuery] = useState<ReportesViajesQuery>({ page: 1, limit: 20 });
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [error, setError] = useState("");
  const [catalogError, setCatalogError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [catalogs, setCatalogs] = useState<{ proyectos: Proyecto[]; materiales: Material[]; camiones: Camion[]; choferes: Chofer[]; ubicaciones: Ubicacion[] }>({ proyectos: [], materiales: [], camiones: [], choferes: [], ubicaciones: [] });

  useEffect(() => {
    let active = true;
    void reportesService.resumen().then((data) => { if (active) setResumen(data); }).catch(() => { if (active) setError("No fue posible cargar el resumen de reportes."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    void reportesService.viajes(query).then((data) => { if (active) setResult(data); }).catch(() => { if (active) setError("No fue posible consultar los viajes del reporte."); }).finally(() => { if (active) setTableLoading(false); });
    return () => { active = false; };
  }, [query]);
  useEffect(() => {
    let active = true;
    void Promise.all([proyectosService.list(), materialesService.list(), camionesService.list(), choferesService.list(), ubicacionesService.list()])
      .then(([proyectos, materiales, camiones, choferes, ubicaciones]) => { if (active) setCatalogs({ proyectos, materiales, camiones, choferes, ubicaciones }); })
      .catch(() => { if (active) setCatalogError(true); });
    return () => { active = false; };
  }, []);

  function buildQuery(page = 1): ReportesViajesQuery {
    const id = (value: string) => value ? Number(value) : undefined;
    return { page, limit: pageSize === "todos" ? 20 : pageSize, todos: pageSize === "todos" || undefined, folio: filters.folio.trim() || undefined, estado: (filters.estado || undefined) as ReportesViajesQuery["estado"], proyecto_id: id(filters.proyecto_id), material_id: id(filters.material_id), camion_id: id(filters.camion_id), chofer_id: id(filters.chofer_id), ubicacion_origen_id: id(filters.ubicacion_origen_id), ubicacion_destino_id: id(filters.ubicacion_destino_id), fecha_desde: filters.fecha_desde || undefined, fecha_hasta: filters.fecha_hasta || undefined };
  }
  function search() { setError(""); setTableLoading(true); setQuery(buildQuery()); }
  function clear() { setFilters(emptyFilters); setError(""); setTableLoading(true); setQuery({ page: 1, limit: pageSize === "todos" ? 20 : pageSize, todos: pageSize === "todos" || undefined }); }
  function changePageSize(value: string) {
    const nextSize: PageSize = value === "todos" ? "todos" : Number(value) as Exclude<PageSize, "todos">;
    setPageSize(nextSize);
    setTableLoading(true);
    setQuery({ ...query, page: 1, limit: nextSize === "todos" ? 20 : nextSize, todos: nextSize === "todos" || undefined });
  }
  async function downloadExcel() {
    setDownloading(true); setError("");
    try {
      const exportQuery = { ...query };
      delete (exportQuery as Partial<ReportesViajesQuery>).page;
      delete (exportQuery as Partial<ReportesViajesQuery>).limit;
      const file = await reportesService.exportarExcel(exportQuery);
      const url = URL.createObjectURL(file.blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = file.filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    } catch { setError("No fue posible generar el archivo Excel."); }
    finally { setDownloading(false); }
  }
  const rowOffset = query.todos ? 0 : ((result?.meta.page ?? 1) - 1) * query.limit;
  let previousDay = "";

  return <section>
    <p className="text-sm font-semibold text-[#2563EB]">Panel administrativo</p>
    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#0F172A]">Reportes</h1>
    <p className="mt-2 text-sm leading-6 text-[#475569]">Consulta y exportación de la operación registrada.</p>
    {error ? <CatalogAlert variant="error">{error}</CatalogAlert> : null}
    {catalogError ? <CatalogAlert variant="error">No fue posible cargar uno o más catálogos de filtros.</CatalogAlert> : null}
    {loading ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl border border-[#CBD5E1] bg-white" />)}</div> : resumen ? <><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Viajes totales", resumen.viajes_totales], ["En tránsito", resumen.en_transito], ["Completados", resumen.completados], ["Cancelados", resumen.cancelados]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-[#CBD5E1] bg-white p-4"><p className="text-sm text-[#475569]">{label}</p><p className="mt-2 text-2xl font-semibold text-[#0F172A]">{value}</p></div>)}</div><div className="mt-5 grid gap-5 lg:grid-cols-3"><SummaryGroup title="Por proyecto" rows={resumen.viajes_por_proyecto.map((x) => [x.nombre ?? "—", x.viajes_totales])} /><SummaryGroup title="Por material" rows={resumen.viajes_por_material.map((x) => [`${x.nombre ?? "—"} (${x.unidad_medida})`, x.viajes_totales])} /><SummaryGroup title="Por camión" rows={resumen.viajes_por_camion.map((x) => [x.numero_economico ?? x.placas, x.viajes_totales])} /></div></> : null}

    <div className="mt-5 rounded-xl border border-[#CBD5E1] bg-white p-4">
      <h2 className="text-base font-semibold text-[#0F172A]">Filtros</h2>
      <form className="mt-3" onSubmit={(event) => { event.preventDefault(); search(); }}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Field label="Folio"><input value={filters.folio} maxLength={19} onChange={(e) => setFilters({ ...filters, folio: e.target.value })} className={inputClass} type="search" placeholder="Folio del viaje" /></Field>
          <Select label="Estado" value={filters.estado} set={(value) => setFilters({ ...filters, estado: value })} options={[["en_transito", "En tránsito"], ["completado", "Completado"], ["cancelado", "Cancelado"]]} />
          <Select label="Proyecto" value={filters.proyecto_id} set={(value) => setFilters({ ...filters, proyecto_id: value })} options={catalogs.proyectos.map((x) => [String(x.id), x.nombre])} />
          <Select label="Material" value={filters.material_id} set={(value) => setFilters({ ...filters, material_id: value })} options={catalogs.materiales.map((x) => [String(x.id), x.nombre])} />
          <Select label="Camión" value={filters.camion_id} set={(value) => setFilters({ ...filters, camion_id: value })} options={catalogs.camiones.map((x) => [String(x.id), x.numero_economico ?? x.placas])} />
          <Select label="Chofer" value={filters.chofer_id} set={(value) => setFilters({ ...filters, chofer_id: value })} options={catalogs.choferes.map((x) => [String(x.id), [x.nombre, x.apellido_paterno, x.apellido_materno].filter(Boolean).join(" ")])} />
          <Select label="Origen" value={filters.ubicacion_origen_id} set={(value) => setFilters({ ...filters, ubicacion_origen_id: value })} options={catalogs.ubicaciones.map((x) => [String(x.id), `${x.nombre} (${x.tipo})`])} />
          <Select label="Destino" value={filters.ubicacion_destino_id} set={(value) => setFilters({ ...filters, ubicacion_destino_id: value })} options={catalogs.ubicaciones.map((x) => [String(x.id), `${x.nombre} (${x.tipo})`])} />
          <Field label="Desde"><input type="date" value={filters.fecha_desde} onChange={(e) => setFilters({ ...filters, fecha_desde: e.target.value })} className={inputClass} /></Field>
          <Field label="Hasta"><input type="date" value={filters.fecha_hasta} onChange={(e) => setFilters({ ...filters, fecha_hasta: e.target.value })} className={inputClass} /></Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2"><button type="submit" disabled={tableLoading} className="h-10 rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Buscar</button><button type="button" onClick={clear} disabled={tableLoading} className="h-10 rounded-lg border border-[#CBD5E1] bg-white px-4 text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Limpiar</button></div>
      </form>
    </div>

    <div className="mt-5 overflow-hidden rounded-xl border border-[#CBD5E1] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#E2E8F0] p-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="font-semibold text-[#0F172A]">Resultados</h2><p className="mt-1 text-xs text-[#64748B]">{result?.meta.total ?? 0} viajes encontrados</p></div><div className="flex flex-wrap items-end gap-3"><label className="text-xs font-semibold text-[#475569]">Mostrar<select aria-label="Tamaño de página" value={pageSize} onChange={(event) => changePageSize(event.target.value)} className={`${inputClass} mt-1 min-w-24`}><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option><option value="todos">Todos</option></select></label><ExportButton label={downloading ? "Generando Excel…" : "Exportar Excel"} disabled={downloading || tableLoading} onClick={() => void downloadExcel()} /></div></div>
      <StickyHorizontalScroll><table className="indi-numbered w-full min-w-300 text-left text-sm"><thead className="bg-[#F8FAFC] text-xs uppercase text-[#475569]"><tr>{["#", "Folio", "Fecha", "Proyecto", "Camión", "Chofer", "Origen", "Destino", "Material", "Cantidad", "Estado", "Orden"].map((x) => <th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody className="divide-y divide-[#E2E8F0]">{tableLoading ? <tr><td colSpan={12} className="px-4 py-10 text-center text-[#475569]">Consultando viajes…</td></tr> : !result?.data.length ? <tr><td colSpan={12} className="px-4 py-10 text-center text-[#475569]">No hay viajes que coincidan con los filtros.</td></tr> : result.data.map((viaje, index) => { const day = dayFormatter.format(new Date(viaje.fecha_hora_salida)); const showDay = day !== previousDay; previousDay = day; return <Fragment key={viaje.id}>{showDay ? <tr><th colSpan={12} scope="rowgroup" className="bg-[#EAF1F8] px-4 py-2 text-left text-sm font-semibold capitalize text-[#17365D]">{day}</th></tr> : null}<tr className="hover:bg-[#F8FAFC]"><td className="px-4 py-3">{rowOffset + index + 1}</td><td className="whitespace-nowrap px-4 py-3 font-semibold text-[#0F172A]">{viaje.folio}</td><td className="whitespace-nowrap px-4 py-3 text-[#475569]">{dateFormatter.format(new Date(viaje.fecha_hora_salida))}</td><td className="px-4 py-3">{viaje.proyecto.nombre}</td><td className="px-4 py-3"><span className="block font-medium">{viaje.camion.numero_economico ?? "Sin ECO"}</span><span className="text-xs text-[#64748B]">{viaje.camion.placas}</span></td><td className="px-4 py-3">{viaje.chofer.nombre}</td><td className="px-4 py-3">{viaje.ubicacion_origen.nombre}</td><td className="px-4 py-3">{viaje.ubicacion_destino.nombre}</td><td className="px-4 py-3">{viaje.material.nombre}</td><td className="whitespace-nowrap px-4 py-3">{numberFormatter.format(Number(viaje.cantidad_llegada ?? viaje.cantidad_salida))} {viaje.unidad_medida}</td><td className="px-4 py-3"><StatusBadge estado={viaje.estado} /></td><td className="whitespace-nowrap px-4 py-3">{viaje.orden_acarreo?.folio ?? "—"}</td></tr></Fragment>; })}</tbody></table></StickyHorizontalScroll>
      {(result?.meta.total_pages ?? 0) > 1 ? <div className="flex items-center justify-between gap-3 border-t border-[#E2E8F0] px-4 py-3 text-sm"><span className="text-[#64748B]">Página {result?.meta.page} de {result?.meta.total_pages}</span><div className="flex gap-2"><PageButton disabled={tableLoading || query.page === 1} onClick={() => { setTableLoading(true); setQuery({ ...query, page: query.page - 1 }); }}>Anterior</PageButton><PageButton disabled={tableLoading || query.page === result?.meta.total_pages} onClick={() => { setTableLoading(true); setQuery({ ...query, page: query.page + 1 }); }}>Siguiente</PageButton></div></div> : null}
    </div>
  </section>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <label><span className="mb-1.5 block text-xs font-semibold text-[#475569]">{label}</span>{children}</label>; }
function SummaryGroup({ title, rows }: { title: string; rows: Array<[string, number]> }) { return <div className="overflow-hidden rounded-xl border border-[#CBD5E1] bg-white"><h2 className="border-b border-[#E2E8F0] px-4 py-3 font-semibold text-[#0F172A]">{title}</h2><div className="divide-y divide-[#E2E8F0]">{rows.length ? rows.map(([name, count]) => <div key={name} className="flex justify-between gap-3 px-4 py-3 text-sm"><span className="truncate text-[#475569]">{name}</span><strong className="text-[#0F172A]">{count}</strong></div>) : <p className="p-4 text-sm text-[#475569]">Sin datos.</p>}</div></div>; }
function Select({ label, value, set, options }: { label: string; value: string; set: (value: string) => void; options: string[][] }) { return <Field label={label}><select className={inputClass} value={value} onChange={(e) => set(e.target.value)}><option value="">Todos</option>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></Field>; }
function ExportButton({ label, disabled, onClick, secondary = false }: { label: string; disabled: boolean; onClick: () => void; secondary?: boolean }) { return <button type="button" disabled={disabled} onClick={onClick} aria-label={label} className={`h-10 rounded-lg px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${secondary ? "border border-[#2563EB] bg-white text-[#2563EB] hover:bg-blue-50" : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"}`}>{label}</button>; }
function PageButton({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: ReactNode }) { return <button type="button" disabled={disabled} onClick={onClick} className="h-9 rounded-lg border border-[#CBD5E1] bg-white px-3 font-semibold text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">{children}</button>; }
