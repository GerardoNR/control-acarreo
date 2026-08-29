"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CatalogAlert,
  CatalogDialog,
  CatalogHeader,
  ConfirmActionDialog,
  FormField,
  inputClassName,
  textareaClassName,
} from "@/components/catalogs/catalog-ui";
import {
  ProgressBar,
  StateBadge,
  quantity,
} from "@/components/operations/operation-ui";
import { StickyHorizontalScroll } from "@/components/tables/sticky-horizontal-scroll";
import { getCatalogErrorMessage } from "@/lib/catalog-errors";
import { materialesService } from "@/services/materiales.service";
import { ordenesAcarreoService } from "@/services/ordenes-acarreo.service";
import { proyectosService } from "@/services/proyectos.service";
import { ubicacionesService } from "@/services/ubicaciones.service";
import { rutasAcarreoService } from "@/services/rutas-acarreo.service";
import { unidadesControlService } from "@/services/unidades-control.service";
import { tarifasService } from "@/services/tarifas.service";
import type { Material, Proyecto, Ubicacion } from "@/types/catalogs";
import type { OrdenAcarreo } from "@/types/ordenes-acarreo";
import type { RutaAcarreo, UnidadControl } from "@/types/configuracion-operativa";
import type { Tarifa } from "@/types/tarifas";

