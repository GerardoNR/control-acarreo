"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CatalogAlert,
  AvailabilitySelect,
  CatalogDialog,
  CatalogHeader,
  CatalogLoadingRows,
  CatalogSortSelect,
  ConfirmActionDialog,
  FormField,
  RowActions,
  SearchInput,
  SuspensionBadge,
  SuspensionDialog,
  inputClassName,
  textareaClassName,
} from "@/components/catalogs/catalog-ui";
import { activeFirst, compareDate, compareTextEs } from "@/lib/catalog-sort";
import { getCatalogErrorMessage } from "@/lib/catalog-errors";
import { proyectosService } from "@/services/proyectos.service";
import { ubicacionesService } from "@/services/ubicaciones.service";
import { useSuspensions } from "@/hooks/use-suspensions";
import type {
  Proyecto,
  TipoUbicacion,
  Ubicacion,
  UbicacionPayload,
  SuspensionPayload,
} from "@/types/catalogs";

const emptyForm = {
  proyecto_id: "",
  nombre: "",
  tipo: "banco" as TipoUbicacion,
  descripcion: "",
  referencia: "",
};
type TypeFilter = "todos" | TipoUbicacion;
const suspensionReasons = ["Acceso restringido", "Condiciones climáticas", "Mantenimiento", "Cierre temporal", "Seguridad", "Operación", "Otro"];

