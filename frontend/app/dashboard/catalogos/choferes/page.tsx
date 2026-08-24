"use client";

import { useEffect, useMemo, useState } from "react";
import { CatalogAlert, CatalogDialog, CatalogHeader, CatalogLoadingRows, FormField, RowActions, SearchInput, StatusPill, inputClassName } from "@/components/catalogs/catalog-ui";
import { getCatalogErrorMessage } from "@/lib/catalog-errors";
import { choferesService } from "@/services/choferes.service";
import type { Chofer, ChoferPayload } from "@/types/catalogs";

const emptyForm = { nombre: "", apellido_paterno: "", apellido_materno: "", telefono: "", licencia: "", vigencia_licencia: "" };
const personaNamePattern = /^(?=.*\p{L})[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;
const fullName = (item: Chofer) => [item.nombre, item.apellido_paterno, item.apellido_materno].filter(Boolean).join(" ");

export default function ChoferesPage() {
  const [items, setItems] = useState<Chofer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Chofer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState(false);
  const [changingId, setChangingId] = useState<number | null>(null);

  function load() { setLoading(true); setLoadError(false); void choferesService.list().then(setItems).catch(() => setLoadError(true)).finally(() => setLoading(false)); }
  useEffect(() => { let active = true; void choferesService.list().then((data) => { if (active) setItems(data); }).catch(() => { if (active) setLoadError(true); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-MX");
    if (!term) return items;
    return items.filter((item) => [fullName(item), item.telefono, item.licencia].some((value) => value?.toLocaleLowerCase("es-MX").includes(term)));
  }, [items, search]);

  function openCreate() { setEditing(null); setForm(emptyForm); setFormError(""); setOpen(true); }
  function openEdit(item: Chofer) { setEditing(item); setForm({ nombre: item.nombre, apellido_paterno: item.apellido_paterno ?? "", apellido_materno: item.apellido_materno ?? "", telefono: item.telefono ?? "", licencia: item.licencia ?? "", vigencia_licencia: item.vigencia_licencia ?? "" }); setFormError(""); setOpen(true); }

  async function save() {
    const nombre = form.nombre.trim();
    const paterno = form.apellido_paterno.trim();
    const materno = form.apellido_materno.trim();
    if (nombre.length < 2) { setFormError("El nombre debe tener al menos 2 caracteres."); return; }
    if (![nombre, paterno, materno].filter(Boolean).every((value) => personaNamePattern.test(value))) { setFormError("Nombre y apellidos sólo pueden contener letras, espacios, apóstrofes y guiones."); return; }
    const optional = (value: string) => value.trim() || undefined;
    const payload: ChoferPayload = { nombre, apellido_paterno: optional(paterno), apellido_materno: optional(materno), telefono: optional(form.telefono), licencia: optional(form.licencia), vigencia_licencia: optional(form.vigencia_licencia) };
    setSaving(true); setFormError("");
    try {
      const saved = editing ? await choferesService.update(editing.id, payload) : await choferesService.create(payload);
      setItems((current) => [...current.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.nombre.localeCompare(b.nombre, "es-MX") || a.id - b.id));
      setFeedbackError(false); setFeedback(`Chofer ${editing ? "actualizado" : "creado"} correctamente.`); setOpen(false);
    } catch (error) { setFormError(getCatalogErrorMessage(error)); }
    finally { setSaving(false); }
  }

  async function toggle(item: Chofer) {
    if (!window.confirm(`¿Deseas ${item.activo ? "desactivar" : "activar"} al chofer “${fullName(item)}”?`)) return;
    setChangingId(item.id); setFeedback(""); setFeedbackError(false);
    try { const updated = await choferesService.setActive(item.id, !item.activo); setItems((current) => current.map((value) => value.id === updated.id ? updated : value)); setFeedback(`Chofer ${updated.activo ? "activado" : "desactivado"} correctamente.`); }
    catch (error) { setFeedbackError(true); setFeedback(getCatalogErrorMessage(error)); }
    finally { setChangingId(null); }
  }

  return <section>
    <CatalogHeader title="Choferes" description="Administra el padrón operativo de choferes y sus licencias." actionLabel="Nuevo chofer" onAction={openCreate} />
    {feedback ? <CatalogAlert variant={feedbackError ? "error" : "success"}>{feedback}</CatalogAlert> : null}
    <div className="mt-6 overflow-hidden rounded-xl border border-[#CBD5E1] bg-white">
      <div className="border-b border-[#E2E8F0] p-4"><SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, teléfono o licencia" /></div>
      {loadError ? <div className="flex items-center justify-between gap-4 p-5"><p className="text-sm text-[#475569]">No fue posible cargar la información.</p><button type="button" onClick={load} className="text-sm font-semibold text-[#2563EB]">Reintentar</button></div> : <div className="overflow-x-auto"><table className="w-full min-w-190 text-left text-sm"><thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#475569]"><tr><th className="px-5 py-3">Nombre</th><th className="px-4 py-3">Teléfono</th><th className="px-4 py-3">Licencia</th><th className="px-4 py-3">Vigencia</th><th className="px-4 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-[#E2E8F0]">
        {loading ? <CatalogLoadingRows columns={6} /> : filtered.length === 0 ? <tr><td colSpan={6} className="px-5 py-10 text-center text-[#475569]">{search ? "No se encontraron choferes." : "No hay choferes registrados."}</td></tr> : filtered.map((item) => <tr key={item.id} className="hover:bg-[#F8FAFC]"><td className="px-5 py-3.5 font-medium text-[#0F172A]">{fullName(item)}</td><td className="px-4 py-3.5 text-[#475569]">{item.telefono ?? "—"}</td><td className="px-4 py-3.5 text-[#475569]">{item.licencia ?? "—"}</td><td className="px-4 py-3.5 text-[#475569]">{item.vigencia_licencia ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${item.vigencia_licencia}T00:00:00Z`)) : "—"}</td><td className="px-4 py-3.5"><StatusPill active={item.activo} /></td><td className="px-5 py-3.5"><RowActions active={item.activo} busy={changingId === item.id} onEdit={() => openEdit(item)} onToggle={() => void toggle(item)} /></td></tr>)}
      </tbody></table></div>}
    </div>
    <CatalogDialog title={editing ? "Editar chofer" : "Nuevo chofer"} open={open} saving={saving} error={formError} onClose={() => setOpen(false)} onSubmit={() => void save()}>
      <FormField label="Nombre" required><input className={inputClassName} required minLength={2} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></FormField>
      <div className="grid gap-4 sm:grid-cols-2"><FormField label="Apellido paterno"><input className={inputClassName} value={form.apellido_paterno} onChange={(e) => setForm({ ...form, apellido_paterno: e.target.value })} /></FormField><FormField label="Apellido materno"><input className={inputClassName} value={form.apellido_materno} onChange={(e) => setForm({ ...form, apellido_materno: e.target.value })} /></FormField></div>
      <div className="grid gap-4 sm:grid-cols-2"><FormField label="Teléfono"><input className={inputClassName} type="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></FormField><FormField label="Licencia"><input className={inputClassName} value={form.licencia} onChange={(e) => setForm({ ...form, licencia: e.target.value })} /></FormField></div>
      <FormField label="Vigencia de licencia"><input className={inputClassName} type="date" value={form.vigencia_licencia} onChange={(e) => setForm({ ...form, vigencia_licencia: e.target.value })} /></FormField>
    </CatalogDialog>
  </section>;
}
