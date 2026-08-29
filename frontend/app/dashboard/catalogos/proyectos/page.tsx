"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CatalogAlert,
  CatalogDialog,
  CatalogHeader,
  CatalogLoadingRows,
  CatalogSortSelect,
  ConfirmActionDialog,
  FormField,
  ProjectActions,
  SearchInput,
  inputClassName,
  textareaClassName,
} from "@/components/catalogs/catalog-ui";
import { activeFirst, compareDate, compareTextEs } from "@/lib/catalog-sort";
import { getCatalogErrorMessage } from "@/lib/catalog-errors";
import { proyectosService } from "@/services/proyectos.service";
import type { Proyecto, ProyectoPayload } from "@/types/catalogs";

const emptyForm = {
  nombre: "",
  clave: "",
  desarrolladora: "",
  descripcion: "",
  nota_ruta: "",
};

export default function ProyectosPage() {
  const [items, setItems] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name-asc");
  const [editing, setEditing] = useState<Proyecto | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState(false);
  const [changingId, setChangingId] = useState<number | null>(null);
  const [finalizeTarget, setFinalizeTarget] = useState<Proyecto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Proyecto | null>(null);

  function load() {
    setLoading(true);
    setLoadError(false);
    void proyectosService
      .list()
      .then(setItems)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let active = true;
    void proyectosService
      .list()
      .then((data) => {
        if (active) setItems(data);
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
    const matches = term
      ? items.filter((item) =>
          [item.nombre, item.clave, item.desarrolladora, item.descripcion].some(
            (value) => value?.toLocaleLowerCase("es-MX").includes(term),
          ),
        )
      : items;
    return activeFirst(matches, (a, b) =>
      sort === "name-desc"
        ? compareTextEs(a.nombre, b.nombre, "desc")
        : sort === "recent"
          ? compareDate(a.creado_en, b.creado_en)
          : sort === "old"
            ? compareDate(a.creado_en, b.creado_en, "asc")
            : compareTextEs(a.nombre, b.nombre),
    );
  }, [items, search, sort]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setOpen(true);
  }
  function openEdit(item: Proyecto) {
    setEditing(item);
    setForm({
      nombre: item.nombre,
      clave: item.clave ?? "",
      desarrolladora: item.desarrolladora ?? "",
      descripcion: item.descripcion ?? "",
      nota_ruta: item.nota_ruta ?? "",
    });
    setFormError("");
    setOpen(true);
  }

  async function save() {
    const nombre = form.nombre.trim();
    if (nombre.length < 2) {
      setFormError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    const optional = (value: string) => value.trim() || undefined;
    const payload: ProyectoPayload = {
      nombre,
      clave: optional(form.clave),
      desarrolladora: optional(form.desarrolladora),
      descripcion: optional(form.descripcion),
      nota_ruta: optional(form.nota_ruta),
    };
    setSaving(true);
    setFormError("");
    try {
      const saved = editing
        ? await proyectosService.update(editing.id, payload)
        : await proyectosService.create(payload);
      setItems((current) =>
        [...current.filter((item) => item.id !== saved.id), saved].sort(
          (a, b) => a.nombre.localeCompare(b.nombre, "es-MX") || a.id - b.id,
        ),
      );
      setFeedbackError(false);
      setFeedback(
        `Proyecto ${editing ? "actualizado" : "creado"} correctamente.`,
      );
      setOpen(false);
    } catch (error) {
      setFormError(getCatalogErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function finalize() {
    if (!finalizeTarget) return;
    setChangingId(finalizeTarget.id);
    setFeedback("");
    setFeedbackError(false);
    try {
      const updated = await proyectosService.finalize(finalizeTarget.id);
      setItems((current) =>
        current.map((value) => (value.id === updated.id ? updated : value)),
      );
      setFeedback(
        "Proyecto finalizado correctamente. Su información histórica se conserva.",
      );
      setFinalizeTarget(null);
    } catch (error) {
      setFeedbackError(true);
      setFeedback(getCatalogErrorMessage(error));
    } finally {
      setChangingId(null);
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    setChangingId(deleteTarget.id);
    setFeedback("");
    setFeedbackError(false);
    try {
      await proyectosService.remove(deleteTarget.id);
      setItems((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setFeedback("Proyecto enviado a la Papelera correctamente.");
      setDeleteTarget(null);
    } catch (error) {
      setFeedbackError(true);
      setFeedback(getCatalogErrorMessage(error));
    } finally {
      setChangingId(null);
    }
  }

  return (
    <section>
      <CatalogHeader
        title="Proyectos"
        description="Administra los proyectos disponibles para la operación."
        actionLabel="Nuevo proyecto"
        onAction={openCreate}
      />
      {feedback ? (
        <CatalogAlert variant={feedbackError ? "error" : "success"}>
          {feedback}
        </CatalogAlert>
      ) : null}
      <div className="mt-6 overflow-hidden rounded-xl border border-[#CBD5E1] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#E2E8F0] p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, clave o desarrolladora"
          />
          <CatalogSortSelect
            value={sort}
            onChange={setSort}
            options={[
              { value: "name-asc", label: "Nombre A–Z" },
              { value: "name-desc", label: "Nombre Z–A" },
              { value: "recent", label: "Más recientes" },
              { value: "old", label: "Más antiguos" },
            ]}
          />
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
            <table className="admin-table indi-numbered min-w-210">
              <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#475569]">
                <tr>
                  <th className="w-14 px-5 py-3">#</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Clave</th>
                  <th className="px-4 py-3">Desarrolladora</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {loading ? (
                  <CatalogLoadingRows columns={7} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-[#475569]"
                    >
                      {search
                        ? "No se encontraron proyectos."
                        : "No hay proyectos registrados."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, index) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-5 py-3.5 text-[#64748B]">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-[#0F172A]">
                        {item.nombre}
                      </td>
                      <td className="px-4 py-3.5 text-[#475569]">
                        {item.clave ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-[#475569]">
                        {item.desarrolladora ?? "—"}
                      </td>
                      <td className="max-w-64 truncate px-4 py-3.5 text-[#475569]">
                        {item.descripcion ?? "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${item.finalizado_at ? "bg-slate-100 text-slate-600 ring-slate-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"}`}
                        >
                          {item.finalizado_at ? "Finalizado" : "Activo"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <ProjectActions
                          finalized={Boolean(item.finalizado_at)}
                          busy={changingId === item.id}
                          name={item.nombre}
                          onEdit={() => openEdit(item)}
                          onFinalize={() => setFinalizeTarget(item)}
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
        title={editing ? "Editar proyecto" : "Nuevo proyecto"}
        open={open}
        saving={saving}
        error={formError}
        onClose={() => setOpen(false)}
        onSubmit={() => void save()}
      >
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
          <FormField label="Clave">
            <input
              className={inputClassName}
              value={form.clave}
              onChange={(e) => setForm({ ...form, clave: e.target.value })}
            />
          </FormField>
        </div>
        <FormField label="Desarrolladora">
          <input
            className={inputClassName}
            value={form.desarrolladora}
            onChange={(e) =>
              setForm({ ...form, desarrolladora: e.target.value })
            }
          />
        </FormField>
        <FormField label="Descripción">
          <textarea
            className={textareaClassName}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </FormField>
        <FormField label="Nota de ruta">
          <textarea
            className={textareaClassName}
            value={form.nota_ruta}
            onChange={(e) => setForm({ ...form, nota_ruta: e.target.value })}
          />
        </FormField>
      </CatalogDialog>
      <ConfirmActionDialog
        open={deleteTarget !== null}
        title="Eliminar proyecto"
        description={
          <>
            ¿Deseas enviar <strong>“{deleteTarget?.nombre}”</strong> a la
            Papelera? Podrás restaurarlo durante 7 días. Si tiene operaciones
            relacionadas, su historial se conservará.
          </>
        }
        confirmLabel="Eliminar"
        busy={changingId !== null}
        destructive
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void remove()}
      />
      <ConfirmActionDialog
        open={finalizeTarget !== null}
        title="Finalizar proyecto"
        description={
          <>
            ¿Deseas finalizar <strong>“{finalizeTarget?.nombre}”</strong>?<br />
            El proyecto dejará de estar disponible para nuevas operaciones, pero
            toda su información histórica será conservada.
          </>
        }
        confirmLabel="Finalizar proyecto"
        busy={changingId !== null}
        onClose={() => setFinalizeTarget(null)}
        onConfirm={() => void finalize()}
      />
    </section>
  );
}
