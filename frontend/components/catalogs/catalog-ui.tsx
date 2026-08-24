"use client";

import { useEffect, type ReactNode } from "react";

export function CatalogHeader({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-[#2563EB]">Catálogos</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#0F172A]">{title}</h1>
        <p className="mt-2 text-sm text-[#475569]">{description}</p>
      </div>
      <button type="button" onClick={onAction} className="h-10 rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white hover:bg-[#1D4ED8]">
        {actionLabel}
      </button>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="relative block max-w-sm">
      <span className="sr-only">Buscar</span>
      <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-blue-100" />
    </label>
  );
}

export function CatalogAlert({ children, variant = "success" }: { children: ReactNode; variant?: "success" | "error" }) {
  return <div role={variant === "error" ? "alert" : "status"} className={`mt-4 rounded-lg border px-4 py-3 text-sm ${variant === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>{children}</div>;
}

export function CatalogLoadingRows({ columns }: { columns: number }) {
  return Array.from({ length: 4 }, (_, index) => (
    <tr key={index} className="animate-pulse"><td colSpan={columns} className="px-5 py-4"><div className="h-4 rounded bg-slate-100" /></td></tr>
  ));
}

export function StatusPill({ active }: { active: boolean }) {
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>{active ? "Activo" : "Inactivo"}</span>;
}

export function RowActions({ active, busy, onEdit, onToggle }: { active: boolean; busy: boolean; onEdit: () => void; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-end gap-3">
      <button type="button" onClick={onEdit} className="text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]">Editar</button>
      <button type="button" disabled={busy} onClick={onToggle} className={`text-sm font-medium disabled:opacity-50 ${active ? "text-red-600 hover:text-red-700" : "text-emerald-700 hover:text-emerald-800"}`}>{active ? "Desactivar" : "Activar"}</button>
    </div>
  );
}

export function CatalogDialog({ title, open, saving, error, onClose, onSubmit, children }: { title: string; open: boolean; saving: boolean; error: string; onClose: () => void; onSubmit: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [onClose, open, saving]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="catalog-dialog-title" className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-[#CBD5E1] bg-white shadow-xl">
        <div className="border-b border-[#E2E8F0] px-5 py-4"><h2 id="catalog-dialog-title" className="text-lg font-semibold text-[#0F172A]">{title}</h2></div>
        <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
          <div className="space-y-4 px-5 py-5">{children}{error ? <CatalogAlert variant="error">{error}</CatalogAlert> : null}</div>
          <div className="flex justify-end gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3.5">
            <button type="button" disabled={saving} onClick={onClose} className="h-9 rounded-lg border border-[#CBD5E1] bg-white px-4 text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={saving} className="h-9 rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-60">{saving ? "Guardando…" : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FormField({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium text-[#0F172A]">{label}{required ? " *" : ""}</span>{children}</label>;
}

export const inputClassName = "h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-blue-100";
export const textareaClassName = "min-h-20 w-full resize-y rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-blue-100";
