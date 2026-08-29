"use client";
import { useEffect, useMemo, useState } from "react";
import {
  CatalogAlert,
  CatalogDialog,
  CatalogHeader,
  CatalogLoadingRows,
  FormField,
  RowActions,
  SearchInput,
  StatusPill,
  inputClassName,
} from "@/components/catalogs/catalog-ui";
import { money } from "@/components/operations/operation-ui";
import { StickyHorizontalScroll } from "@/components/tables/sticky-horizontal-scroll";
import { getCatalogErrorMessage } from "@/lib/catalog-errors";
import { materialesService } from "@/services/materiales.service";
import { proyectosService } from "@/services/proyectos.service";
import { rutasAcarreoService } from "@/services/rutas-acarreo.service";
import { tarifasService } from "@/services/tarifas.service";
import { ubicacionesService } from "@/services/ubicaciones.service";
import type { Material, Proyecto, Ubicacion } from "@/types/catalogs";
import type { RutaAcarreo } from "@/types/configuracion-operativa";
import type { Tarifa, TarifaPayload, TipoCobroTarifa } from "@/types/tarifas";

const emptyForm = {
  proyecto_id: "",
  material_id: "",
  origen_id: "",
  destino_id: "",
  ruta_id: "",
  tipo: "POR_VOLUMEN" as TipoCobroTarifa,
  unitario: "",
  primero: "",
  subsecuente: "",
  desde: "",
  hasta: "",
};
export default function TarifasPage() {
  const [items, setItems] = useState<Tarifa[]>([]),
    [projects, setProjects] = useState<Proyecto[]>([]),
    [materials, setMaterials] = useState<Material[]>([]),
    [locations, setLocations] = useState<Ubicacion[]>([]),
    [routes, setRoutes] = useState<RutaAcarreo[]>([]);
  const [form, setForm] = useState(emptyForm),
    [editing, setEditing] = useState<Tarifa | null>(null),
    [open, setOpen] = useState(false),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [search, setSearch] = useState("");
  async function load() {
    setLoading(true);
    try {
      const [t, p, m, u, r] = await Promise.all([
        tarifasService.list(),
        proyectosService.list(),
        materialesService.list(),
        ubicacionesService.list(),
        rutasAcarreoService.list(),
      ]);
      setItems(t);
      setProjects(p);
      setMaterials(m);
      setLocations(u);
      setRoutes(r);
    } catch (cause) {
      setError(getCatalogErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const visible = useMemo(
    () =>
      items.filter((item) =>
        `${item.proyecto.nombre} ${item.material.nombre} ${item.ubicacion_origen.nombre} ${item.ubicacion_destino.nombre} ${item.ruta_acarreo?.clave ?? ""}`
          .toLocaleLowerCase("es-MX")
          .includes(search.toLocaleLowerCase("es-MX")),
      ),
    [items, search],
  );
  const filteredLocations = locations.filter(
    (item) => item.proyecto.id === Number(form.proyecto_id),
  );
  const filteredRoutes = routes.filter(
    (route) =>
      route.activo &&
      route.proyecto.id === Number(form.proyecto_id) &&
      route.ubicacion_origen.id === Number(form.origen_id) &&
      route.ubicacion_destino.id === Number(form.destino_id),
  );
  function show(item?: Tarifa) {
    setError("");
    setEditing(item ?? null);
    setForm(
      item
        ? {
            proyecto_id: String(item.proyecto.id),
            material_id: String(item.material.id),
            origen_id: String(item.ubicacion_origen.id),
            destino_id: String(item.ubicacion_destino.id),
            ruta_id: item.ruta_acarreo ? String(item.ruta_acarreo.id) : "",
            tipo: item.tipo_cobro,
            unitario: item.precio_unitario ?? "",
            primero: item.precio_primer_km ?? "",
            subsecuente: item.precio_km_subsecuente ?? "",
            desde: item.vigente_desde,
            hasta: item.vigente_hasta ?? "",
          }
        : emptyForm,
    );
    setOpen(true);
  }
  async function save() {
    if (form.hasta && form.hasta < form.desde) {
      setError("La vigencia final debe ser posterior a la inicial.");
      return;
    }
    const common = {
      proyecto_id: Number(form.proyecto_id),
      material_id: Number(form.material_id),
      ubicacion_origen_id: Number(form.origen_id),
      ubicacion_destino_id: Number(form.destino_id),
      tipo_cobro: form.tipo,
      vigente_desde: form.desde,
      ...(form.hasta ? { vigente_hasta: form.hasta } : {}),
    };
    const payload: TarifaPayload =
      form.tipo === "POR_VOLUMEN"
        ? { ...common, precio_unitario: Number(form.unitario) }
        : {
            ...common,
            ...(form.ruta_id ? { ruta_acarreo_id: Number(form.ruta_id) } : {}),
            precio_primer_km: Number(form.primero),
            precio_km_subsecuente: Number(form.subsecuente),
          };
    setSaving(true);
    setError("");
    try {
      if (editing) await tarifasService.update(editing.id, payload);
      else await tarifasService.create(payload);
      setOpen(false);
      await load();
    } catch (cause) {
      setError(getCatalogErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }
  async function setActive(item: Tarifa) {
    try {
      await tarifasService.update(item.id, { activo: !item.activo });
      await load();
    } catch (cause) {
      setError(getCatalogErrorMessage(cause));
    }
  }
  return (
    <section>
      <CatalogHeader
        title="Tarifas"
        description="Configura precios por volumen o distancia escalonada y conserva sus vigencias."
        actionLabel="Nueva tarifa"
        onAction={() => show()}
      />
      {error ? <CatalogAlert variant="error">{error}</CatalogAlert> : null}
      <div className="mt-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Proyecto, material, ruta u ubicación"
        />
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-[#CBD5E1] bg-white">
        <StickyHorizontalScroll>
          <table className="admin-table indi-numbered min-w-300">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600">
              <tr>
                {[
                  "#",
                  "Proyecto",
                  "Material",
                  "Trayecto",
                  "Ruta",
                  "Modalidad",
                  "Precio",
                  "Vigencia",
                  "Estado",
                  "Acciones",
                ].map((label) => (
                  <th key={label} className="px-4 py-3">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <CatalogLoadingRows columns={10} />
              ) : visible.length ? (
                visible.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3">{item.proyecto.nombre}</td>
                    <td className="px-4 py-3">{item.material.nombre}</td>
                    <td className="px-4 py-3">
                      {item.ubicacion_origen.nombre} →{" "}
                      {item.ubicacion_destino.nombre}
                    </td>
                    <td className="px-4 py-3">
                      {item.ruta_acarreo?.clave ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {item.tipo_cobro === "POR_VOLUMEN"
                        ? "Por volumen"
                        : "Distancia escalonada"}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {item.tipo_cobro === "POR_VOLUMEN"
                        ? `${money(item.precio_unitario ?? 0)} / ${item.unidad_medida}`
                        : `${money(item.precio_primer_km ?? 0)} 1er km · ${money(item.precio_km_subsecuente ?? 0)} subsecuente`}
                    </td>
                    <td className="px-4 py-3">
                      {item.vigente_desde} —{" "}
                      {item.vigente_hasta ?? "Sin término"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill active={item.activo} />
                    </td>
                    <td className="px-4 py-3">
                      <RowActions
                        entityName="tarifa"
                        onEdit={() => show(item)}
                        onSuspend={() => void setActive(item)}
                        onResume={() => void setActive(item)}
                        suspended={!item.activo}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No hay tarifas que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </StickyHorizontalScroll>
      </div>
      <CatalogDialog
        title={editing ? "Editar tarifa" : "Nueva tarifa"}
        open={open}
        saving={saving}
        error={error}
        onClose={() => setOpen(false)}
        onSubmit={() => void save()}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Choice
            label="Proyecto"
            value={form.proyecto_id}
            onChange={(value) =>
              setForm({
                ...form,
                proyecto_id: value,
                origen_id: "",
                destino_id: "",
                ruta_id: "",
              })
            }
            items={projects}
          />
          <Choice
            label="Material"
            value={form.material_id}
            onChange={(value) => setForm({ ...form, material_id: value })}
            items={materials}
          />
          <Choice
            label="Origen"
            value={form.origen_id}
            onChange={(value) =>
              setForm({ ...form, origen_id: value, ruta_id: "" })
            }
            items={filteredLocations}
          />
          <Choice
            label="Destino"
            value={form.destino_id}
            onChange={(value) =>
              setForm({ ...form, destino_id: value, ruta_id: "" })
            }
            items={filteredLocations.filter(
              (item) => String(item.id) !== form.origen_id,
            )}
          />
          <FormField label="Modalidad" required>
            <select
              className={inputClassName}
              value={form.tipo}
              onChange={(event) =>
                setForm({
                  ...form,
                  tipo: event.target.value as TipoCobroTarifa,
                  ruta_id: "",
                  unitario: "",
                  primero: "",
                  subsecuente: "",
                })
              }
            >
              <option value="POR_VOLUMEN">Por volumen</option>
              <option value="POR_DISTANCIA_ESCALONADA">
                Por distancia escalonada
              </option>
            </select>
          </FormField>
          {form.tipo === "POR_DISTANCIA_ESCALONADA" ? (
            <>
              <Choice
                label="Ruta (opcional)"
                value={form.ruta_id}
                onChange={(value) => setForm({ ...form, ruta_id: value })}
                items={filteredRoutes.map((route) => ({
                  id: route.id,
                  nombre: `${route.clave} · ${route.distancia_total} km`,
                }))}
                optional
              />
              <Price
                label="Precio primer km"
                value={form.primero}
                onChange={(value) => setForm({ ...form, primero: value })}
              />
              <Price
                label="Precio km subsecuente"
                value={form.subsecuente}
                onChange={(value) => setForm({ ...form, subsecuente: value })}
              />
            </>
          ) : (
            <Price
              label="Precio unitario"
              value={form.unitario}
              onChange={(value) => setForm({ ...form, unitario: value })}
            />
          )}
          <FormField label="Vigente desde" required>
            <input
              className={inputClassName}
              type="date"
              required
              value={form.desde}
              onChange={(event) =>
                setForm({ ...form, desde: event.target.value })
              }
            />
          </FormField>
          <FormField label="Vigente hasta">
            <input
              className={inputClassName}
              type="date"
              min={form.desde}
              value={form.hasta}
              onChange={(event) =>
                setForm({ ...form, hasta: event.target.value })
              }
            />
          </FormField>
        </div>
        {editing ? (
          <p className="text-xs text-slate-500">
            Para cambiar precios futuros, crea una nueva vigencia. Los snapshots
            históricos no se modifican.
          </p>
        ) : null}
      </CatalogDialog>
    </section>
  );
}
function Choice({
  label,
  value,
  onChange,
  items,
  optional = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: Array<{ id: number; nombre: string }>;
  optional?: boolean;
}) {
  return (
    <FormField label={label} required={!optional}>
      <select
        className={inputClassName}
        required={!optional}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">
          {optional ? "Sin ruta específica" : "Selecciona una opción"}
        </option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.nombre}
          </option>
        ))}
      </select>
    </FormField>
  );
}
function Price({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormField label={label} required>
      <input
        className={inputClassName}
        type="number"
        min="0.0001"
        step="0.0001"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}
