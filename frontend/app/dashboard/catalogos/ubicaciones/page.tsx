"use client";

import { useEffect, useMemo, useState } from "react";
import { CatalogAlert, CatalogDialog, CatalogHeader, CatalogLoadingRows, FormField, RowActions, SearchInput, StatusPill, inputClassName, textareaClassName } from "@/components/catalogs/catalog-ui";
import { getCatalogErrorMessage } from "@/lib/catalog-errors";
import { proyectosService } from "@/services/proyectos.service";
import { ubicacionesService } from "@/services/ubicaciones.service";
import type { Proyecto, TipoUbicacion, Ubicacion, UbicacionPayload } from "@/types/catalogs";

const emptyForm = { proyecto_id: "", nombre: "", tipo: "banco" as TipoUbicacion, descripcion: "", referencia: "" };

export default function UbicacionesPage() {
  const [items, setItems] = useState<Ubicacion[]>([]);
  const [projects, setProjects] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Ubicacion | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState(false);
  const [changingId, setChangingId] = useState<number | null>(null);

  function load() {
    setLoading(true); setLoadError(false);
    void Promise.all([ubicacionesService.list(), proyectosService.list()]).then(([locations, projectList]) => { setItems(locations); setProjects(projectList); }).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }
  useEffect(() => {
    let active = true;
    void Promise.all([ubicacionesService.list(), proyectosService.list()]).then(([locations, projectList]) => { if (!active) return; setItems(locations); setProjects(projectList); }).catch(() => { if (active) setLoadError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-MX");
    if (!term) return items;
    return items.filter((item) => [item.nombre, item.tipo, item.proyecto.nombre, item.descripcion, item.referencia].some((value) => value?.toLocaleLowerCase("es-MX").includes(term)));
  }, [items, search]);

  function openCreate() { setEditing(null); setForm({ ...emptyForm, proyecto_id: projects[0]?.id.toString() ?? "" }); setFormError(""); setOpen(true); }
  function openEdit(item: Ubicacion) { setEditing(item); setForm({ proyecto_id: item.proyecto.id.toString(), nombre: item.nombre, tipo: item.tipo, descripcion: item.descripcion ?? "", referencia: item.referencia ?? "" }); setFormError(""); setOpen(true); }

  async function save() {
    const nombre = form.nombre.trim(); const proyectoId = Number(form.proyecto_id);
    if (!Number.isInteger(proyectoId) || proyectoId < 1) { setFormError("Selecciona un proyecto."); return; }
    if (nombre.length < 2) { setFormError("El nombre debe tener al menos 2 caracteres."); return; }
    const payload: UbicacionPayload = { proyecto_id: proyectoId, nombre, tipo: form.tipo, descripcion: form.descripcion.trim() || undefined, referencia: form.referencia.trim() || undefined };
    setSaving(true); setFormError("");
    try {
      const saved = editing ? await ubicacionesService.update(editing.id, payload) : await ubicacionesService.create(payload);
      setItems((current) => [...current.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.nombre.localeCompare(b.nombre, "es-MX") || a.id - b.id));
      setFeedbackError(false); setFeedback(`Ubicación ${editing ? "actualizada" : "creada"} correctamente.`); setOpen(false);
    } catch (error) { setFormError(getCatalogErrorMessage(error)); }
    finally { setSaving(false); }
  }

  async function toggle(item: Ubicacion) {
    if (!window.confirm(`¿Deseas ${item.activo ? "desactivar" : "activar"} la ubicación “${item.nombre}”?`)) return;
    setChangingId(item.id); setFeedback(""); setFeedbackError(false);
    try { const updated = await ubicacionesService.setActive(item.id, !item.activo); setItems((current) => current.map((value) => value.id === updated.id ? updated : value)); setFeedback(`Ubicación ${updated.activo ? "activada" : "desactivada"} correctamente.`); }
    catch (error) { setFeedbackError(true); setFeedback(getCatalogErrorMessage(error)); }
    finally { setChangingId(null); }
  }

  return (
    <section>
      <CatalogHeader title="Ubicaciones" description="Administra bancos y frentes asociados a cada proyecto." actionLabel="Nueva ubicación" onAction={openCreate} />
      {feedback ? <CatalogAlert variant={feedbackError ? "error" : "success"}>{feedback}</CatalogAlert> : null}
      <div className="mt-6 overflow-hidden rounded-xl border border-[#CBD5E1] bg-white">
        <div className="border-b border-[#E2E8F0] p-4"><SearchInput value={search} onChange={setSearch} placeholder="Buscar por ubicación, proyecto o tipo" /></div>
        {loadError ? <div className="flex items-center justify-between gap-4 p-5"><p className="text-sm text-[#475569]">No fue posible cargar la información.</p><button type="button" onClick={load} className="text-sm font-semibold text-[#2563EB]">Reintentar</button></div> : <div className="overflow-x-auto"><table className="w-full min-w-210 text-left text-sm"><thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#475569]"><tr><th className="px-5 py-3">Nombre</th><th className="px-4 py-3">Proyecto</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Referencia</th><th className="px-4 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-[#E2E8F0]">{loading ? <CatalogLoadingRows columns={6} /> : filtered.length === 0 ? <tr><td colSpan={6} className="px-5 py-10 text-center text-[#475569]">{search ? "No se encontraron ubicaciones." : "No hay ubicaciones registradas."}</td></tr> : filtered.map((item) => <tr key={item.id} className="hover:bg-[#F8FAFC]"><td className="px-5 py-3.5 font-medium text-[#0F172A]">{item.nombre}</td><td className="px-4 py-3.5 text-[#475569]">{item.proyecto.nombre}</td><td className="px-4 py-3.5"><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium capitalize text-blue-700 ring-1 ring-inset ring-blue-200">{item.tipo}</span></td><td className="max-w-64 truncate px-4 py-3.5 text-[#475569]">{item.referencia ?? "—"}</td><td className="px-4 py-3.5"><StatusPill active={item.activo} /></td><td className="px-5 py-3.5"><RowActions active={item.activo} busy={changingId === item.id} onEdit={() => openEdit(item)} onToggle={() => void toggle(item)} /></td></tr>)}</tbody></table></div>}
      </div>
      <CatalogDialog title={editing ? "Editar ubicación" : "Nueva ubicación"} open={open} saving={saving} error={formError} onClose={() => setOpen(false)} onSubmit={() => void save()}>
        <FormField label="Proyecto" required><select className={inputClassName} required value={form.proyecto_id} onChange={(e) => setForm({ ...form, proyecto_id: e.target.value })}><option value="">Selecciona un proyecto</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.nombre}{project.activo ? "" : " (inactivo)"}</option>)}</select></FormField>
        <div className="grid gap-4 sm:grid-cols-2"><FormField label="Nombre" required><input className={inputClassName} required minLength={2} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></FormField><FormField label="Tipo" required><select className={inputClassName} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoUbicacion })}><option value="banco">Banco</option><option value="frente">Frente</option></select></FormField></div>
        <FormField label="Referencia"><input className={inputClassName} value={form.referencia} onChange={(e) => setForm({ ...form, referencia: e.target.value })} /></FormField>
        <FormField label="Descripción"><textarea className={textareaClassName} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></FormField>
      </CatalogDialog>
    </section>
  );
}
