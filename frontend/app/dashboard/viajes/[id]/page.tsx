"use client";

import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { viajesService } from "@/services/viajes.service";
import type { Viaje } from "@/types/viajes";

const dateFormatter = new Intl.DateTimeFormat("es-MX", { timeZone: "America/Monterrey", dateStyle: "long", timeStyle: "short" });
const numberFormatter = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 3 });
const showDate = (value: string | null) => value ? dateFormatter.format(new Date(value)) : "Pendiente";
const showText = (value: string | null) => value || "—";

export default function ViajeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"not-found" | "general" | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const cancelDialogRef = useRef<HTMLDialogElement>(null);

  function load() {
    setLoading(true); setError(null);
    void viajesService.getById(id).then(setViaje).catch((reason: unknown) => setError(axios.isAxiosError(reason) && reason.response?.status === 404 ? "not-found" : "general")).finally(() => setLoading(false));
  }
  useEffect(() => { let active = true; void viajesService.getById(id).then((data) => { if (active) setViaje(data); }).catch((reason: unknown) => { if (active) setError(axios.isAxiosError(reason) && reason.response?.status === 404 ? "not-found" : "general"); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id]);

  function openCancelDialog() {
    setCancelReason("");
    setCancelError(null);
    setShowCancelDialog(true);
    cancelDialogRef.current?.showModal();
  }

  function closeCancelDialog() {
    if (cancelling) return;
    cancelDialogRef.current?.close();
    setShowCancelDialog(false);
    setCancelReason("");
    setCancelError(null);
  }

  async function refreshAfterConflict() {
    try {
      setViaje(await viajesService.getById(id));
    } catch (reason: unknown) {
      if (axios.isAxiosError(reason) && reason.response?.status === 404) {
        setError("not-found");
        setViaje(null);
      }
    }
  }

  async function handleCancel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cancelling) return;
    const motivo = cancelReason.trim();
    if (motivo.length < 5) {
      setCancelError("Escribe un motivo de al menos 5 caracteres.");
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      await viajesService.cancel(id, { motivo_cancelacion: motivo });
      setViaje(await viajesService.getById(id));
      cancelDialogRef.current?.close();
      setShowCancelDialog(false);
      setCancelReason("");
      setSuccessMessage("Viaje cancelado correctamente.");
    } catch (reason: unknown) {
      const status = axios.isAxiosError(reason) ? reason.response?.status : undefined;
      if (status === 404) {
        cancelDialogRef.current?.close();
        setShowCancelDialog(false);
        setError("not-found");
        setViaje(null);
      } else if (status === 409) {
        setCancelError("Este viaje ya no puede cancelarse porque su estado cambió.");
        await refreshAfterConflict();
      } else if (status === 400) {
        setCancelError("El motivo no cumple con los requisitos. Revísalo e intenta nuevamente.");
      } else if (status === 403) {
        setCancelError("No tienes permisos para cancelar este viaje.");
      } else {
        setCancelError("No fue posible cancelar el viaje. Intenta nuevamente.");
      }
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <section><DetailHeader /><div className="mt-6 grid animate-pulse gap-4 lg:grid-cols-2"><div className="h-44 rounded-xl bg-slate-100" /><div className="h-44 rounded-xl bg-slate-100" /><div className="h-44 rounded-xl bg-slate-100" /><div className="h-44 rounded-xl bg-slate-100" /></div></section>;
  if (error || !viaje) return <section><DetailHeader /><div className="mt-6 rounded-xl border border-red-200 bg-white p-6"><p className="text-sm text-[#475569]">{error === "not-found" ? "El viaje solicitado no existe." : "No fue posible cargar el viaje."}</p>{error !== "not-found" ? <button type="button" onClick={load} className="mt-3 text-sm font-semibold text-[#2563EB]">Reintentar</button> : null}</div></section>;
  const chofer = [viaje.chofer.nombre, viaje.chofer.apellido_paterno, viaje.chofer.apellido_materno].filter(Boolean).join(" ");
  return <section><DetailHeader />
    {successMessage ? <div role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{successMessage}</div> : null}
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#CBD5E1] bg-white px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#475569]">Folio</p><h2 className="mt-1 text-xl font-semibold text-[#0F172A]">{viaje.folio}</h2></div><div className="flex flex-wrap items-center gap-3"><StatusBadge estado={viaje.estado} />{viaje.estado === "en_transito" ? <button type="button" onClick={openCancelDialog} className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50">Cancelar viaje</button> : null}</div></div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <DetailCard title="Resumen"><DetailRow label="Proyecto" value={viaje.proyecto.nombre} /><DetailRow label="Estado" value={<StatusBadge estado={viaje.estado} />} /><DetailRow label="ID anterior" value={viaje.id_legacy?.toString() ?? "—"} /></DetailCard>
      <DetailCard title="Unidad y chofer"><DetailRow label="Camión" value={viaje.camion.numero_economico ?? "Sin número económico"} /><DetailRow label="Placas" value={viaje.camion.placas} /><DetailRow label="Chofer" value={chofer} /></DetailCard>
      <DetailCard title="Ruta"><DetailRow label="Origen" value={`${viaje.ubicacion_origen.nombre} · ${viaje.ubicacion_origen.tipo}`} /><DetailRow label="Destino" value={`${viaje.ubicacion_destino.nombre} · ${viaje.ubicacion_destino.tipo}`} /></DetailCard>
      <DetailCard title="Carga"><DetailRow label="Material" value={viaje.material.nombre} /><DetailRow label="Cantidad de salida" value={`${numberFormatter.format(Number(viaje.cantidad_salida))} ${viaje.unidad_medida}`} /><DetailRow label="Cantidad de llegada" value={viaje.cantidad_llegada ? `${numberFormatter.format(Number(viaje.cantidad_llegada))} ${viaje.unidad_medida}` : "Pendiente"} /></DetailCard>
      <DetailCard title="Tiempos"><DetailRow label="Salida" value={showDate(viaje.fecha_hora_salida)} /><DetailRow label="Llegada" value={showDate(viaje.fecha_hora_llegada)} /><DetailRow label="Cancelación" value={viaje.fecha_hora_cancelacion ? showDate(viaje.fecha_hora_cancelacion) : "—"} /></DetailCard>
      <DetailCard title="Registro operativo"><DetailRow label="Checador de salida" value={viaje.checador_salida.nombre} /><DetailRow label="Checador de llegada" value={viaje.checador_llegada?.nombre ?? "Pendiente"} /><DetailRow label="Observaciones de salida" value={showText(viaje.observaciones_salida)} /><DetailRow label="Observaciones de llegada" value={showText(viaje.observaciones_llegada)} /></DetailCard>
      {viaje.estado === "cancelado" || viaje.motivo_cancelacion ? <DetailCard title="Cancelación"><DetailRow label="Motivo" value={showText(viaje.motivo_cancelacion)} /><DetailRow label="Fecha" value={viaje.fecha_hora_cancelacion ? showDate(viaje.fecha_hora_cancelacion) : "—"} /><DetailRow label="Administrador" value={viaje.administrador_cancelacion?.nombre ?? "—"} /></DetailCard> : null}
    </div>
    <dialog ref={cancelDialogRef} onCancel={(event) => { event.preventDefault(); closeCancelDialog(); }} onClose={() => setShowCancelDialog(false)} className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-[#CBD5E1] bg-white p-0 text-[#0F172A] shadow-xl backdrop:bg-slate-950/40">
      {showCancelDialog ? <form onSubmit={handleCancel} className="p-5">
        <h2 className="text-lg font-semibold">Cancelar viaje {viaje.folio}</h2>
        <p className="mt-2 text-sm leading-6 text-[#475569]">Esta acción marcará el viaje como cancelado y conservará su información en el historial. No puede revertirse desde el panel.</p>
        <div className="mt-4 rounded-lg bg-[#F8FAFC] px-3 py-2 text-sm"><span className="font-medium">Camión:</span> {viaje.camion.numero_economico ?? viaje.camion.placas} <span className="mx-2 text-[#CBD5E1]">·</span> <span className="font-medium">Estado:</span> En tránsito</div>
        <label htmlFor="motivo-cancelacion" className="mt-5 block text-sm font-medium">Motivo</label>
        <textarea id="motivo-cancelacion" value={cancelReason} onChange={(event) => { setCancelReason(event.target.value); setCancelError(null); }} rows={4} minLength={5} required disabled={cancelling} autoFocus className="mt-2 w-full resize-y rounded-lg border border-[#CBD5E1] px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE] disabled:bg-slate-100" placeholder="Describe brevemente el motivo de la cancelación" />
        <p className="mt-1 text-xs text-[#64748B]">Mínimo 5 caracteres.</p>
        {cancelError ? <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{cancelError}</p> : null}
        <div className="mt-5 flex justify-end gap-3"><button type="button" onClick={closeCancelDialog} disabled={cancelling} className="rounded-lg border border-[#CBD5E1] px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC] disabled:opacity-60">Cerrar</button><button type="submit" disabled={cancelling} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">{cancelling ? "Cancelando..." : "Confirmar cancelación"}</button></div>
      </form> : null}
    </dialog>
  </section>;
}

function DetailHeader() { return <div><Link href="/dashboard/viajes" className="text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8]">← Volver a viajes</Link><p className="mt-3 text-sm text-[#475569]">Información operativa y trazabilidad registrada.</p></div>; }
function DetailCard({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-xl border border-[#CBD5E1] bg-white"><h3 className="border-b border-[#E2E8F0] px-5 py-3 text-sm font-semibold text-[#0F172A]">{title}</h3><dl className="divide-y divide-[#F1F5F9] px-5">{children}</dl></section>; }
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) { return <div className="grid gap-1 py-3 sm:grid-cols-[150px_1fr]"><dt className="text-xs font-medium text-[#64748B]">{label}</dt><dd className="text-sm text-[#0F172A]">{value}</dd></div>; }
