"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AvailabilitySelect,
  CatalogAlert,
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
} from "@/components/catalogs/catalog-ui";
import { activeFirst, compareDate, compareTextEs } from "@/lib/catalog-sort";
import { getCatalogErrorMessage } from "@/lib/catalog-errors";
import { camionesService } from "@/services/camiones.service";
import type { Camion, CamionPayload } from "@/types/catalogs";
import type { SuspensionPayload } from "@/types/catalogs";
import { useSuspensions } from "@/hooks/use-suspensions";

const emptyForm = {
  placas: "",
  numero_economico: "",
  nfc_tag_uid: "",
  codigo_ticket_unidad: "",
  capacidad_m3: "",
  tipo_camion: "",
  marca: "",
  modelo: "",
  anio: "",
};
const suspensionReasons = [
  "Mantenimiento preventivo",
  "Mantenimiento correctivo",
  "Avería",
  "Documentación",
  "Fuera de servicio",
  "Otro",
];

export default function CamionesPage() {
  const [items, setItems] = useState<Camion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("economic-asc");
  const [availability, setAvailability] = useState<
    "all" | "available" | "suspended"
  >("all");
  const suspensions = useSuspensions("camion");
  const [suspendTarget, setSuspendTarget] = useState<Camion | null>(null);
  const [resumeTarget, setResumeTarget] = useState<Camion | null>(null);
  const [suspensionBusy, setSuspensionBusy] = useState(false);
  const [suspensionError, setSuspensionError] = useState("");
  const [editing, setEditing] = useState<Camion | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Camion | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    setLoadError(false);
    void camionesService
      .list()
      .then(setItems)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let active = true;
    void camionesService
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
          [
            item.placas,
            item.numero_economico,
            item.nfc_tag_uid,
            item.tipo_camion,
            item.marca,
            item.modelo,
          ].some((value) => value?.toLocaleLowerCase("es-MX").includes(term)),
        )
      : items;
    const available = matches.filter(
      (item) =>
        availability === "all" ||
        (availability === "suspended") === Boolean(suspensions.active[item.id]),
    );
    return activeFirst(available, (a, b) =>
      sort === "economic-desc"
        ? compareTextEs(a.numero_economico, b.numero_economico, "desc")
        : sort === "plates-asc"
          ? compareTextEs(a.placas, b.placas)
          : sort === "plates-desc"
            ? compareTextEs(a.placas, b.placas, "desc")
            : sort === "recent"
              ? compareDate(a.creado_en, b.creado_en)
              : sort === "old"
                ? compareDate(a.creado_en, b.creado_en, "asc")
                : compareTextEs(a.numero_economico, b.numero_economico),
    );
  }, [availability, items, search, sort, suspensions.active]);

  async function submitSuspension(payload: SuspensionPayload) {
    if (!suspendTarget) return;
    setSuspensionBusy(true);
    setSuspensionError("");
    try {
      await suspensions.suspend(suspendTarget.id, payload);
      setSuspendTarget(null);
      setFeedbackError(false);
      setFeedback("Camión suspendido correctamente.");
    } catch (error) {
      setSuspensionError(getCatalogErrorMessage(error));
    } finally {
      setSuspensionBusy(false);
    }
  }
  async function resume() {
    if (!resumeTarget) return;
    setSuspensionBusy(true);
    try {
      await suspensions.resume(resumeTarget.id);
      setResumeTarget(null);
      setFeedbackError(false);
      setFeedback("Camión reanudado correctamente.");
    } catch (error) {
      setFeedbackError(true);
      setFeedback(getCatalogErrorMessage(error));
    } finally {
      setSuspensionBusy(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setOpen(true);
  }
  function openEdit(item: Camion) {
    setEditing(item);
    setForm({
      placas: item.placas,
      numero_economico: item.numero_economico ?? "",
      nfc_tag_uid: item.nfc_tag_uid,
      codigo_ticket_unidad: item.codigo_ticket_unidad ?? "",
      capacidad_m3: item.capacidad_m3,
      tipo_camion: item.tipo_camion ?? "",
      marca: item.marca ?? "",
      modelo: item.modelo ?? "",
      anio: item.anio?.toString() ?? "",
    });
    setFormError("");
    setOpen(true);
  }

  async function save() {
    const placas = form.placas.trim();
    const uid = form.nfc_tag_uid.trim();
    const capacidad = Number(form.capacidad_m3);
    if (!placas) {
      setFormError("Las placas son obligatorias.");
      return;
    }
    if (!uid) {
      setFormError("El UID NFC es obligatorio.");
      return;
    }
    if (
      form.codigo_ticket_unidad &&
      !/^\d{5}$/.test(form.codigo_ticket_unidad)
    ) {
      setFormError(
        "El código de unidad para ticket debe contener exactamente 5 dígitos.",
      );
      return;
    }
    if (
      !Number.isFinite(capacidad) ||
      capacidad <= 0 ||
      capacidad > 99_999_999.99 ||
      !/^\d+(?:\.\d{1,2})?$/.test(form.capacidad_m3.trim())
    ) {
      setFormError(
        "La capacidad debe ser positiva y tener máximo 2 decimales.",
      );
      return;
    }
    const anio = form.anio.trim() ? Number(form.anio) : undefined;
    if (
      anio !== undefined &&
      (!Number.isInteger(anio) || anio < 1900 || anio > 2100)
    ) {
      setFormError("El año debe estar entre 1900 y 2100.");
      return;
    }
    const optional = (value: string) => value.trim() || undefined;
    const payload: CamionPayload = {
      placas,
      numero_economico: optional(form.numero_economico),
      nfc_tag_uid: uid,
      codigo_ticket_unidad: optional(form.codigo_ticket_unidad),
      capacidad_m3: capacidad,
      tipo_camion: optional(form.tipo_camion),
      marca: optional(form.marca),
      modelo: optional(form.modelo),
      anio,
    };
    setSaving(true);
    setFormError("");
    try {
      const saved = editing
        ? await camionesService.update(editing.id, payload)
        : await camionesService.create(payload);
      setItems((current) =>
        [...current.filter((item) => item.id !== saved.id), saved].sort(
          (a, b) => a.placas.localeCompare(b.placas, "es-MX") || a.id - b.id,
        ),
      );
      setFeedbackError(false);
      setFeedback(
        `Camión ${editing ? "actualizado" : "creado"} correctamente.`,
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
      await camionesService.remove(deleteTarget.id);
      setItems((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setFeedbackError(false);
      setFeedback("Camión enviado a la Papelera correctamente.");
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
        title="Camiones"
        description="Administra las unidades de transporte y sus identificadores NFC."
        actionLabel="Nuevo camión"
        onAction={openCreate}
      />
      {feedback ? (
        <CatalogAlert variant={feedbackError ? "error" : "success"}>
          {feedback}
        </CatalogAlert>
      ) : null}
      <div className="mt-6 overflow-hidden rounded-xl border border-[#CBD5E1] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#E2E8F0] p-4 sm:flex-row sm:items-end sm:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por económico, placas o UID NFC"
          />
          <AvailabilitySelect value={availability} onChange={setAvailability} />
          <CatalogSortSelect
            value={sort}
            onChange={setSort}
            options={[
              { value: "economic-asc", label: "Número económico ascendente" },
              { value: "economic-desc", label: "Número económico descendente" },
              { value: "plates-asc", label: "Placas A–Z" },
              { value: "plates-desc", label: "Placas Z–A" },
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
            <table className="admin-table indi-numbered min-w-250">
              <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#475569]">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-5 py-3">Económico</th>
                  <th className="px-4 py-3">Placas</th>
                  <th className="px-4 py-3">Código ticket</th>
                  <th className="px-4 py-3">Capacidad</th>
                  <th className="px-4 py-3">UID NFC</th>
                  <th className="px-4 py-3">Unidad</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {loading ? (
                  <CatalogLoadingRows columns={8} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-[#475569]"
                    >
                      {search || availability !== "all"
                        ? "No se encontraron camiones."
                        : "No hay camiones registrados."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, index) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3.5 text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-[#0F172A]">
                        {item.numero_economico ?? "—"}
                        <SuspensionBadge
                          suspension={suspensions.active[item.id]}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-[#475569]">
                        {item.placas}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[#475569]">
                        {item.codigo_ticket_unidad ?? "Sin asignar"}
                      </td>
                      <td className="px-4 py-3.5 tabular-nums text-[#475569]">
                        {Number(item.capacidad_m3).toLocaleString("es-MX", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        m³
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-[#475569]">
                        {item.nfc_tag_uid || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-[#475569]">
                        {[item.tipo_camion, item.marca, item.modelo, item.anio]
                          .filter(Boolean)
                          .join(" · ") || "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <RowActions
                          entityName={item.numero_economico ?? item.placas}
                          onEdit={() => openEdit(item)}
                          suspended={Boolean(suspensions.active[item.id])}
                          onSuspend={() => {
                            setSuspensionError("");
                            setSuspendTarget(item);
                          }}
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
        title={editing ? "Editar camión" : "Nuevo camión"}
        open={open}
        saving={saving}
        error={formError}
        onClose={() => setOpen(false)}
        onSubmit={() => void save()}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Placas" required>
            <input
              className={inputClassName}
              required
              value={form.placas}
              onChange={(e) => setForm({ ...form, placas: e.target.value })}
            />
          </FormField>
          <FormField label="Número económico">
            <input
              className={inputClassName}
              value={form.numero_economico}
              onChange={(e) =>
                setForm({ ...form, numero_economico: e.target.value })
              }
            />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="UID NFC" required>
            <input
              className={`${inputClassName} font-mono`}
              required
              autoCapitalize="none"
              spellCheck={false}
              value={form.nfc_tag_uid}
              onChange={(e) =>
                setForm({ ...form, nfc_tag_uid: e.target.value })
              }
            />
          </FormField>
          <FormField label="Capacidad (m³)" required>
            <input
              className={inputClassName}
              required
              type="number"
              inputMode="decimal"
              min="0.01"
              max="99999999.99"
              step="0.01"
              value={form.capacidad_m3}
              onChange={(e) =>
                setForm({ ...form, capacidad_m3: e.target.value })
              }
            />
          </FormField>
        </div>
        <FormField label="Código de unidad para ticket">
          <input
            className={`${inputClassName} font-mono`}
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            disabled={Boolean(editing?.codigo_ticket_unidad)}
            value={form.codigo_ticket_unidad}
            onChange={(e) =>
              setForm({
                ...form,
                codigo_ticket_unidad: e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 5),
              })
            }
          />
          {editing?.codigo_ticket_unidad ? (
            <p className="mt-1 text-xs text-slate-500">
              Este código ya fue asignado y no puede modificarse mediante la
              edición normal.
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              Opcional al crear; debe contener exactamente 5 dígitos.
            </p>
          )}
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Tipo de camión">
            <input
              className={inputClassName}
              value={form.tipo_camion}
              onChange={(e) =>
                setForm({ ...form, tipo_camion: e.target.value })
              }
            />
          </FormField>
          <FormField label="Marca">
            <input
              className={inputClassName}
              value={form.marca}
              onChange={(e) => setForm({ ...form, marca: e.target.value })}
            />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Modelo">
            <input
              className={inputClassName}
              value={form.modelo}
              onChange={(e) => setForm({ ...form, modelo: e.target.value })}
            />
          </FormField>
          <FormField label="Año">
            <input
              className={inputClassName}
              type="number"
              inputMode="numeric"
              min="1900"
              max="2100"
              step="1"
              value={form.anio}
              onChange={(e) => setForm({ ...form, anio: e.target.value })}
            />
          </FormField>
        </div>
      </CatalogDialog>
      <ConfirmActionDialog
        open={deleteTarget !== null}
        title="Eliminar camión"
        description={
          <>
            ¿Deseas enviar a{" "}
            <strong>
              {deleteTarget
                ? (deleteTarget.numero_economico ?? deleteTarget.placas)
                : ""}
            </strong>{" "}
            a la Papelera?
            <br />
            Podrás restaurarlo durante los próximos 7 días.
          </>
        }
        confirmLabel="Enviar a Papelera"
        busy={deleting}
        destructive
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void remove()}
      />
      <SuspensionDialog
        open={suspendTarget !== null}
        entityLabel="camión"
        entityName={
          suspendTarget
            ? (suspendTarget.numero_economico ?? suspendTarget.placas)
            : ""
        }
        reasons={suspensionReasons}
        saving={suspensionBusy}
        error={suspensionError}
        onClose={() => setSuspendTarget(null)}
        onSubmit={(payload) => void submitSuspension(payload)}
      />
      <ConfirmActionDialog
        open={resumeTarget !== null}
        title="Reanudar camión"
        description={
          <>
            ¿Deseas reanudar{" "}
            <strong>
              {resumeTarget
                ? (resumeTarget.numero_economico ?? resumeTarget.placas)
                : ""}
            </strong>
            ?
          </>
        }
        confirmLabel="Reanudar"
        busy={suspensionBusy}
        onClose={() => setResumeTarget(null)}
        onConfirm={() => void resume()}
      />
    </section>
  );
}