export default function UbicacionesPage() {
  const [items, setItems] = useState<Ubicacion[]>([]);
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("todos");
  const [availability, setAvailability] = useState<"all" | "available" | "suspended">("all");
  const suspensions = useSuspensions("ubicacion");
  const [suspendTarget, setSuspendTarget] = useState<Ubicacion | null>(null);
  const [resumeTarget, setResumeTarget] = useState<Ubicacion | null>(null);
  const [suspensionBusy, setSuspensionBusy] = useState(false);
  const [suspensionError, setSuspensionError] = useState("");
  const [sort, setSort] = useState("project-name");
  const [editing, setEditing] = useState<Ubicacion | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Ubicacion | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    setLoadError(false);
    void Promise.all([ubicacionesService.list(), proyectosService.list()])
      .then(([locations, projectList]) => {
        setItems(locations);
        setProjects(projectList);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    let active = true;
    void Promise.all([ubicacionesService.list(), proyectosService.list()])
      .then(([locations, projectList]) => {
        if (!active) return;
        setItems(locations);
        setProjects(projectList);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-MX");
    const byType =
      typeFilter === "todos"
        ? items
        : items.filter((item) => item.tipo === typeFilter);
    const matches = term
      ? byType.filter((item) =>
          [item.nombre, item.proyecto.nombre].some((value) =>
            value.toLocaleLowerCase("es-MX").includes(term),
          ),
        )
      : byType;
    const byAvailability = matches.filter((item) => availability === "all" || (availability === "suspended") === Boolean(suspensions.active[item.id]));
    return activeFirst(byAvailability, (a, b) =>
      sort === "name-asc"
        ? compareTextEs(a.nombre, b.nombre)
        : sort === "name-desc"
          ? compareTextEs(a.nombre, b.nombre, "desc")
          : sort === "banks-first"
            ? compareTextEs(
                a.tipo === "banco" ? "0" : "1",
                b.tipo === "banco" ? "0" : "1",
              ) || compareTextEs(a.nombre, b.nombre)
            : sort === "fronts-first"
              ? compareTextEs(
                  a.tipo === "frente" ? "0" : "1",
                  b.tipo === "frente" ? "0" : "1",
                ) || compareTextEs(a.nombre, b.nombre)
              : sort === "recent"
                ? compareDate(a.creado_en, b.creado_en)
                : sort === "old"
                  ? compareDate(a.creado_en, b.creado_en, "asc")
                  : compareTextEs(a.proyecto.nombre, b.proyecto.nombre) ||
                    compareTextEs(a.nombre, b.nombre),
    );
  }, [availability, items, search, sort, suspensions.active, typeFilter]);

  async function submitSuspension(payload: SuspensionPayload) { if (!suspendTarget) return; setSuspensionBusy(true); setSuspensionError(""); try { await suspensions.suspend(suspendTarget.id, payload); setSuspendTarget(null); setFeedbackError(false); setFeedback("Ubicación suspendida correctamente."); } catch (error) { setSuspensionError(getCatalogErrorMessage(error)); } finally { setSuspensionBusy(false); } }
  async function resume() { if (!resumeTarget) return; setSuspensionBusy(true); try { await suspensions.resume(resumeTarget.id); setResumeTarget(null); setFeedbackError(false); setFeedback("Ubicación reanudada correctamente."); } catch (error) { setFeedbackError(true); setFeedback(getCatalogErrorMessage(error)); } finally { setSuspensionBusy(false); } }

  const emptyMessage = search.trim()
    ? "No se encontraron bancos o frentes con esos criterios."
    : typeFilter === "banco"
      ? "No hay bancos registrados."
      : typeFilter === "frente"
        ? "No hay frentes registrados."
        : "No hay bancos ni frentes registrados.";

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, proyecto_id: projects[0]?.id.toString() ?? "" });
    setFormError("");
    setOpen(true);
  }
  function openEdit(item: Ubicacion) {
    setEditing(item);
    setForm({
      proyecto_id: item.proyecto.id.toString(),
      nombre: item.nombre,
      tipo: item.tipo,
      descripcion: item.descripcion ?? "",
      referencia: item.referencia ?? "",
    });
    setFormError("");
    setOpen(true);
  }

  async function save() {
    const nombre = form.nombre.trim();
    const proyectoId = Number(form.proyecto_id);
    if (!Number.isInteger(proyectoId) || proyectoId < 1) {
      setFormError("Selecciona un proyecto.");
      return;
    }
    if (nombre.length < 2) {
      setFormError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    const payload: UbicacionPayload = {
      proyecto_id: proyectoId,
      nombre,
      tipo: form.tipo,
      descripcion: form.descripcion.trim() || undefined,
      referencia: form.referencia.trim() || undefined,
    };
    setSaving(true);
    setFormError("");
    try {
      const saved = editing
        ? await ubicacionesService.update(editing.id, payload)
        : await ubicacionesService.create(payload);
      setItems((current) =>
        [...current.filter((item) => item.id !== saved.id), saved].sort(
          (a, b) => a.nombre.localeCompare(b.nombre, "es-MX") || a.id - b.id,
        ),
      );
      setFeedbackError(false);
      setFeedback(
        `${form.tipo === "banco" ? "Banco" : "Frente"} ${editing ? "actualizado" : "creado"} correctamente.`,
      );
      setOpen(false);
    } catch (error) {
      setFormError(getCatalogErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    setDeleting(true);
    setFeedback("");
    try {
      await ubicacionesService.remove(deleteTarget.id);
      setItems((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setFeedbackError(false);
      setFeedback("Ubicación enviada a la Papelera correctamente.");
      setDeleteTarget(null);
    } catch (error) {
      setFeedbackError(true);
      setFeedback(getCatalogErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section>
      <CatalogHeader
        title="Bancos y frentes"
        description="Administra los puntos de origen y destino asociados a cada proyecto."
        actionLabel="+ Nueva ubicación"
        onAction={openCreate}
      />
      {feedback ? (
        <CatalogAlert variant={feedbackError ? "error" : "success"}>
          {feedback}
        </CatalogAlert>
      ) : null}
      <div className="mt-6 overflow-hidden rounded-xl border border-[#CBD5E1] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#E2E8F0] p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar banco o frente..."
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <fieldset>
              <legend className="mb-1.5 text-xs font-semibold text-[#475569]">Tipo</legend>
              <div className="flex h-10 gap-2">
                {(["banco", "frente"] as const).map((tipo) => {
                  const selected = typeFilter === tipo;
                  return (
                    <button
                      key={tipo}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setTypeFilter(selected ? "todos" : tipo)}
                      className={`rounded-lg border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 ${selected ? "border-[#2563EB] bg-[#2563EB] text-white hover:bg-[#1D4ED8]" : "border-[#CBD5E1] bg-white text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"}`}
                    >
                      {tipo === "banco" ? "Banco" : "Frente"}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <AvailabilitySelect value={availability} onChange={setAvailability} />
            <CatalogSortSelect
              value={sort}
              onChange={setSort}
              options={[
                { value: "project-name", label: "Proyecto + nombre A–Z" },
                { value: "name-asc", label: "Nombre A–Z" },
                { value: "name-desc", label: "Nombre Z–A" },
                { value: "banks-first", label: "Bancos primero" },
                { value: "fronts-first", label: "Frentes primero" },
                { value: "recent", label: "Más recientes" },
                { value: "old", label: "Más antiguos" },
              ]}
            />
          </div>
        </div>
        {loadError ? (
          <div className="flex items-center justify-between gap-4 p-5">
            <p className="text-sm text-[#475569]">
              No fue posible cargar la información.
            </p>
            <button
              type="button"
              onClick={load}
              className="text-sm font-semibold text-[#2563EB]"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table indi-numbered min-w-180">
              <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#475569]">
                <tr>
                  <th className="w-14 px-5 py-3">#</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Proyecto</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {loading ? (
                  <CatalogLoadingRows columns={5} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-[#475569]"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, index) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-5 py-3.5 text-[#64748B]">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-[#0F172A]">
                        {item.nombre}<SuspensionBadge suspension={suspensions.active[item.id]} />
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${item.tipo === "banco" ? "bg-blue-50 text-blue-700 ring-blue-200" : "bg-violet-50 text-violet-700 ring-violet-200"}`}
                        >
                          {item.tipo === "banco" ? "Banco" : "Frente"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#475569]">
                        {item.proyecto?.nombre ?? "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <RowActions
                          entityName={item.nombre}
                          onEdit={() => openEdit(item)}
                          suspended={Boolean(suspensions.active[item.id])}
                          onSuspend={() => { setSuspensionError(""); setSuspendTarget(item); }}
                          onResume={() => setResumeTarget(item)}
                          onDelete={() => setDeleteTarget(item)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <CatalogDialog
        title={
          editing
            ? `Editar ${editing.tipo === "banco" ? "banco" : "frente"}`
            : "Nuevo banco o frente"
        }
        open={open}
        saving={saving}
        error={formError}
        onClose={() => setOpen(false)}
        onSubmit={() => void save()}
      >
        <FormField label="Proyecto" required>
          <select
            className={inputClassName}
            required
            value={form.proyecto_id}
            onChange={(e) => setForm({ ...form, proyecto_id: e.target.value })}
          >
            <option value="">Selecciona un proyecto</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.nombre}
                {project.activo ? "" : " (inactivo)"}
              </option>
            ))}
          </select>
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nombre" required>
            <input
              className={inputClassName}
              required
              minLength={2}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </FormField>
          <FormField label="Tipo de ubicación" required>
            <select
              className={inputClassName}
              value={form.tipo}
              onChange={(e) =>
                setForm({ ...form, tipo: e.target.value as TipoUbicacion })
              }
            >
              <option value="banco">Banco</option>
              <option value="frente">Frente</option>
            </select>
          </FormField>
        </div>
        <FormField label="Referencia">
          <input
            className={inputClassName}
            value={form.referencia}
            onChange={(e) => setForm({ ...form, referencia: e.target.value })}
          />
        </FormField>
        <FormField label="Descripción">
          <textarea
            className={textareaClassName}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </FormField>
      </CatalogDialog>
      <SuspensionDialog open={suspendTarget !== null} entityLabel={suspendTarget?.tipo === "frente" ? "frente" : "banco"} entityName={suspendTarget?.nombre ?? ""} reasons={suspensionReasons} saving={suspensionBusy} error={suspensionError} onClose={() => setSuspendTarget(null)} onSubmit={(payload) => void submitSuspension(payload)} />
      <ConfirmActionDialog open={resumeTarget !== null} title="Reanudar ubicación" description={<>¿Deseas reanudar <strong>{resumeTarget?.nombre}</strong>?</>} confirmLabel="Reanudar" busy={suspensionBusy} onClose={() => setResumeTarget(null)} onConfirm={() => void resume()} />
      <ConfirmActionDialog
        open={deleteTarget !== null}
        title={`Eliminar ${deleteTarget?.tipo === "frente" ? "frente" : "banco"}`}
        description={
          <>
            ¿Deseas enviar <strong>“{deleteTarget?.nombre}”</strong> a la
            Papelera?
            <br />
            El registro podrá restaurarse durante 7 días.
          </>
        }
        confirmLabel="Enviar a Papelera"
        busy={deleting}
        destructive
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void remove()}
      />
    </section>
  );
}
