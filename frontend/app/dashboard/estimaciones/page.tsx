"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CatalogAlert,
  CatalogDialog,
  CatalogHeader,
  FormField,
  inputClassName,
  textareaClassName,
} from "@/components/catalogs/catalog-ui";
import {
  MetricCard,
  StateBadge,
  money,
  quantity,
} from "@/components/operations/operation-ui";
import { StickyHorizontalScroll } from "@/components/tables/sticky-horizontal-scroll";
import { getCatalogErrorMessage } from "@/lib/catalog-errors";
import { estimacionesService } from "@/services/estimaciones.service";
import { ordenesAcarreoService } from "@/services/ordenes-acarreo.service";
import { proyectosService } from "@/services/proyectos.service";
import type { Proyecto } from "@/types/catalogs";
import type {
  EstimacionResumen,
  EstimacionesResponse,
} from "@/types/estimaciones";
import type { OrdenAcarreo } from "@/types/ordenes-acarreo";
import type { Viaje } from "@/types/viajes";
const today = new Date().toISOString().slice(0, 10);
export default function EstimacionesPage() {
  const [result, setResult] = useState<EstimacionesResponse | null>(null),
    [projects, setProjects] = useState<Proyecto[]>([]),
    [orders, setOrders] = useState<OrdenAcarreo[]>([]),
    [eligible, setEligible] = useState<Viaje[]>([]);
  const [search, setSearch] = useState(""),
    [projectFilter, setProjectFilter] = useState(""),
    [stateFilter, setStateFilter] = useState(""),
    [fromFilter, setFromFilter] = useState(""),
    [toFilter, setToFilter] = useState("");
  const [open, setOpen] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [form, setForm] = useState({
      proyecto_id: "",
      fecha_desde: today,
      fecha_hasta: today,
      orden_acarreo_id: "",
      observaciones: "",
      viaje_ids: [] as string[],
    });
  const load = () =>
    Promise.all([
      estimacionesService.list(),
      proyectosService.list(),
      ordenesAcarreoService.list(),
    ])
      .then(([r, p, o]) => {
        setResult(r);
        setProjects(p);
        setOrders(o);
      })
      .catch((e) => setError(getCatalogErrorMessage(e)));
  useEffect(() => {
    void load();
  }, []);
  const rows = useMemo(
    () =>
      (result?.data ?? []).filter(
        (x) =>
          (!search || x.folio.toLowerCase().includes(search.toLowerCase())) &&
          (!projectFilter || x.proyecto.id === Number(projectFilter)) &&
          (!stateFilter || x.estado === stateFilter) &&
          (!fromFilter || x.fecha_desde >= fromFilter) &&
          (!toFilter || x.fecha_hasta <= toFilter),
      ),
    [result, search, projectFilter, stateFilter, fromFilter, toFilter],
  );
  async function findTrips() {
    setError("");
    try {
      setEligible(
        await estimacionesService.eligible({
          proyecto_id: Number(form.proyecto_id),
          fecha_desde: form.fecha_desde,
          fecha_hasta: form.fecha_hasta,
          ...(form.orden_acarreo_id
            ? { orden_acarreo_id: Number(form.orden_acarreo_id) }
            : {}),
        }),
      );
      setForm((f) => ({ ...f, viaje_ids: [] }));
    } catch (e) {
      setError(getCatalogErrorMessage(e));
    }
  }
  async function create() {
    setSaving(true);
    try {
      await estimacionesService.create({
        proyecto_id: Number(form.proyecto_id),
        fecha_desde: form.fecha_desde,
        fecha_hasta: form.fecha_hasta,
        viaje_ids: form.viaje_ids,
        ...(form.observaciones ? { observaciones: form.observaciones } : {}),
      });
      setOpen(false);
      setEligible([]);
      await load();
    } catch (e) {
      setError(getCatalogErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  const summary = result?.resumen;
  return (
    <section>
      <CatalogHeader
        title="Estimaciones"
        description="Cortes administrativos de viajes, facturación y pagos."
        actionLabel="Nueva estimación"
        onAction={() => setOpen(true)}
      />
      {error ? <CatalogAlert variant="error">{error}</CatalogAlert> : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total estimaciones"
          value={summary?.total_estimaciones ?? 0}
        />
        <MetricCard
          label="Importe realizado"
          value={money(summary?.importe_realizado ?? 0)}
        />
        <MetricCard
          label="Importe facturado"
          value={money(summary?.importe_facturado ?? 0)}
        />
        <MetricCard
          label="Importe pagado"
          value={money(summary?.importe_pagado ?? 0)}
        />
        <MetricCard
          label="Por cobrar"
          value={money(summary?.por_cobrar ?? 0)}
        />
      </div>
      <div className="mt-5 overflow-hidden rounded-xl border border-[#CBD5E1] bg-white">
        <div className="grid gap-3 border-b p-4 sm:grid-cols-2 lg:grid-cols-5">
          <label>
            Buscar por
            <input
              className={inputClassName}
              aria-label="Buscar por folio"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <Filter
            label="Proyecto"
            value={projectFilter}
            set={setProjectFilter}
            options={projects.map((x) => [String(x.id), x.nombre])}
          />
          <Filter
            label="Estado"
            value={stateFilter}
            set={setStateFilter}
            options={[
              "BORRADOR",
              "CERRADA",
              "FACTURADA",
              "PAGADA",
              "CANCELADA",
            ].map((x) => [x, x])}
          />
          <label>
            Desde
            <input
              className={inputClassName}
              type="date"
              value={fromFilter}
              onChange={(e) => setFromFilter(e.target.value)}
            />
          </label>
          <label>
            Hasta
            <input
              className={inputClassName}
              type="date"
              value={toFilter}
              onChange={(e) => setToFilter(e.target.value)}
            />
          </label>
        </div>
        <StickyHorizontalScroll>
          <table className="admin-table indi-numbered min-w-275">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600">
              <tr>
                {[
                  "#",
                  "Folio",
                  "Proyecto",
                  "Periodo",
                  "Viajes",
                  "Cantidad",
                  "Realizado",
                  "Facturado",
                  "Pagado",
                  "Por cobrar",
                  "Estado",
                  "Acciones",
                ].map((x) => (
                  <th className="px-4 py-3" key={x}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((x, i) => (
                <EstimationRow key={x.id} item={x} index={i} />
              ))}
            </tbody>
          </table>
        </StickyHorizontalScroll>
      </div>
      <CatalogDialog
        title="Nueva estimación"
        open={open}
        saving={saving}
        error={error}
        onClose={() => setOpen(false)}
        onSubmit={() => void create()}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Proyecto" required>
            <select
              className={inputClassName}
              value={form.proyecto_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  proyecto_id: e.target.value,
                  orden_acarreo_id: "",
                  viaje_ids: [],
                })
              }
              required
            >
              <option value="">Selecciona</option>
              {projects
                .filter((x) => x.activo)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.nombre}
                  </option>
                ))}
            </select>
          </FormField>
          <FormField label="Orden de acarreo (opcional)">
            <select
              className={inputClassName}
              value={form.orden_acarreo_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  orden_acarreo_id: e.target.value,
                  viaje_ids: [],
                })
              }
            >
              <option value="">Todas</option>
              {orders
                .filter(
                  (x) =>
                    !form.proyecto_id ||
                    x.proyecto.id === Number(form.proyecto_id),
                )
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.folio}
                  </option>
                ))}
            </select>
          </FormField>
          <FormField label="Desde" required>
            <input
              className={inputClassName}
              type="date"
              value={form.fecha_desde}
              onChange={(e) =>
                setForm({ ...form, fecha_desde: e.target.value })
              }
              required
            />
          </FormField>
          <FormField label="Hasta" required>
            <input
              className={inputClassName}
              type="date"
              value={form.fecha_hasta}
              onChange={(e) =>
                setForm({ ...form, fecha_hasta: e.target.value })
              }
              required
            />
          </FormField>
        </div>
        <button
          type="button"
          disabled={!form.proyecto_id}
          onClick={() => void findTrips()}
          className="rounded-lg border border-blue-300 px-3 py-2 text-sm font-semibold text-blue-700 disabled:opacity-50"
        >
          Buscar viajes elegibles
        </button>
        <div className="max-h-64 overflow-y-auto rounded-lg border">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="p-2"></th>
                <th className="p-2 text-left">Viaje</th>
                <th className="p-2 text-left">Cantidad</th>
                <th className="p-2 text-left">Ruta</th>
              </tr>
            </thead>
            <tbody>
              {eligible.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="p-2">
                    <input
                      aria-label={`Seleccionar ${v.folio}`}
                      type="checkbox"
                      checked={form.viaje_ids.includes(v.id)}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          viaje_ids: e.target.checked
                            ? [...form.viaje_ids, v.id]
                            : form.viaje_ids.filter((id) => id !== v.id),
                        })
                      }
                    />
                  </td>
                  <td className="p-2">{v.folio}</td>
                  <td className="p-2">
                    {quantity(
                      v.cantidad_llegada ?? v.cantidad_salida,
                      v.unidad_medida,
                    )}
                  </td>
                  <td className="p-2">
                    {v.ubicacion_origen.nombre} → {v.ubicacion_destino.nombre}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm font-semibold">
          {form.viaje_ids.length} viajes seleccionados
        </p>
        <FormField label="Observaciones">
          <textarea
            className={textareaClassName}
            value={form.observaciones}
            onChange={(e) =>
              setForm({ ...form, observaciones: e.target.value })
            }
          />
        </FormField>
      </CatalogDialog>
    </section>
  );
}
function EstimationRow({
  item: x,
  index,
}: {
  item: EstimacionResumen;
  index: number;
}) {
  return (
    <tr>
      <td className="px-4 py-3">{index + 1}</td>
      <td className="px-4 py-3 font-semibold">{x.folio}</td>
      <td className="px-4 py-3">{x.proyecto.nombre}</td>
      <td className="px-4 py-3">
        {x.fecha_desde} — {x.fecha_hasta}
      </td>
      <td className="px-4 py-3">{x.viajes}</td>
      <td className="px-4 py-3">{quantity(x.cantidad)}</td>
      <td className="px-4 py-3">{money(x.importe_realizado)}</td>
      <td className="px-4 py-3">{money(x.importe_facturado)}</td>
      <td className="px-4 py-3">{money(x.importe_pagado)}</td>
      <td className="px-4 py-3">{money(x.por_cobrar)}</td>
      <td className="px-4 py-3">
        <StateBadge>{x.estado}</StateBadge>
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/dashboard/estimaciones/${x.id}`}
          className="font-semibold text-blue-600"
        >
          Ver
        </Link>
      </td>
    </tr>
  );
}
function Filter({
  label,
  value,
  set,
  options,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  options: string[][];
}) {
  return (
    <label>
      {label}
      <select
        className={inputClassName}
        value={value}
        onChange={(e) => set(e.target.value)}
      >
        <option value="">Todos</option>
        {options.map(([v, l]) => (
          <option value={v} key={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