const initial = {
  proyecto_id: "",
  material_id: "",
  ubicacion_origen_id: "",
  ubicacion_destino_id: "",
  ruta_acarreo_id: "",
  unidad_control_id: "",
  tarifa_id: "",
  cantidad_solicitada: "",
  fecha_inicio: new Date().toISOString().slice(0, 10),
  fecha_fin: "",
  observaciones: "",
};
export default function OrdenesAcarreoPage() {
  const [items, setItems] = useState<OrdenAcarreo[]>([]);
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [locations, setLocations] = useState<Ubicacion[]>([]);
  const [routes, setRoutes] = useState<RutaAcarreo[]>([]);
  const [units, setUnits] = useState<UnidadControl[]>([]);
  const [tariffs, setTariffs] = useState<Tarifa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [project, setProject] = useState("");
  const [material, setMaterial] = useState("");
  const [state, setState] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("recent");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState<OrdenAcarreo | null>(null);
  const [saving, setSaving] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<OrdenAcarreo | null>(null);
  const load = () => {
    Promise.all([
      ordenesAcarreoService.list(),
      proyectosService.list(),
      materialesService.list(),
      ubicacionesService.list(),
      rutasAcarreoService.list(),
      unidadesControlService.list(),
      tarifasService.list(),
    ])
      .then(([o, p, m, u, r, c, t]) => {
        setItems(o);
        setProjects(p);
        setMaterials(m);
        setLocations(u);
        setRoutes(r);
        setUnits(c);
        setTariffs(t);
      })
      .catch((e) => setError(getCatalogErrorMessage(e)))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    void load();
  }, []);
  const filtered = useMemo(
    () =>
      items
        .filter(
          (x) =>
            (!search ||
              [x.folio, x.proyecto.nombre, x.material.nombre].some((v) =>
                v.toLowerCase().includes(search.toLowerCase()),
              )) &&
            (!project || x.proyecto.id === Number(project)) &&
            (!material || x.material.id === Number(material)) &&
            (!state || x.estado === state) &&
            (!from || x.fecha_inicio >= from) &&
            (!to || x.fecha_inicio <= to),
        )
        .sort((a, b) =>
          sort === "old"
            ? a.creado_en.localeCompare(b.creado_en)
            : b.creado_en.localeCompare(a.creado_en),
        ),
    [items, search, project, material, state, from, to, sort],
  );
  const availableLocations = locations.filter(
    (x) => !form.proyecto_id || x.proyecto.id === Number(form.proyecto_id),
  );
  const availableRoutes = routes.filter((x) => x.activo && x.proyecto.id === Number(form.proyecto_id) && x.ubicacion_origen.id === Number(form.ubicacion_origen_id) && x.ubicacion_destino.id === Number(form.ubicacion_destino_id));
  const availableUnits = units.filter((x) => x.activo && x.proyecto.id === Number(form.proyecto_id));
  const availableTariffs = tariffs.filter((x) => x.activo && x.proyecto.id === Number(form.proyecto_id) && x.material.id === Number(form.material_id) && x.ubicacion_origen.id === Number(form.ubicacion_origen_id) && x.ubicacion_destino.id === Number(form.ubicacion_destino_id) && (!x.ruta_acarreo || x.ruta_acarreo.id === Number(form.ruta_acarreo_id)));
  function edit(item?: OrdenAcarreo) {
    setEditing(item ?? null);
    setForm(
      item
        ? {
            proyecto_id: String(item.proyecto.id),
            material_id: String(item.material.id),
            ubicacion_origen_id: String(item.ubicacion_origen.id),
            ubicacion_destino_id: String(item.ubicacion_destino.id),
            ruta_acarreo_id: item.ruta_acarreo ? String(item.ruta_acarreo.id) : "",
            unidad_control_id: item.unidad_control ? String(item.unidad_control.id) : "",
            tarifa_id: item.tarifa ? String(item.tarifa.id) : "",
            cantidad_solicitada: item.cantidad_solicitada,
            fecha_inicio: item.fecha_inicio,
            fecha_fin: item.fecha_fin ?? "",
            observaciones: item.observaciones ?? "",
          }
        : initial,
    );
    setError("");
    setOpen(true);
  }
  async function save() {
    setSaving(true);
    setError("");
    try {
      const payload = {
        proyecto_id: Number(form.proyecto_id),
        material_id: Number(form.material_id),
        ubicacion_origen_id: Number(form.ubicacion_origen_id),
        ubicacion_destino_id: Number(form.ubicacion_destino_id),
        ...(form.ruta_acarreo_id ? { ruta_acarreo_id: Number(form.ruta_acarreo_id) } : {}),
        ...(form.unidad_control_id ? { unidad_control_id: Number(form.unidad_control_id) } : {}),
        ...(form.tarifa_id ? { tarifa_id: Number(form.tarifa_id) } : {}),
        cantidad_solicitada: Number(form.cantidad_solicitada),
        fecha_inicio: form.fecha_inicio,
        ...(form.fecha_fin ? { fecha_fin: form.fecha_fin } : {}),
        ...(form.observaciones.trim()
          ? { observaciones: form.observaciones.trim() }
          : {}),
      };
      if (editing) await ordenesAcarreoService.update(editing.id, payload);
      else await ordenesAcarreoService.create(payload);
      setOpen(false);
      load();
    } catch (e) {
      setError(getCatalogErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  async function cancel() {
    if (!cancelTarget) return;
    setSaving(true);
    try {
      await ordenesAcarreoService.cancel(cancelTarget.id);
      setCancelTarget(null);
      load();
    } catch (e) {
      setError(getCatalogErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <section>
      <CatalogHeader
        title="Órdenes de acarreo"
        description="Administra las solicitudes de material y consulta su avance."
        actionLabel="Nueva orden"
        onAction={() => edit()}
      />
      {error ? <CatalogAlert variant="error">{error}</CatalogAlert> : null}
      <div className="mt-6 rounded-xl border border-[#CBD5E1] bg-white">
        <div className="grid gap-3 border-b border-[#E2E8F0] p-4 sm:grid-cols-2 xl:grid-cols-7">
          <label>
            Buscar por
            <input
              aria-label="Buscar por folio, proyecto o material"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputClassName}
            />
          </label>
          <Select
            label="Proyecto"
            value={project}
            onChange={setProject}
            options={projects.map((x) => [String(x.id), x.nombre])}
          />
          <Select
            label="Material"
            value={material}
            onChange={setMaterial}
            options={materials.map((x) => [String(x.id), x.nombre])}
          />
          <Select
            label="Estado"
            value={state}
            onChange={setState}
            options={["PENDIENTE", "EN_PROCESO", "COMPLETADA", "CANCELADA"].map(
              (x) => [x, x.replace("_", " ")],
            )}
          />
          <label>
            Desde
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={inputClassName}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputClassName}
            />
          </label>
          <Select
            label="Ordenar por"
            value={sort}
            onChange={setSort}
            allLabel="Más reciente"
            options={[["old", "Más antigua"]]}
          />
        </div>
        <StickyHorizontalScroll>
          <table className="admin-table indi-numbered min-w-300">
            <thead className="bg-[#F8FAFC] text-xs uppercase text-[#475569]">
              <tr>
                {[
                  "#",
                  "Folio",
                  "Proyecto",
                  "Material",
                  "Origen",
                  "Destino",
                  "Solicitado",
                  "Transportado",
                  "Pendiente",
                  "Viajes",
                  "Avance",
                  "Estado",
                  "Acciones",
                ].map((x) => (
                  <th key={x} className="px-4 py-3">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center">
                    Cargando…
                  </td>
                </tr>
              ) : (
                filtered.map((x, i) => (
                  <tr key={x.id}>
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold">{x.folio}</td>
                    <td className="px-4 py-3">{x.proyecto.nombre}</td>
                    <td className="px-4 py-3">{x.material.nombre}</td>
                    <td className="px-4 py-3">{x.ubicacion_origen.nombre}</td>
                    <td className="px-4 py-3">{x.ubicacion_destino.nombre}</td>
                    <td className="px-4 py-3">
                      {quantity(x.cantidad_solicitada, x.unidad_medida)}
                    </td>
                    <td className="px-4 py-3">
                      {quantity(x.transportado, x.unidad_medida)}
                    </td>
                    <td className="px-4 py-3">
                      {quantity(x.pendiente, x.unidad_medida)}
                      {Number(x.excedente) > 0 ? (
                        <span className="block text-xs text-amber-700">
                          Excedente {quantity(x.excedente, x.unidad_medida)}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {x.viajes_completados}
                    </td>
                    <td className="px-4 py-3">
                      <ProgressBar value={x.avance_porcentaje} />
                    </td>
                    <td className="px-4 py-3">
                      <StateBadge>{x.estado.replace("_", " ")}</StateBadge>
                    </td>
                    <td className="px-4 py-3">
                      <OrderActions
                        id={x.id}
                        editable={x.estado !== "CANCELADA"}
                        onEdit={() => edit(x)}
                        onCancel={() => setCancelTarget(x)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </StickyHorizontalScroll>
      </div>
      <CatalogDialog
        title={editing ? "Editar orden" : "Nueva orden"}
        open={open}
        saving={saving}
        error={error}
        onClose={() => setOpen(false)}
        onSubmit={() => void save()}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Proyecto" required>
            <select
              className={inputClassName}
              value={form.proyecto_id}
              required
              onChange={(e) =>
                setForm({
                  ...form,
                  proyecto_id: e.target.value,
                  ubicacion_origen_id: "",
                  ubicacion_destino_id: "",
                  ruta_acarreo_id: "",
                  unidad_control_id: "",
                  tarifa_id: "",
                })
              }
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
          <FormField label="Material" required>
            <select
              className={inputClassName}
              value={form.material_id}
              required
              onChange={(e) =>
                setForm({ ...form, material_id: e.target.value, tarifa_id: "" })
              }
            >
              <option value="">Selecciona</option>
              {materials
                .filter((x) => x.activo)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.nombre} ({x.unidad_medida})
                  </option>
                ))}
            </select>
          </FormField>
          <FormField label="Origen" required>
            <select
              className={inputClassName}
              value={form.ubicacion_origen_id}
              required
              onChange={(e) =>
                setForm({ ...form, ubicacion_origen_id: e.target.value, ruta_acarreo_id: "", tarifa_id: "" })
              }
            >
              <option value="">Selecciona</option>
              {availableLocations.filter((x) => String(x.id) !== form.ubicacion_destino_id).map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nombre} · {x.tipo}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Destino" required>
            <select
              className={inputClassName}
              value={form.ubicacion_destino_id}
              required
              onChange={(e) =>
                setForm({ ...form, ubicacion_destino_id: e.target.value, ruta_acarreo_id: "", tarifa_id: "" })
              }
            >
              <option value="">Selecciona</option>
              {availableLocations.filter((x) => String(x.id) !== form.ubicacion_origen_id).map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nombre} · {x.tipo}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Ruta"><select className={inputClassName} value={form.ruta_acarreo_id} onChange={(e) => setForm({ ...form, ruta_acarreo_id: e.target.value, tarifa_id: "" })}><option value="">Sin ruta configurada</option>{availableRoutes.map((x) => <option key={x.id} value={x.id}>{x.clave} · {x.distancia_total} km</option>)}</select></FormField>
          <FormField label="Unidad de control sugerida"><select className={inputClassName} value={form.unidad_control_id} onChange={(e) => setForm({ ...form, unidad_control_id: e.target.value })}><option value="">Sin sugerencia</option>{availableUnits.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select></FormField>
          <FormField label="Tarifa"><select className={inputClassName} value={form.tarifa_id} onChange={(e) => setForm({ ...form, tarifa_id: e.target.value })}><option value="">Sin tarifa configurada</option>{availableTariffs.map((x) => <option key={x.id} value={x.id}>{x.tipo_cobro === "POR_VOLUMEN" ? `Por volumen · ${x.precio_unitario}` : `Escalonada · ${x.precio_primer_km} / ${x.precio_km_subsecuente}`}</option>)}</select></FormField>
          <FormField label="Cantidad solicitada" required>
            <input
              type="number"
              min="0.001"
              step="0.001"
              className={inputClassName}
              value={form.cantidad_solicitada}
              required
              onChange={(e) =>
                setForm({ ...form, cantidad_solicitada: e.target.value })
              }
            />
          </FormField>
          <FormField label="Fecha de inicio" required>
            <input
              type="date"
              className={inputClassName}
              value={form.fecha_inicio}
              required
              onChange={(e) =>
                setForm({ ...form, fecha_inicio: e.target.value })
              }
            />
          </FormField>
          <FormField label="Fecha de fin">
            <input
              type="date"
              className={inputClassName}
              value={form.fecha_fin}
              onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
            />
          </FormField>
        </div>
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
      <ConfirmActionDialog
        open={cancelTarget !== null}
        title="Cancelar orden"
        description={
          <>
            La orden <strong>{cancelTarget?.folio}</strong> conservará todos sus
            viajes e historial.
          </>
        }
        confirmLabel="Cancelar orden"
        busy={saving}
        destructive
        onClose={() => setCancelTarget(null)}
        onConfirm={() => void cancel()}
      />
    </section>
  );
}

function OrderActions({
  id,
  editable,
  onEdit,
  onCancel,
}: {
  id: number;
  editable: boolean;
  onEdit: () => void;
  onCancel: () => void;
}) {
  const actionClassName =
    "inline-flex min-h-10 min-w-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[#2563EB] hover:bg-blue-50 hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/dashboard/ordenes-acarreo/${id}`}
        title="Ver orden"
        aria-label="Ver orden"
        className={actionClassName}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span className="text-[11px] font-medium leading-none">Ver</span>
      </Link>
      {editable ? (
        <>
          <button
            type="button"
            title="Editar orden"
            aria-label="Editar orden"
            onClick={onEdit}
            className={actionClassName}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            <span className="text-[11px] font-medium leading-none">Editar</span>
          </button>
          <button
            type="button"
            title="Cancelar orden"
            aria-label="Cancelar orden"
            onClick={onCancel}
            className="inline-flex min-h-10 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-red-600 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="m7.5 7.5 9 9" />
            </svg>
            <span className="text-[11px] font-medium leading-none">Cancelar</span>
          </button>
        </>
      ) : null}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  allLabel = "Todos",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[][];
  allLabel?: string;
}) {
  return (
    <label>
      {label}
      <select
        className={inputClassName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{allLabel}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
