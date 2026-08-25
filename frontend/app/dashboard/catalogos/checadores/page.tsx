"use client";

import { useEffect, useMemo, useState } from "react";
import { CatalogAlert, CatalogDialog, CatalogHeader, CatalogLoadingRows, FormField, RowActions, SearchInput, StatusPill, inputClassName } from "@/components/catalogs/catalog-ui";
import { getCatalogErrorMessage } from "@/lib/catalog-errors";
import { checadoresService } from "@/services/checadores.service";
import type { Checador, CreateChecadorPayload, UpdateChecadorPayload } from "@/types/catalogs";

const emptyForm = { nombre: "", telefono: "", usuario: "", password: "", passwordConfirmation: "" };
const personaNamePattern = /^(?=.*\p{L})[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;

export default function ChecadoresPage() {
  const [items, setItems] = useState<Checador[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Checador | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState(false);
  const [changingId, setChangingId] = useState<number | null>(null);

  function load() {
    setLoading(true); setLoadError(false);
    void checadoresService.list().then(setItems).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }

  useEffect(() => {
    let active = true;
    void checadoresService.list().then((data) => { if (active) setItems(data); }).catch(() => { if (active) setLoadError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-MX");
    if (!term) return items;
    return items.filter((item) => [item.nombre, item.usuario, item.telefono].some((value) => value?.toLocaleLowerCase("es-MX").includes(term)));
  }, [items, search]);

  function clearSensitiveForm() {
    setForm((current) => ({ ...current, password: "", passwordConfirmation: "" }));
    setShowPassword(false);
  }

  function closeDialog() {
    clearSensitiveForm();
    setOpen(false);
    setFormError("");
  }

  function openCreate() {
    setEditing(null); setForm(emptyForm); setShowPassword(false); setFormError(""); setOpen(true);
  }

  function openEdit(item: Checador) {
    setEditing(item);
    setForm({ nombre: item.nombre, telefono: item.telefono ?? "", usuario: item.usuario, password: "", passwordConfirmation: "" });
    setShowPassword(false); setFormError(""); setOpen(true);
  }

  async function save() {
    const nombre = form.nombre.trim();
    const usuario = form.usuario.trim().toLowerCase();
    const changingPassword = form.password.length > 0;
    if (nombre.length < 2 || !personaNamePattern.test(nombre)) { setFormError("El nombre debe tener al menos 2 caracteres y usar únicamente letras, espacios, apóstrofes o guiones."); return; }
    if (usuario.length < 3) { setFormError("El usuario debe tener al menos 3 caracteres."); return; }
    if (!editing && !changingPassword) { setFormError("La contraseña es obligatoria."); return; }
    if (changingPassword && form.password.length < 8) { setFormError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (changingPassword && form.password !== form.passwordConfirmation) { setFormError("Las contraseñas no coinciden."); return; }
    const telefono = form.telefono.replace(/\D/g, '').slice(0, 10);
    if (form.telefono.trim() && telefono.length !== 10) { setFormError("El teléfono debe contener exactamente 10 dígitos."); return; }
    setSaving(true); setFormError("");
    try {
      let saved: Checador;
      if (editing) {
        const payload: UpdateChecadorPayload = { nombre, usuario, telefono };
        if (changingPassword) payload.password = form.password;
        saved = await checadoresService.update(editing.id, payload);
      } else {
        const payload: CreateChecadorPayload = { nombre, usuario, telefono, password: form.password };
        saved = await checadoresService.create(payload);
      }
      setItems((current) => [...current.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.nombre.localeCompare(b.nombre, "es-MX") || a.id - b.id));
      setFeedbackError(false); setFeedback(`Checador ${editing ? "actualizado" : "creado"} correctamente.`);
      setForm(emptyForm); setShowPassword(false); setOpen(false);
    } catch (error) { setFormError(getCatalogErrorMessage(error)); }
    finally { setSaving(false); }
  }

  async function toggle(item: Checador) {
    if (!window.confirm(`¿Deseas ${item.activo ? "desactivar" : "activar"} al checador “${item.nombre}”?`)) return;
    setChangingId(item.id); setFeedback(""); setFeedbackError(false);
    try {
      const updated = await checadoresService.setActive(item.id, !item.activo);
      setItems((current) => current.map((value) => value.id === updated.id ? updated : value));
      setFeedback(`Checador ${updated.activo ? "activado" : "desactivado"} correctamente.`);
    } catch (error) { setFeedbackError(true); setFeedback(getCatalogErrorMessage(error)); }
    finally { setChangingId(null); }
  }

  return <section>
    <CatalogHeader title="Checadores" description="Administra las cuentas operativas autorizadas para registrar viajes." actionLabel="Nuevo checador" onAction={openCreate} />
    {feedback ? <CatalogAlert variant={feedbackError ? "error" : "success"}>{feedback}</CatalogAlert> : null}
    <div className="mt-6 overflow-hidden rounded-xl border border-[#CBD5E1] bg-white">
      <div className="border-b border-[#E2E8F0] p-4"><SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, usuario o teléfono" /></div>
      {loadError ? <div className="flex items-center justify-between gap-4 p-5"><p className="text-sm text-[#475569]">No fue posible cargar la información.</p><button type="button" onClick={load} className="text-sm font-semibold text-[#2563EB]">Reintentar</button></div> : <div className="overflow-x-auto"><table className="w-full min-w-170 text-left text-sm"><thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#475569]"><tr><th className="px-5 py-3">Nombre</th><th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Teléfono</th><th className="px-4 py-3">Último acceso</th><th className="px-4 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-[#E2E8F0]">
        {loading ? <CatalogLoadingRows columns={6} /> : filtered.length === 0 ? <tr><td colSpan={6} className="px-5 py-10 text-center text-[#475569]">{search ? "No se encontraron checadores." : "No hay checadores registrados."}</td></tr> : filtered.map((item) => <tr key={item.id} className="hover:bg-[#F8FAFC]"><td className="px-5 py-3.5 font-medium text-[#0F172A]">{item.nombre}</td><td className="px-4 py-3.5 font-mono text-xs text-[#475569]">{item.usuario}</td><td className="px-4 py-3.5 text-[#475569]">{item.telefono ?? "—"}</td><td className="px-4 py-3.5 text-[#475569]">{item.ultimo_acceso ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.ultimo_acceso)) : "—"}</td><td className="px-4 py-3.5"><StatusPill active={item.activo} /></td><td className="px-5 py-3.5"><RowActions active={item.activo} busy={changingId === item.id} onEdit={() => openEdit(item)} onToggle={() => void toggle(item)} /></td></tr>)}
      </tbody></table></div>}
    </div>
    <CatalogDialog title={editing ? "Editar checador" : "Nuevo checador"} open={open} saving={saving} error={formError} onClose={closeDialog} onSubmit={() => void save()}>
      <FormField label="Nombre" required><input className={inputClassName} required minLength={2} autoComplete="name" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} /></FormField>
      <div className="grid gap-4 sm:grid-cols-2"><FormField label="Usuario" required><input className={inputClassName} required minLength={3} autoCapitalize="none" autoComplete="username" spellCheck={false} value={form.usuario} onChange={(event) => setForm({ ...form, usuario: event.target.value })} /></FormField><FormField label="Teléfono"><input className={inputClassName} type="tel" inputMode="numeric" maxLength={10} autoComplete="tel" value={form.telefono} onChange={(event) => setForm({ ...form, telefono: event.target.value.replace(/\D/g, '').slice(0, 10) })} aria-describedby="checador-telefono-help" /><span id="checador-telefono-help" className="mt-1 block text-xs text-[#64748B]">10 dígitos</span></FormField></div>
      <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
        <div className="mb-3"><p className="text-sm font-semibold text-[#0F172A]">{editing ? "Cambiar contraseña" : "Contraseña de acceso"}</p>{editing ? <p className="mt-1 text-xs text-[#475569]">Déjala vacía para conservar la contraseña actual.</p> : null}</div>
        <div className="grid gap-4 sm:grid-cols-2"><FormField label={editing ? "Nueva contraseña" : "Contraseña"} required={!editing}><input className={inputClassName} type={showPassword ? "text" : "password"} required={!editing} minLength={8} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></FormField><FormField label="Confirmar contraseña" required={!editing}><input className={inputClassName} type={showPassword ? "text" : "password"} required={!editing} minLength={form.password ? 8 : undefined} autoComplete="new-password" value={form.passwordConfirmation} onChange={(event) => setForm({ ...form, passwordConfirmation: event.target.value })} /></FormField></div>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#475569]"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} className="size-4 rounded border-[#CBD5E1] accent-[#2563EB]" />Mostrar contraseñas</label>
      </div>
    </CatalogDialog>
  </section>;
}
