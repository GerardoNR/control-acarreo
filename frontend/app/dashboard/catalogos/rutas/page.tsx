"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CatalogAlert,
  CatalogDialog,
  CatalogHeader,
  CatalogLoadingRows,
  CatalogSortSelect,
  FormField,
  RowActions,
  SearchInput,
  StatusPill,
  inputClassName,
  textareaClassName,
} from "@/components/catalogs/catalog-ui";
import { StickyHorizontalScroll } from "@/components/tables/sticky-horizontal-scroll";
import { getCatalogErrorMessage } from "@/lib/catalog-errors";
import { proyectosService } from "@/services/proyectos.service";
import { rutasAcarreoService } from "@/services/rutas-acarreo.service";
import { ubicacionesService } from "@/services/ubicaciones.service";
import type { Proyecto, Ubicacion } from "@/types/catalogs";
import type {
  RutaAcarreo,
  RutaAcarreoPayload,
} from "@/types/configuracion-operativa";

const emptyForm = {
  proyecto_id: "",
  clave: "",
  origen_id: "",
  destino_id: "",
  descripcion: "",
  pavimento: "",
  total: "",
  desde: "",
  hasta: "",
};

export default function RutasPage() {
  const [routes, setRoutes] = useState<RutaAcarreo[]>([]);
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [locations, setLocations] = useState<Ubicacion[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<RutaAcarreo | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [sort, setSort] = useState("clave");

  async function load() {
    setLoading(true);
    try {
      const [routeData, projectData, locationData] = await Promise.all([
        rutasAcarreoService.list(),
        proyectosService.list(),
        ubicacionesService.list(),
      ]);
      setRoutes(routeData);
      setProjects(projectData);
      setLocations(locationData);
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
      routes
        .filter((route) => {
          const term = search.toLocaleLowerCase("es-MX");
          return (
            (!projectFilter || route.proyecto.id === Number(projectFilter)) &&
            `${route.clave} ${route.descripcion ?? ""} ${route.ubicacion_origen.nombre} ${route.ubicacion_destino.nombre}`
              .toLocaleLowerCase("es-MX")
              .includes(term)
          );
        })
        .sort((a, b) =>
          sort === "proyecto"
            ? a.proyecto.nombre.localeCompare(b.proyecto.nombre)
            : sort === "vigencia"
              ? b.vigente_desde.localeCompare(a.vigente_desde)
              : a.clave.localeCompare(b.clave),
        ),
    [projectFilter, routes, search, sort],
  );
  const formLocations = locations.filter(
    (location) => location.proyecto.id === Number(form.proyecto_id),
  );

  function show(route?: RutaAcarreo) {
    setError("");
    setEditing(route ?? null);
    setForm(
      route
        ? {
            proyecto_id: String(route.proyecto.id),
            clave: route.clave,
            origen_id: String(route.ubicacion_origen.id),
            destino_id: String(route.ubicacion_destino.id),
            descripcion: route.descripcion ?? "",
            pavimento: route.distancia_pavimento,
            total: route.distancia_total,
            desde: route.vigente_desde,
            hasta: route.vigente_hasta ?? "",
          }
        : emptyForm,
    );
    setOpen(true);
  }
  async function save() {
    if (Number(form.pavimento) > Number(form.total)) {
      setError("La distancia pavimentada no puede exceder la distancia total.");
      return;
    }
    if (form.hasta && form.hasta < form.desde) {
      setError("La vigencia final debe ser posterior a la inicial.");
      return;
    }
    const payload: RutaAcarreoPayload = {
      proyecto_id: Number(form.proyecto_id),
      clave: form.clave.trim(),
      ubicacion_origen_id: Number(form.origen_id),
      ubicacion_destino_id: Number(form.destino_id),
      distancia_pavimento: Number(form.pavimento),
      distancia_total: Number(form.total),
      vigente_desde: form.desde,
      ...(form.descripcion.trim()
        ? { descripcion: form.descripcion.trim() }
        : {}),
      ...(form.hasta ? { vigente_hasta: form.hasta } : {}),
    };
    setSaving(true);
    setError("");
    try {
      if (editing) await rutasAcarreoService.update(editing.id, payload);
      else await rutasAcarreoService.create(payload);
      setOpen(false);
      await load();
    } catch (cause) {
      setError(getCatalogErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }
  async function setActive(route: RutaAcarreo) {
    try {
      await rutasAcarreoService.setActive(route.id, !route.activo);
      await load();
    } catch (cause) {
      setError(getCatalogErrorMessage(cause));
    }
  }

  return (
    <section>
      <CatalogHeader
        title="Rutas de acarreo"
        description="Administra recorridos, distancias y vigencias sin alterar los viajes históricos."
        actionLabel="Nueva ruta"
        onAction={() => show()}
      />
      {error ? <CatalogAlert variant="error">{error}</CatalogAlert> : null}
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Clave, descripción u ubicación"
        />
        <SelectFilter
          label="Proyecto"
          value={projectFilter}
          onChange={setProjectFilter}
          projects={projects}
        />
        <CatalogSortSelect
          value={sort}
          onChange={setSort}
          options={[
            { value: "clave", label: "Clave" },
            { value: "proyecto", label: "Proyecto" },
            { value: "vigencia", label: "Vigencia reciente" },
          ]}
        />
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-[#CBD5E1] bg-white">
        <StickyHorizontalScroll>
          <table className="admin-table indi-numbered min-w-300">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600">
              <tr>
                {[
                  "#",
                  "Clave",
                  "Proyecto",
                  "Origen",
                  "Destino",
                  "Pavimento",
                  "Total",
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
                visible.map((route, index) => (
                  <tr key={route.id}>
                    <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold">{route.clave}</td>
                    <td className="px-4 py-3">{route.proyecto.nombre}</td>
                    <td className="px-4 py-3">
                      {route.ubicacion_origen.nombre}
                    </td>
                    <td className="px-4 py-3">
                      {route.ubicacion_destino.nombre}
                    </td>
                    <td className="px-4 py-3">
                      {route.distancia_pavimento} km
                    </td>
                    <td className="px-4 py-3">{route.distancia_total} km</td>
                    <td className="px-4 py-3">
                      {route.vigente_desde} —{" "}
                      {route.vigente_hasta ?? "Sin término"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill active={route.activo} />
                    </td>
                    <td className="px-4 py-3">
                      <RowActions
                        entityName="ruta"
                        onEdit={() => show(route)}
                        onSuspend={() => void setActive(route)}
                        onResume={() => void setActive(route)}
                        suspended={!route.activo}
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
                    No hay rutas que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </StickyHorizontalScroll>
      </div>
      <CatalogDialog
        title={editing ? "Editar ruta" : "Nueva ruta"}
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
              })
            }
            items={projects}
          />
          <FormField label="Clave" required>
            <input
              className={inputClassName}
              maxLength={50}
              required
              value={form.clave}
              onChange={(event) =>
                setForm({ ...form, clave: event.target.value })
              }
            />
          </FormField>
          <Choice
            label="Origen"
            value={form.origen_id}
            onChange={(value) => setForm({ ...form, origen_id: value })}
            items={formLocations}
          />
          <Choice
            label="Destino"
            value={form.destino_id}
            onChange={(value) => setForm({ ...form, destino_id: value })}
            items={formLocations.filter(
              (item) => String(item.id) !== form.origen_id,
            )}
          />
          <NumberField
            label="Distancia pavimento (km)"
            value={form.pavimento}
            onChange={(value) => setForm({ ...form, pavimento: value })}
          />
          <NumberField
            label="Distancia total (km)"
            value={form.total}
            onChange={(value) => setForm({ ...form, total: value })}
          />
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
        <FormField label="Descripción">
          <textarea
            className={textareaClassName}
            value={form.descripcion}
            onChange={(event) =>
              setForm({ ...form, descripcion: event.target.value })
            }
          />
        </FormField>
        {editing ? (
          <p className="text-xs text-slate-500">
            Si la ruta ya tiene historial, los cambios de recorrido o distancia
            deben registrarse como una nueva vigencia.
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: Array<{ id: number; nombre: string }>;
}) {
  return (
    <FormField label={label} required>
      <select
        className={inputClassName}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Selecciona una opción</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.nombre}
          </option>
        ))}
      </select>
    </FormField>
  );
}
function NumberField({
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
        min="0"
        step="0.001"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FormField>
  );
}
function SelectFilter({
  label,
  value,
  onChange,
  projects,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  projects: Proyecto[];
}) {
  return (
    <label className="block text-[#475569]">
      <span className="mb-1.5 block text-xs font-semibold">{label}</span>
      <select
        aria-label={`Filtrar por ${label}`}
        className={inputClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Todos</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}
