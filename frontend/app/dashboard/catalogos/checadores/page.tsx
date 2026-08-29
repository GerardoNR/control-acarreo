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
import { checadoresService } from "@/services/checadores.service";
import { useSuspensions } from "@/hooks/use-suspensions";
import type {
  Checador,
  CreateChecadorPayload,
  UpdateChecadorPayload,
  SuspensionPayload,
} from "@/types/catalogs";

const emptyForm = {
  nombre: "",
  telefono: "",
  usuario: "",
  password: "",
  passwordConfirmation: "",
};
const personaNamePattern =
  /^(?=.*\p{L})[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;
const suspensionReasons = ["Administrativo", "Vacaciones", "Incapacidad", "Permiso", "Otro"];

export default function ChecadoresPage() {
  const [items, setItems] = useState<Checador[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name-asc");
  const [availability, setAvailability] = useState<"all" | "available" | "suspended">("all");
  const suspensions = useSuspensions("checador");
  const [suspendTarget, setSuspendTarget] = useState<Checador | null>(null);
  const [resumeTarget, setResumeTarget] = useState<Checador | null>(null);
  const [suspensionBusy, setSuspensionBusy] = useState(false);
  const [suspensionError, setSuspensionError] = useState("");
  const [editing, setEditing] = useState<Checador | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Checador | null>(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    setLoadError(false);
    void checadoresService
      .list()
      .then(setItems)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let active = true;
    void checadoresService
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
          [item.nombre, item.usuario, item.telefono].some((value) =>
            value?.toLocaleLowerCase("es-MX").includes(term),
          ),
        )
      : items;
    const byAvailability = matches.filter((item) => availability === "all" || (availability === "suspended") === Boolean(suspensions.active[item.id]));
    return activeFirst(byAvailability, (a, b) =>
      sort === "name-desc"
        ? compareTextEs(a.nombre, b.nombre, "desc")
        : sort === "recent"
          ? compareDate(a.creado_en, b.creado_en)
          : sort === "old"
            ? compareDate(a.creado_en, b.creado_en, "asc")
            : sort === "last-access"
              ? compareDate(a.ultimo_acceso, b.ultimo_acceso)
              : compareTextEs(a.nombre, b.nombre),
    );
  }, [availability, items, search, sort, suspensions.active]);

  async function submitSuspension(payload: SuspensionPayload) { if (!suspendTarget) return; setSuspensionBusy(true); setSuspensionError(""); try { await suspensions.suspend(suspendTarget.id, payload); setSuspendTarget(null); setFeedbackError(false); setFeedback("Checador suspendido correctamente."); } catch (error) { setSuspensionError(getCatalogErrorMessage(error)); } finally { setSuspensionBusy(false); } }
  async function resume() { if (!resumeTarget) return; setSuspensionBusy(true); try { await suspensions.resume(resumeTarget.id); setResumeTarget(null); setFeedbackError(false); setFeedback("Checador reanudado correctamente."); } catch (error) { setFeedbackError(true); setFeedback(getCatalogErrorMessage(error)); } finally { setSuspensionBusy(false); } }

  function clearSensitiveForm() {
    setForm((current) => ({
      ...current,
      password: "",
      passwordConfirmation: "",
    }));
    setShowPassword(false);
    setResettingPassword(false);
  }

  function closeDialog() {
    clearSensitiveForm();
    setOpen(false);
    setFormError("");
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowPassword(false);
    setResettingPassword(false);
    setFormError("");
    setOpen(true);
  }

  function openEdit(item: Checador) {
    setEditing(item);
    setForm({
      nombre: item.nombre,
      telefono: item.telefono ?? "",
      usuario: item.usuario,
      password: "",
      passwordConfirmation: "",
    });
    setShowPassword(false);
    setResettingPassword(false);
    setFormError("");
    setOpen(true);
  }

  async function save() {
    const nombre = form.nombre.trim();
    const usuario = form.usuario.trim().toLowerCase();
    const changingPassword = !editing || resettingPassword;
    if (nombre.length < 2 || !personaNamePattern.test(nombre)) {
      setFormError(
        "El nombre debe tener al menos 2 caracteres y usar únicamente letras, espacios, apóstrofes o guiones.",
      );
      return;
    }
    if (usuario.length < 3) {
      setFormError("El usuario debe tener al menos 3 caracteres.");
      return;
    }
    if (changingPassword && form.password.length === 0) {
      setFormError("La contraseña es obligatoria.");
      return;
    }
    if (changingPassword && form.password.length < 8) {
      setFormError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (changingPassword && form.password !== form.passwordConfirmation) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }
    const telefono = form.telefono.replace(/\D/g, "").slice(0, 10);
    if (form.telefono.trim() && telefono.length !== 10) {
      setFormError("El teléfono debe contener exactamente 10 dígitos.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      let saved: Checador;
      if (editing) {
        const payload: UpdateChecadorPayload = { nombre, usuario, telefono };
        if (resettingPassword) payload.password = form.password;
        saved = await checadoresService.update(editing.id, payload);
      } else {
        const payload: CreateChecadorPayload = {
          nombre,
          usuario,
          telefono,
          password: form.password,
        };
        saved = await checadoresService.create(payload);
      }
      setItems((current) =>
        [...current.filter((item) => item.id !== saved.id), saved].sort(
          (a, b) => a.nombre.localeCompare(b.nombre, "es-MX") || a.id - b.id,
        ),
      );
      setFeedbackError(false);
      setFeedback(
        `Checador ${editing ? "actualizado" : "creado"} correctamente.`,
      );
      setForm(emptyForm);
      setShowPassword(false);
      setResettingPassword(false);
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
      await checadoresService.remove(deleteTarget.id);
      setItems((current) =>
        current.filter((item) => item.id !== deleteTarget.id),
      );
      setFeedbackError(false);
      setFeedback("Checador enviado a la Papelera correctamente.");
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
        title="Checadores"
        description="Administra las cuentas operativas autorizadas para registrar viajes."
        actionLabel="Nuevo checador"
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
            placeholder="Buscar por nombre, usuario o teléfono"
          />
          <AvailabilitySelect value={availability} onChange={setAvailability} />
          <CatalogSortSelect
            value={sort}
            onChange={setSort}
            options={[
              { value: "name-asc", label: "Nombre A–Z" },
              { value: "name-desc", label: "Nombre Z–A" },
              { value: "recent", label: "Más recientes" },
              { value: "old", label: "Más antiguos" },
              { value: "last-access", label: "Último acceso reciente" },
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
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Último acceso</th>
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
                      {search
                        ? "No se encontraron checadores."
                        : "No hay checadores registrados."}
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
                      <td className="px-4 py-3.5 font-mono text-xs text-[#475569]">
                        {item.usuario}
                      </td>
                      <td className="px-4 py-3.5 text-[#475569]">
                        {item.telefono ?? "—"}
                      </td>
                      <td className="px-4 py-3.5 text-[#475569]">
                        {item.ultimo_acceso
                          ? new Intl.DateTimeFormat("es-MX", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(item.ultimo_acceso))
                          : "—"}
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
        title={editing ? "Editar checador" : "Nuevo checador"}
        open={open}
        saving={saving}
        error={formError}
        onClose={closeDialog}
        onSubmit={() => void save()}
      >
        <FormField label="Nombre completo" required>
          <input
            className={inputClassName}
            required
            minLength={2}
            autoComplete="name"
            value={form.nombre}
            onChange={(event) =>
              setForm({ ...form, nombre: event.target.value })
            }
          />
        </FormField>
        <div className="max-w-sm">
          <FormField label="Teléfono">
            <input
              className={inputClassName}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
              value={form.telefono}
              onChange={(event) =>
                setForm({
                  ...form,
                  telefono: event.target.value.replace(/\D/g, "").slice(0, 10),
                })
              }
              aria-describedby="checador-telefono-help"
            />
            <span
              id="checador-telefono-help"
              className="mt-1 block text-xs text-[#64748B]"
            >
              10 dígitos
            </span>
          </FormField>
        </div>
        <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-[#0F172A]">
              Credenciales de acceso
            </p>
          </div>
          <FormField label="Usuario" required>
            <input
              className={inputClassName}
              required
              minLength={3}
              autoCapitalize="none"
              autoComplete="username"
              spellCheck={false}
              value={form.usuario}
              onChange={(event) =>
                setForm({ ...form, usuario: event.target.value })
              }
            />
          </FormField>
          {editing && !resettingPassword ? (
            <button
              type="button"
              className="mt-4 rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-semibold text-[#2563EB] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              onClick={() => {
                setResettingPassword(true);
                setFormError("");
              }}
            >
              Restablecer contraseña
            </button>
          ) : (
            <div className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={editing ? "Nueva contraseña" : "Contraseña"}
              required
            >
              <input
                className={inputClassName}
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
              />
            </FormField>
            <FormField
              label={editing ? "Confirmar nueva contraseña" : "Confirmar contraseña"}
              required
            >
              <input
                className={inputClassName}
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={form.passwordConfirmation}
                onChange={(event) =>
                  setForm({ ...form, passwordConfirmation: event.target.value })
                }
              />
            </FormField>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#475569]">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(event) => setShowPassword(event.target.checked)}
              className="size-4 rounded border-[#CBD5E1] accent-[#2563EB]"
            />
            Mostrar contraseñas
                </label>
                {editing ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#475569] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    onClick={clearSensitiveForm}
                  >
                    Cancelar restablecimiento
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </CatalogDialog>
      <SuspensionDialog open={suspendTarget !== null} entityLabel="checador" entityName={suspendTarget?.nombre ?? ""} reasons={suspensionReasons} saving={suspensionBusy} error={suspensionError} onClose={() => setSuspendTarget(null)} onSubmit={(payload) => void submitSuspension(payload)} />
      <ConfirmActionDialog open={resumeTarget !== null} title="Reanudar checador" description={<>¿Deseas reanudar a <strong>{resumeTarget?.nombre}</strong>?</>} confirmLabel="Reanudar" busy={suspensionBusy} onClose={() => setResumeTarget(null)} onConfirm={() => void resume()} />
      <ConfirmActionDialog
        open={deleteTarget !== null}
        title="Eliminar checador"
        description={
          <>
            ¿Deseas enviar a <strong>“{deleteTarget?.nombre}”</strong> a la
            Papelera?
            <br />
            Podrás restaurarlo durante los próximos 7 días. Dejará de poder
            iniciar sesión inmediatamente.
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
