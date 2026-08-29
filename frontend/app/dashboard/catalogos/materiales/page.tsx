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
  RowActions,
  SearchInput,
  inputClassName,
  textareaClassName,
} from "@/components/catalogs/catalog-ui";
import { activeFirst, compareDate, compareTextEs } from "@/lib/catalog-sort";
import { getCatalogErrorMessage } from "@/lib/catalog-errors";
import { materialesService } from "@/services/materiales.service";
import type { Material, MaterialPayload } from "@/types/catalogs";

const emptyForm = { nombre: "", unidad_medida: "", descripcion: "" };

export default function MaterialesPage() {
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name-asc");
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    setLoadError(false);
    void materialesService
      .list()
      .then(setItems)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    let active = true;
    void materialesService
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
          [item.nombre, item.unidad_medida, item.descripcion].some((value) =>
            value?.toLocaleLowerCase("es-MX").includes(term),
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
  function openEdit(item: Material) {
    setEditing(item);
    setForm({
      nombre: item.nombre,
      unidad_medida: item.unidad_medida,
      descripcion: item.descripcion ?? "",
    });
    setFormError("");
    setOpen(true);
  }

  async function save() {
    const nombre = form.nombre.trim();
    const unidad = form.unidad_medida.trim();
    if (nombre.length < 2) {
      setFormError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (!unidad) {
      setFormError("La unidad de medida es obligatoria.");
      return;
    }
    const payload: MaterialPayload = {
      nombre,
      unidad_medida: unidad,
      descripcion: form.descripcion.trim() || undefined,
    };
    setSaving(true);
    setFormError("");
    try {
      const saved = editing
        ? await materialesService.update(editing.id, payload)
        : await materialesService.create(payload);
      setItems((current) =>
        [...current.filter((item) => item.id !== saved.id), saved].sort(
          (a, b) => a.nombre.localeCompare(b.nombre, "es-MX") || a.id - b.id,
        ),
      );
      setFeedbackError(false);
      setFeedback(
        `Material ${editing ? "actualizado" : "creado"} correctamente.`,
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
      await materialesService.remove(deleteTarget.id);
      setItems((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setFeedbackError(false);
      setFeedback("Material enviado a la Papelera correctamente.");
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
        title="Materiales"
        description="Administra materiales y sus unidades de medida."
        actionLabel="Nuevo material"
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
            placeholder="Buscar por nombre, unidad o descripción"
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
            <table className="admin-table indi-numbered min-w-170">
              <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#475569]">
                <tr>
                  <th className="w-14 px-5 py-3">#</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Unidad de medida</th>
                  <th className="px-4 py-3">Descripción</th>
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
                      {search
                        ? "No se encontraron materiales."
                        : "No hay materiales registrados."}
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
                        {item.unidad_medida}
                      </td>
                      <td className="max-w-96 truncate px-4 py-3.5 text-[#475569]">
                        {item.descripcion ?? "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <RowActions
                          entityName={item.nombre}
                          onEdit={() => openEdit(item)}
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
        title={editing ? "Editar material" : "Nuevo material"}
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
          <FormField label="Unidad de medida" required>
            <input
              className={inputClassName}
              required
              value={form.unidad_medida}
              onChange={(e) =>
                setForm({ ...form, unidad_medida: e.target.value })
              }
              placeholder="Ej. m3, m³, ton"
            />
          </FormField>
        </div>
        <p className="-mt-2 text-xs text-[#64748B]">
          Usa la unidad operativa real; el sistema no limita este campo a una
          lista cerrada.
        </p>
        <FormField label="Descripción">
          <textarea
            className={textareaClassName}
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          />
        </FormField>
      </CatalogDialog>
      <ConfirmActionDialog
        open={deleteTarget !== null}
        title="Eliminar material"
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
