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
} from "@/components/catalogs/catalog-ui";
import { activeFirst, compareDate, compareTextEs } from "@/lib/catalog-sort";
import { getCatalogErrorMessage } from "@/lib/catalog-errors";
import {
  formatLicenseDate,
  licenseDaysRemaining,
  licenseStatus,
  type LicenseStatus,
} from "@/lib/license-status";
import { choferesService } from "@/services/choferes.service";
import { useSuspensions } from "@/hooks/use-suspensions";
import type { SuspensionPayload } from "@/types/catalogs";
import type { Chofer, ChoferPayload } from "@/types/catalogs";

const emptyForm = {
  nombre: "",
  apellido_paterno: "",
  apellido_materno: "",
  telefono: "",
  licencia: "",
  vigencia_licencia: "",
};
const personaNamePattern =
  /^(?=.*\p{L})[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;
const fullName = (item: Chofer) =>
  [item.nombre, item.apellido_paterno, item.apellido_materno]
    .filter(Boolean)
    .join(" ");
const licenseFilterOptions: { value: "ALL" | LicenseStatus; label: string }[] =
  [
    { value: "ALL", label: "Todos" },
    { value: "VIGENTE", label: "Vigente" },
    { value: "POR_VENCER", label: "Por vencer" },
    { value: "VENCIDA", label: "Vencida" },
    { value: "SIN_FECHA", label: "Sin fecha" },
  ];
const suspensionReasons = ["Licencia/documentación", "Incapacidad", "Vacaciones", "Permiso", "Sanción", "Administrativo", "Otro"];
function LicensePill({ expiration }: { expiration: string | null }) {
  const status = licenseStatus(expiration);
  const days = expiration ? licenseDaysRemaining(expiration) : null;
  const styles: Record<LicenseStatus, string> = {
    VIGENTE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    POR_VENCER: "bg-amber-50 text-amber-800 ring-amber-200",
    VENCIDA: "bg-red-50 text-red-700 ring-red-200",
    SIN_FECHA: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  const labels: Record<LicenseStatus, string> = {
    VIGENTE: "Vigente",
    POR_VENCER: "Por vencer",
    VENCIDA: "Vencida",
    SIN_FECHA: "Sin fecha",
  };
  const detail =
    status === "SIN_FECHA"
      ? "Sin fecha registrada"
      : status === "VIGENTE"
        ? formatLicenseDate(expiration!)
        : status === "VENCIDA"
          ? `Venció el ${formatLicenseDate(expiration!)}`
          : days === 0
            ? "Vence hoy"
            : `Vence en ${days} ${days === 1 ? "día" : "días"}`;
  return (
    <div className="min-w-34">
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
      >
        {labels[status]}
      </span>
      <p className="mt-1 text-xs text-[#64748B]">{detail}</p>
    </div>
  );
}

export default function ChoferesPage() {
  const [items, setItems] = useState<Chofer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [licenseFilter, setLicenseFilter] = useState<"ALL" | LicenseStatus>(
    "ALL",
  );
  const [availability, setAvailability] = useState<"all" | "available" | "suspended">("all");
  const suspensions = useSuspensions("chofer");
  const [suspendTarget, setSuspendTarget] = useState<Chofer | null>(null);
  const [resumeTarget, setResumeTarget] = useState<Chofer | null>(null);
  const [suspensionBusy, setSuspensionBusy] = useState(false);
  const [suspensionError, setSuspensionError] = useState("");
  const [editing, setEditing] = useState<Chofer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Chofer | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    setLoadError(false);
    void choferesService
      .list()
      .then(setItems)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    let active = true;
    void choferesService
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
          [fullName(item), item.telefono, item.licencia].some((value) =>
            value?.toLocaleLowerCase("es-MX").includes(term),
          ),
        )
      : items;
    const byLicense =
      licenseFilter === "ALL"
        ? matches
        : matches.filter(
            (item) => licenseStatus(item.vigencia_licencia) === licenseFilter,
          );
    const byAvailability = byLicense.filter((item) => availability === "all" || (availability === "suspended") === Boolean(suspensions.active[item.id]));
    return activeFirst(byAvailability, (a, b) =>
      sort === "name-desc"
        ? compareTextEs(fullName(a), fullName(b), "desc")
        : sort === "recent"
          ? compareDate(a.creado_en, b.creado_en)
          : sort === "old"
            ? compareDate(a.creado_en, b.creado_en, "asc")
            : compareTextEs(fullName(a), fullName(b)),
    );
  }, [availability, items, licenseFilter, search, sort, suspensions.active]);

  async function submitSuspension(payload: SuspensionPayload) {
    if (!suspendTarget) return;
    setSuspensionBusy(true); setSuspensionError("");
    try { await suspensions.suspend(suspendTarget.id, payload); setSuspendTarget(null); setFeedbackError(false); setFeedback("Chofer suspendido correctamente."); }
    catch (error) { setSuspensionError(getCatalogErrorMessage(error)); }
    finally { setSuspensionBusy(false); }
  }
  async function resume() {
    if (!resumeTarget) return;
    setSuspensionBusy(true);
    try { await suspensions.resume(resumeTarget.id); setResumeTarget(null); setFeedbackError(false); setFeedback("Chofer reanudado correctamente."); }
    catch (error) { setFeedbackError(true); setFeedback(getCatalogErrorMessage(error)); }
    finally { setSuspensionBusy(false); }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setOpen(true);
  }
  function openEdit(item: Chofer) {
    setEditing(item);
    setForm({
      nombre: item.nombre,
      apellido_paterno: item.apellido_paterno ?? "",
      apellido_materno: item.apellido_materno ?? "",
      telefono: item.telefono ?? "",
      licencia: item.licencia ?? "",
      vigencia_licencia: item.vigencia_licencia ?? "",
    });
    setFormError("");
    setOpen(true);
  }

  async function save() {
    const nombre = form.nombre.trim();
    const paterno = form.apellido_paterno.trim();
    const materno = form.apellido_materno.trim();
    if (nombre.length < 2) {
      setFormError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (
      ![nombre, paterno, materno]
        .filter(Boolean)
        .every((value) => personaNamePattern.test(value))
    ) {
      setFormError(
        "Nombre y apellidos sólo pueden contener letras, espacios, apóstrofes y guiones.",
      );
      return;
    }
    const telefono = form.telefono.replace(/\D/g, "").slice(0, 10);
    if (form.telefono.trim() && telefono.length !== 10) {
      setFormError("El teléfono debe contener exactamente 10 dígitos.");
      return;
    }
    const optional = (value: string) => value.trim() || undefined;
    const payload: ChoferPayload = {
      nombre,
      apellido_paterno: optional(paterno),
      apellido_materno: optional(materno),
      telefono: telefono || undefined,
      licencia: optional(form.licencia),
      vigencia_licencia: optional(form.vigencia_licencia),
    };
    setSaving(true);
    setFormError("");
    try {
      const saved = editing
        ? await choferesService.update(editing.id, payload)
        : await choferesService.create(payload);
      setItems((current) =>
        [...current.filter((item) => item.id !== saved.id), saved].sort(
          (a, b) => a.nombre.localeCompare(b.nombre, "es-MX") || a.id - b.id,
        ),
      );
      setFeedbackError(false);
      setFeedback(
        `Chofer ${editing ? "actualizado" : "creado"} correctamente.`,
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
      await choferesService.remove(deleteTarget.id);
      setItems((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setFeedbackError(false);
      setFeedback("Chofer enviado a la Papelera correctamente.");
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
        title="Choferes"
        description="Administra el padrón operativo de choferes y sus licencias."
        actionLabel="Nuevo chofer"
        onAction={openCreate}
      />
      {feedback ? (
        <CatalogAlert variant={feedbackError ? "error" : "success"}>
          {feedback}
        </CatalogAlert>
      ) : null}
      <div className="mt-6 overflow-hidden rounded-xl border border-[#CBD5E1] bg-white">
        <div className="grid gap-3 border-b border-[#E2E8F0] p-4 sm:grid-cols-2 lg:grid-cols-[minmax(14rem,1fr)_auto_auto_auto] lg:items-end">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar chofer..."
          />
          <label className="block text-[#475569]">
            <span className="mb-1.5 block text-xs font-semibold">
              Estado de licencia
            </span>
            <select
              value={licenseFilter}
              onChange={(event) =>
                setLicenseFilter(event.target.value as "ALL" | LicenseStatus)
              }
              className="h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-blue-100"
            >
              {licenseFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <AvailabilitySelect value={availability} onChange={setAvailability} />
          <CatalogSortSelect
            value={sort}
            onChange={setSort}
            options={[
              { value: "recent", label: "Más reciente" },
              { value: "old", label: "Más antiguo" },
              { value: "name-asc", label: "Nombre A–Z" },
              { value: "name-desc", label: "Nombre Z–A" },
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
            <table className="admin-table indi-numbered min-w-190 table-fixed">
              <colgroup>
                <col className="w-14" />
                <col className="w-[27%]" />
                <col className="w-36" />
                <col className="w-40" />
                <col className="w-48" />
                <col className="w-32" />
              </colgroup>
              <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#475569]">
                <tr>
                  <th className="w-14 px-5 py-3">#</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Licencia</th>
                  <th className="px-4 py-3">Vigencia</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {loading ? (
                  <CatalogLoadingRows columns={6} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-[#475569]"
                    >
                      {search || licenseFilter !== "ALL"
                        ? "No se encontraron choferes con los filtros seleccionados."
                        : "No hay choferes registrados."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, index) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-5 py-3.5 text-[#64748B]">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-[#0F172A]">
                        {fullName(item)}<SuspensionBadge suspension={suspensions.active[item.id]} />
                      </td>
                      <td className="px-4 py-3.5 text-[#475569]">
                        {item.telefono ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-[#334155]">
                        {item.licencia ?? "Sin número"}
                      </td>
                      <td className="px-4 py-3.5">
                        <LicensePill expiration={item.vigencia_licencia} />
                      </td>
                      <td className="px-5 py-3.5">
                        <RowActions
                          entityName={fullName(item)}
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
        title={editing ? "Editar chofer" : "Nuevo chofer"}
        open={open}
        saving={saving}
        error={formError}
        onClose={() => setOpen(false)}
        onSubmit={() => void save()}
      >
        <FormField label="Nombre" required>
          <input
            className={inputClassName}
            required
            minLength={2}
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Apellido paterno">
            <input
              className={inputClassName}
              value={form.apellido_paterno}
              onChange={(e) =>
                setForm({ ...form, apellido_paterno: e.target.value })
              }
            />
          </FormField>
          <FormField label="Apellido materno">
            <input
              className={inputClassName}
              value={form.apellido_materno}
              onChange={(e) =>
                setForm({ ...form, apellido_materno: e.target.value })
              }
            />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Teléfono">
            <input
              className={inputClassName}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
              value={form.telefono}
              onChange={(e) =>
                setForm({
                  ...form,
                  telefono: e.target.value.replace(/\D/g, "").slice(0, 10),
                })
              }
              aria-describedby="chofer-telefono-help"
            />
            <span
              id="chofer-telefono-help"
              className="mt-1 block text-xs text-[#64748B]"
            >
              10 dígitos
            </span>
          </FormField>
          <FormField label="Número de licencia">
            <input
              className={inputClassName}
              value={form.licencia}
              onChange={(e) => setForm({ ...form, licencia: e.target.value })}
            />
          </FormField>
        </div>
        <FormField label="Fecha de vencimiento de licencia">
          <input
            className={inputClassName}
            type="date"
            value={form.vigencia_licencia}
            onChange={(e) =>
              setForm({ ...form, vigencia_licencia: e.target.value })
            }
          />
          <span className="mt-1 block text-xs text-[#64748B]">
            Puede dejarse sin fecha para registros históricos.
          </span>
        </FormField>
      </CatalogDialog>
      <SuspensionDialog open={suspendTarget !== null} entityLabel="chofer" entityName={suspendTarget ? fullName(suspendTarget) : ""} reasons={suspensionReasons} saving={suspensionBusy} error={suspensionError} onClose={() => setSuspendTarget(null)} onSubmit={(payload) => void submitSuspension(payload)} />
      <ConfirmActionDialog open={resumeTarget !== null} title="Reanudar chofer" description={<>¿Deseas reanudar a <strong>{resumeTarget ? fullName(resumeTarget) : ""}</strong> antes de la fecha prevista?</>} confirmLabel="Reanudar" busy={suspensionBusy} onClose={() => setResumeTarget(null)} onConfirm={() => void resume()} />
      <ConfirmActionDialog
        open={deleteTarget !== null}
        title="Eliminar chofer"
        description={
          <>
            ¿Deseas enviar a{" "}
            <strong>{deleteTarget ? fullName(deleteTarget) : ""}</strong> a la
            Papelera?
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
    </section>
  );
}
