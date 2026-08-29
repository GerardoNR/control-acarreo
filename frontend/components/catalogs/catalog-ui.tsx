"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useState } from "react";
import type { SuspensionPayload, SuspensionSummary } from "@/types/catalogs";

export function CatalogHeader({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-[#2563EB]">
          Panel administrativo
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#0F172A]">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#475569]">
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="h-10 rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white hover:bg-[#1D4ED8]"
      >
        {actionLabel}
      </button>
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const inputId = useId();
  return (
    <label htmlFor={inputId} className="block w-full max-w-sm">
      <span className="mb-1.5 block text-xs font-semibold text-[#475569]">
        Buscar por
      </span>
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-blue-100"
      />
    </label>
  );
}

export function CatalogSortSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-[#475569]">
      <span className="mb-1.5 block whitespace-nowrap text-xs font-semibold">
        Ordenar por
      </span>
      <select
        aria-label="Ordenar por"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 min-w-44 rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CatalogAlert({
  children,
  variant = "success",
}: {
  children: ReactNode;
  variant?: "success" | "error";
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`mt-4 rounded-lg border px-4 py-3 text-sm ${variant === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}
    >
      {children}
    </div>
  );
}

export function CatalogLoadingRows({ columns }: { columns: number }) {
  return Array.from({ length: 4 }, (_, index) => (
    <tr key={index} className="animate-pulse">
      <td colSpan={columns} className="px-5 py-4">
        <div className="h-4 rounded bg-slate-100" />
      </td>
    </tr>
  ));
}

export function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200"}`}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

export function RowActions({
  onEdit,
  onDelete,
  onSuspend,
  onResume,
  suspended = false,
  entityName = "registro",
}: {
  onEdit: () => void;
  onDelete?: () => void;
  onSuspend?: () => void;
  onResume?: () => void;
  suspended?: boolean;
  entityName?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        title={`Editar ${entityName}`}
        aria-label={`Editar ${entityName}`}
        onClick={onEdit}
        className="inline-flex min-h-10 min-w-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[#2563EB] hover:bg-blue-50 hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        <span className="text-[11px] font-medium leading-none">Editar</span>
      </button>
      {onSuspend || onResume ? (
        <button
          type="button"
          title={`${suspended ? "Reanudar" : "Suspender"} ${entityName}`}
          aria-label={`${suspended ? "Reanudar" : "Suspender"} ${entityName}`}
          onClick={suspended ? onResume : onSuspend}
          className="inline-flex min-h-10 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-amber-700 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="9" />
            <path d={suspended ? "m9 12 2 2 4-4" : "M9 9h6v6H9z"} />
          </svg>
          <span className="text-[11px] font-medium leading-none">
            {suspended ? "Reanudar" : "Suspender"}
          </span>
        </button>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          title={`Eliminar ${entityName}`}
          aria-label={`Eliminar ${entityName}`}
          onClick={onDelete}
          className="inline-flex min-h-10 min-w-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-red-600 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="m19 6-1 14H6L5 6" />
            <path d="M10 11v5M14 11v5" />
          </svg>
          <span className="text-[11px] font-medium leading-none">Eliminar</span>
        </button>
      ) : null}
    </div>
  );
}

export function SuspensionBadge({
  suspension,
}: {
  suspension?: SuspensionSummary;
}) {
  if (!suspension) return null;
  const detail = `Motivo: ${suspension.motivo}. ${suspension.indefinida ? "Suspensión indefinida" : `Hasta: ${suspension.fecha_fin}`}`;
  return (
    <span
      title={detail}
      aria-label={detail}
      className="ml-2 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200"
    >
      Suspendido
    </span>
  );
}

export function AvailabilitySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: "all" | "available" | "suspended") => void;
}) {
  return (
    <label className="block text-[#475569]">
      <span className="mb-1.5 block text-xs font-semibold">Disponibilidad</span>
      <select
        aria-label="Filtrar por disponibilidad"
        value={value}
        onChange={(event) =>
          onChange(event.target.value as "all" | "available" | "suspended")
        }
        className="h-10 min-w-36 rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-blue-100"
      >
        <option value="all">Todos</option>
        <option value="available">Disponibles</option>
        <option value="suspended">Suspendidos</option>
      </select>
    </label>
  );
}

export function SuspensionDialog({
  open,
  entityLabel,
  entityName,
  reasons,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  entityLabel: string;
  entityName: string;
  reasons: string[];
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (payload: SuspensionPayload) => void;
}) {
  if (!open) return null;
  return (
    <SuspensionDialogForm
      entityLabel={entityLabel}
      entityName={entityName}
      reasons={reasons}
      saving={saving}
      error={error}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function SuspensionDialogForm({
  entityLabel,
  entityName,
  reasons,
  saving,
  error,
  onClose,
  onSubmit,
}: Omit<Parameters<typeof SuspensionDialog>[0], "open">) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Monterrey",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [reason, setReason] = useState(reasons[0] ?? "");
  const [notes, setNotes] = useState("");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [indefinite, setIndefinite] = useState(false);
  return (
    <CatalogDialog
      title={`Suspender ${entityLabel}: ${entityName}`}
      open
      saving={saving}
      error={error}
      onClose={onClose}
      onSubmit={() =>
        onSubmit({
          motivo: reason,
          observaciones: notes.trim() || undefined,
          fecha_inicio: start,
          fecha_fin: indefinite ? undefined : end,
          indefinida: indefinite,
        })
      }
    >
      <FormField label="Motivo" required>
        <select
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={inputClassName}
        >
          {reasons.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Observaciones">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={textareaClassName}
          required={reason === "Otro"}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Fecha de inicio" required>
          <input
            type="date"
            required
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className={inputClassName}
          />
        </FormField>
        {!indefinite ? (
          <FormField label="Fecha de finalización" required>
            <input
              type="date"
              min={start}
              required
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className={inputClassName}
            />
          </FormField>
        ) : null}
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-[#334155]">
        <input
          type="checkbox"
          checked={indefinite}
          onChange={(e) => setIndefinite(e.target.checked)}
          className="size-4 rounded border-slate-300"
        />
        Suspensión indefinida
      </label>
    </CatalogDialog>
  );
}

export function ProjectActions({
  finalized,
  busy,
  name,
  onEdit,
  onFinalize,
  onDelete,
}: {
  finalized: boolean;
  busy: boolean;
  name: string;
  onEdit: () => void;
  onFinalize: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        title={`Editar ${name}`}
        aria-label={`Editar ${name}`}
        onClick={onEdit}
        className="inline-flex min-h-10 min-w-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[#2563EB] hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        <span className="text-[11px] font-medium">Editar</span>
      </button>
      <button
        type="button"
        title={finalized ? "Proyecto finalizado" : `Finalizar ${name}`}
        aria-label={finalized ? `${name} finalizado` : `Finalizar ${name}`}
        disabled={busy || finalized}
        onClick={onFinalize}
        className="inline-flex min-h-10 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 4h14v16H5z" />
          <path d="m8 12 2.5 2.5L16 9" />
        </svg>
        <span className="text-[11px] font-medium">
          {finalized ? "Finalizado" : "Finalizar"}
        </span>
      </button>
      <button
        type="button"
        title={`Eliminar ${name}`}
        aria-label={`Eliminar ${name}`}
        disabled={busy}
        onClick={onDelete}
        className="inline-flex min-h-10 min-w-12 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="m19 6-1 14H6L5 6" />
          <path d="M10 11v5M14 11v5" />
        </svg>
        <span className="text-[11px] font-medium">Eliminar</span>
      </button>
    </div>
  );
}

export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  busy,
  destructive = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  busy: boolean;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [busy, onClose, open]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        aria-describedby="confirm-action-description"
        className="w-full max-w-md rounded-xl border border-[#CBD5E1] bg-white shadow-xl"
      >
        <div className="px-5 py-5">
          <h2
            id="confirm-action-title"
            className="text-lg font-semibold text-[#0F172A]"
          >
            {title}
          </h2>
          <div
            id="confirm-action-description"
            className="mt-3 text-sm leading-6 text-[#475569]"
          >
            {description}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3.5">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="h-9 rounded-lg border border-[#CBD5E1] bg-white px-4 text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`h-9 rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-60 ${destructive ? "bg-red-600 hover:bg-red-700" : "bg-[#2563EB] hover:bg-[#1D4ED8]"}`}
          >
            {busy ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CatalogDialog({
  title,
  open,
  saving,
  error,
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  open: boolean;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: () => void;
  children: ReactNode;
}) {
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-dialog-title"
        className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-[#CBD5E1] bg-white shadow-xl"
      >
        <div className="border-b border-[#E2E8F0] px-5 py-4">
          <h2
            id="catalog-dialog-title"
            className="text-lg font-semibold text-[#0F172A]"
          >
            {title}
          </h2>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="space-y-4 px-5 py-5">
            {children}
            {error ? (
              <CatalogAlert variant="error">{error}</CatalogAlert>
            ) : null}
          </div>
          <div className="flex justify-end gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3.5">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="h-9 rounded-lg border border-[#CBD5E1] bg-white px-4 text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-9 rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#0F172A]">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

export const inputClassName =
  "h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-blue-100";
export const textareaClassName =
  "min-h-20 w-full resize-y rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-blue-100";
