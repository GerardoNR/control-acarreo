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
import { getCatalogErrorMessage } from "@/lib/catalog-errors";
import { proyectosService } from "@/services/proyectos.service";
import { unidadesControlService } from "@/services/unidades-control.service";
import type { Proyecto } from "@/types/catalogs";
import type {
  UnidadControl,
  UnidadControlPayload,
} from "@/types/configuracion-operativa";

const emptyForm = { proyecto_id: "", nombre: "", descripcion: "" };

export default function UnidadesControlPage() {
  const [units, setUnits] = useState<UnidadControl[]>([]);
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<UnidadControl | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [sort, setSort] = useState("nombre");

  async function load() {
    setLoading(true);
    try {
      const [unitData, projectData] = await Promise.all([
        unidadesControlService.list(),
        proyectosService.list(),
      ]);
      setUnits(unitData);
      setProjects(projectData);
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
      units
        .filter(
          (unit) =>
            (!projectFilter || unit.proyecto.id === Number(projectFilter)) &&
            `${unit.nombre} ${unit.descripcion ?? ""}`
              .toLocaleLowerCase("es-MX")
              .includes(search.toLocaleLowerCase("es-MX")),
        )
        .sort((a, b) =>
          sort === "proyecto"
            ? a.proyecto.nombre.localeCompare(b.proyecto.nombre)
            : a.nombre.localeCompare(b.nombre),
        ),
    [projectFilter, search, sort, units],
  );

  function show(unit?: UnidadControl) {
    setError("");
    setEditing(unit ?? null);
    setForm(
      unit
        ? {
            proyecto_id: String(unit.proyecto.id),
            nombre: unit.nombre,
            descripcion: unit.descripcion ?? "",
          }
        : emptyForm,
    );
    setOpen(true);
  }
  async function save() {
    const payload: UnidadControlPayload = {
      proyecto_id: Number(form.proyecto_id),
      nombre: form.nombre.trim(),
      ...(form.descripcion.trim()
        ? { descripcion: form.descripcion.trim() }
        : {}),
    };
    setSaving(true);
    setError("");
    try {
      if (editing) await unidadesControlService.update(editing.id, payload);
      else await unidadesControlService.create(payload);
      setOpen(false);
      await load();
    } catch (cause) {
      setError(getCatalogErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  }
  async function setActive(unit: UnidadControl) {
    try {
      await unidadesControlService.setActive(unit.id, !unit.activo);
      await load();
    } catch (cause) {
      setError(getCatalogErrorMessage(cause));
    }
  }

  return (
    <section>
      <CatalogHeader
        title="Unidades de control"
        description="Configura las unidades operativas de cada proyecto y retíralas sin perder historial."
        actionLabel="Nueva unidad"
        onAction={() => show()}
      />
      {error ? <CatalogAlert variant="error">{error}</CatalogAlert> : null}
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Nombre o descripción"
        />
        <label className="block text-[#475569]">
          <span className="mb-1.5 block text-xs font-semibold">Proyecto</span>
          <select
            aria-label="Filtrar por proyecto"
            className={inputClassName}
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
          >
            <option value="">Todos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.nombre}
              </option>
            ))}
          </select>
        </label>
        <CatalogSortSelect
          value={sort}
          onChange={setSort}
          options={[
            { value: "nombre", label: "Nombre" },
            { value: "proyecto", label: "Proyecto" },
          ]}
        />
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-[#CBD5E1] bg-white">
        <table className="admin-table indi-numbered min-w-180">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-600">
            <tr>
              {[
                "#",
                "Nombre",
                "Proyecto",
                "Descripción",
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
              <CatalogLoadingRows columns={6} />
            ) : visible.length ? (
              visible.map((unit, index) => (
                <tr key={unit.id}>
                  <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-4 py-3 font-semibold">{unit.nombre}</td>
                  <td className="px-4 py-3">{unit.proyecto.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {unit.descripcion || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill active={unit.activo} />
                  </td>
                  <td className="px-4 py-3">
                    <RowActions
                      entityName="unidad de control"
                      onEdit={() => show(unit)}
                      onSuspend={() => void setActive(unit)}
                      onResume={() => void setActive(unit)}
                      suspended={!unit.activo}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-slate-500"
                >
                  No hay unidades que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <CatalogDialog
        title={editing ? "Editar unidad de control" : "Nueva unidad de control"}
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
              required
              value={form.proyecto_id}
              onChange={(event) =>
                setForm({ ...form, proyecto_id: event.target.value })
              }
            >
              <option value="">Selecciona un proyecto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.nombre}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Nombre" required>
            <input
              className={inputClassName}
              maxLength={100}
              required
              value={form.nombre}
              onChange={(event) =>
                setForm({ ...form, nombre: event.target.value })
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
      </CatalogDialog>
    </section>
  );
}
