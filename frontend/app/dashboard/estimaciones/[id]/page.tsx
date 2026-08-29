/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  CatalogAlert,
  CatalogDialog,
  ConfirmActionDialog,
  FormField,
  inputClassName,
  textareaClassName,
} from "@/components/catalogs/catalog-ui";
import {
  MetricCard,
  StateBadge,
  money,
  quantity,
} from "@/components/operations/operation-ui";
import { StickyHorizontalScroll } from "@/components/tables/sticky-horizontal-scroll";
import { getCatalogErrorMessage } from "@/lib/catalog-errors";
import { estimacionesService } from "@/services/estimaciones.service";
import type { EstimacionDetalle } from "@/types/estimaciones";
const today = new Date().toISOString().slice(0, 10);
export default function EstimacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [item, setItem] = useState<EstimacionDetalle | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [closeOpen, setCloseOpen] = useState(false),
    [invoiceOpen, setInvoiceOpen] = useState(false),
    [payOpen, setPayOpen] = useState(false);
  const [invoice, setInvoice] = useState({
      importe_facturado: "",
      fecha_facturacion: today,
      referencia_factura: "",
    }),
    [pay, setPay] = useState({
      importe: "",
      fecha: today,
      referencia: "",
      observaciones: "",
    });
  const load = () =>
    estimacionesService
      .get(Number(id))
      .then(setItem)
      .catch((e) => setError(getCatalogErrorMessage(e)));
  useEffect(() => {
    void load();
  }, [id]);
  async function close() {
    setBusy(true);
    try {
      await estimacionesService.close(Number(id));
      setCloseOpen(false);
      await load();
    } catch (e) {
      setError(getCatalogErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function bill() {
    setBusy(true);
    try {
      await estimacionesService.invoice(Number(id), {
        importe_facturado: Number(invoice.importe_facturado),
        fecha_facturacion: invoice.fecha_facturacion,
        ...(invoice.referencia_factura
          ? { referencia_factura: invoice.referencia_factura }
          : {}),
      });
      setInvoiceOpen(false);
      await load();
    } catch (e) {
      setError(getCatalogErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  async function payment() {
    setBusy(true);
    try {
      await estimacionesService.pay(Number(id), {
        importe: Number(pay.importe),
        fecha: pay.fecha,
        ...(pay.referencia ? { referencia: pay.referencia } : {}),
        ...(pay.observaciones ? { observaciones: pay.observaciones } : {}),
      });
      setPayOpen(false);
      await load();
    } catch (e) {
      setError(getCatalogErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  if (!item)
    return error ? (
      <CatalogAlert variant="error">{error}</CatalogAlert>
    ) : (
      <p>Cargando…</p>
    );
  return (
    <section>
      <Link
        href="/dashboard/estimaciones"
        className="font-semibold text-blue-600"
      >
        ← Volver
      </Link>
      {error ? <CatalogAlert variant="error">{error}</CatalogAlert> : null}
      <div className="mt-4 flex flex-wrap justify-between gap-3">
        <div>
          <p className="text-sm text-blue-600">Estimación</p>
          <h2 className="text-3xl font-semibold">{item.folio}</h2>
          <p className="text-slate-600">
            {item.proyecto.nombre} · {item.fecha_desde} — {item.fecha_hasta}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <StateBadge>{item.estado}</StateBadge>
          {item.estado === "BORRADOR" ? (
            <button
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
              onClick={() => setCloseOpen(true)}
            >
              Cerrar
            </button>
          ) : null}
          {item.estado === "CERRADA" ? (
            <button
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
              onClick={() => {
                setInvoice({
                  ...invoice,
                  importe_facturado: item.importe_realizado,
                });
                setInvoiceOpen(true);
              }}
            >
              Marcar facturada
            </button>
          ) : null}
          {["FACTURADA", "PAGADA"].includes(item.estado) &&
          Number(item.por_cobrar) > 0 ? (
            <button
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
              onClick={() => setPayOpen(true)}
            >
              Registrar pago
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Viajes" value={item.viajes} />
        <MetricCard
          label="Importe realizado"
          value={money(item.importe_realizado)}
          detail={quantity(item.cantidad)}
        />
        <MetricCard label="Facturado" value={money(item.importe_facturado)} />
        <MetricCard label="Pagado" value={money(item.importe_pagado)} />
        <MetricCard label="Por cobrar" value={money(item.por_cobrar)} />
      </div>
      <h2 className="mt-8 text-xl font-semibold">Viajes incluidos</h2>
      <div className="mt-3 overflow-hidden rounded-xl border bg-white">
        <StickyHorizontalScroll>
          <table className="admin-table min-w-275">
            <thead className="bg-slate-50 text-left text-xs uppercase">
              <tr>
                {[
                  "Folio",
                  "Fecha",
                  "Camión",
                  "Chofer",
                  "Origen",
                  "Destino",
                  "Cantidad",
                  "Precio unitario",
                  "Importe",
                ].map((x) => (
                  <th key={x} className="px-4 py-3">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {item.detalles.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3">
                    <Link
                      className="text-blue-600"
                      href={`/dashboard/viajes/${d.viaje.id}`}
                    >
                      {d.viaje.folio}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(d.viaje.fecha_hora_salida).toLocaleDateString(
                      "es-MX",
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {d.viaje.camion.numero_economico ?? d.viaje.camion.placas}
                  </td>
                  <td className="px-4 py-3">{d.viaje.chofer.nombre}</td>
                  <td className="px-4 py-3">
                    {d.viaje.ubicacion_origen.nombre}
                  </td>
                  <td className="px-4 py-3">
                    {d.viaje.ubicacion_destino.nombre}
                  </td>
                  <td className="px-4 py-3">
                    {quantity(d.cantidad, d.unidad_medida)}
                  </td>
                  <td className="px-4 py-3">
                    {money(d.precio_unitario_aplicado)}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {money(d.importe)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </StickyHorizontalScroll>
      </div>
      <h2 className="mt-8 text-xl font-semibold">Pagos</h2>
      <div className="mt-3 overflow-hidden rounded-xl border bg-white">
        <table className="admin-table">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Importe</th>
              <th className="p-3">Referencia</th>
            </tr>
          </thead>
          <tbody>
            {item.pagos.map((p) => (
              <tr className="border-t" key={p.id}>
                <td className="p-3">{p.fecha}</td>
                <td className="p-3">{money(p.importe)}</td>
                <td className="p-3">{p.referencia ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmActionDialog
        open={closeOpen}
        title="Cerrar estimación"
        description="Al cerrarla se congela el corte administrativo y queda disponible para facturación."
        confirmLabel="Cerrar estimación"
        busy={busy}
        onClose={() => setCloseOpen(false)}
        onConfirm={() => void close()}
      />
      <CatalogDialog
        title="Marcar como facturada"
        open={invoiceOpen}
        saving={busy}
        error={error}
        onClose={() => setInvoiceOpen(false)}
        onSubmit={() => void bill()}
      >
        <FormField label="Importe facturado" required>
          <input
            className={inputClassName}
            type="number"
            min="0.01"
            step="0.01"
            value={invoice.importe_facturado}
            onChange={(e) =>
              setInvoice({ ...invoice, importe_facturado: e.target.value })
            }
          />
        </FormField>
        <FormField label="Fecha de facturación" required>
          <input
            className={inputClassName}
            type="date"
            value={invoice.fecha_facturacion}
            onChange={(e) =>
              setInvoice({ ...invoice, fecha_facturacion: e.target.value })
            }
          />
        </FormField>
        <FormField label="Referencia o factura">
          <input
            className={inputClassName}
            value={invoice.referencia_factura}
            onChange={(e) =>
              setInvoice({ ...invoice, referencia_factura: e.target.value })
            }
          />
        </FormField>
      </CatalogDialog>
      <CatalogDialog
        title="Registrar pago"
        open={payOpen}
        saving={busy}
        error={error}
        onClose={() => setPayOpen(false)}
        onSubmit={() => void payment()}
      >
        <FormField label="Importe" required>
          <input
            className={inputClassName}
            type="number"
            min="0.01"
            step="0.01"
            max={item.por_cobrar}
            value={pay.importe}
            onChange={(e) => setPay({ ...pay, importe: e.target.value })}
          />
        </FormField>
        <FormField label="Fecha" required>
          <input
            className={inputClassName}
            type="date"
            value={pay.fecha}
            onChange={(e) => setPay({ ...pay, fecha: e.target.value })}
          />
        </FormField>
        <FormField label="Referencia">
          <input
            className={inputClassName}
            value={pay.referencia}
            onChange={(e) => setPay({ ...pay, referencia: e.target.value })}
          />
        </FormField>
        <FormField label="Observaciones">
          <textarea
            className={textareaClassName}
            value={pay.observaciones}
            onChange={(e) => setPay({ ...pay, observaciones: e.target.value })}
          />
        </FormField>
      </CatalogDialog>
    </section>
  );
}
