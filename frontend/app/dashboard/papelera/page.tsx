"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CatalogAlert,
  CatalogLoadingRows,
  CatalogSortSelect,
  ConfirmActionDialog,
  SearchInput,
} from "@/components/catalogs/catalog-ui";
import { getCatalogErrorMessage } from "@/lib/catalog-errors";
import { papeleraService } from "@/services/papelera.service";
import type { PapeleraItem, TipoPapelera } from "@/types/papelera";

const labels: Record<TipoPapelera, string> = {
  checador: "Checador",
  chofer: "Chofer",
  camion: "Camión",
  material: "Material",
  ubicacion: "Banco o frente",
  proyecto: "Proyecto",
};

type PendingAction = {
  item: PapeleraItem;
} | null;

export default function PapeleraPage() {
  const [items, setItems] = useState<PapeleraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"todos" | TipoPapelera>("todos");
  const [sort, setSort] = useState("recent");
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    setError("");
    void papeleraService
      .list()
      .then(setItems)
      .catch((value) => setError(getCatalogErrorMessage(value)))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let active = true;
    void papeleraService
      .list()
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((value) => {
        if (active) setError(getCatalogErrorMessage(value));
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
    const result = items.filter(
      (item) =>
        (type === "todos" || item.tipo === type) &&
        (!term || item.nombre.toLocaleLowerCase("es-MX").includes(term)),
    );
    return result.sort((a, b) =>
      sort === "old"
        ? a.deleted_at.localeCompare(b.deleted_at)
        : sort === "delete-soon"
          ? a.delete_after.localeCompare(b.delete_after)
          : sort === "name"
            ? a.nombre.localeCompare(b.nombre, "es-MX")
            : b.deleted_at.localeCompare(a.deleted_at),
    );
  }, [items, search, sort, type]);

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    setError("");
    setFeedback("");
    try {
      await papeleraService.restore(pending.item.tipo, pending.item.id);
      setItems((current) =>
        current.filter(
          (item) =>
            !(item.tipo === pending.item.tipo && item.id === pending.item.id),
        ),
      );
      setFeedback("Registro restaurado correctamente.");
      setPending(null);
    } catch (value) {
      setError(getCatalogErrorMessage(value));
    } finally {
      setBusy(false);
    }
  }

  const date = (value: string) =>
    new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Monterrey",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));

  return (
    <section>
      <p className="text-sm font-semibold text-[#2563EB]">
        Panel administrativo
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#0F172A]">
        Papelera
      </h1>
      <p className="mt-2 text-sm leading-6 text-[#475569]">
        Los registros pueden restaurarse durante 30 días. Después se procesan
        automáticamente, conservando siempre el historial relacionado.
      </p>
      {feedback ? <CatalogAlert>{feedback}</CatalogAlert> : null}
      {error ? (
        <CatalogAlert variant="error">
          {error}{" "}
          <button
            type="button"
            onClick={load}
            className="ml-2 font-semibold underline"
          >
            Reintentar
          </button>
        </CatalogAlert>
      ) : null}
      <div className="mt-4 overflow-hidden rounded-xl border border-[#CBD5E1] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#E2E8F0] p-4 lg:flex-row lg:items-end lg:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar registro..."
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="block text-[#475569]">
              <span className="mb-1.5 block text-xs font-semibold">Tipo</span>
              <select
                aria-label="Filtrar por tipo"
                value={type}
                onChange={(event) =>
                  setType(event.target.value as "todos" | TipoPapelera)
                }
                className="h-10 min-w-44 rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm"
              >
                <option value="todos">Todos</option>
                <option value="checador">Checadores</option>
                <option value="chofer">Choferes</option>
                <option value="camion">Camiones</option>
                <option value="material">Materiales</option>
                <option value="ubicacion">Bancos y frentes</option>
                <option value="proyecto">Proyectos</option>
              </select>
            </label>
            <CatalogSortSelect
              value={sort}
              onChange={setSort}
              options={[
                { value: "recent", label: "Eliminados recientemente" },
                { value: "old", label: "Más antiguos" },
                { value: "delete-soon", label: "Próximos a vencer" },
                { value: "name", label: "Nombre A–Z" },
              ]}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table indi-numbered min-w-200">
            <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#475569]">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Eliminado</th>
                <th className="px-4 py-3">Se procesará</th>
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
                    No hay registros en la Papelera.
                  </td>
                </tr>
              ) : (
                filtered.map((item, index) => (
                  <tr
                    key={`${item.tipo}-${item.id}`}
                    className="hover:bg-[#F8FAFC]"
                  >
                    <td className="px-5 py-3.5 text-[#64748B]">{index + 1}</td>
                    <td className="px-4 py-3.5 font-medium text-[#0F172A]">
                      {item.nombre}
                    </td>
                    <td className="px-4 py-3.5 text-[#475569]">
                      {item.tipo === "ubicacion" && item.tipo_ubicacion
                        ? item.tipo_ubicacion === "banco"
                          ? "Banco"
                          : "Frente"
                        : labels[item.tipo]}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[#475569]">
                      {date(item.deleted_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-[#475569]">
                      {date(item.delete_after)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          aria-label={`Restaurar ${item.nombre}`}
                          onClick={() =>
                            setPending({ item })
                          }
                          className="h-9 rounded-lg border border-emerald-300 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                          Restaurar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmActionDialog
        open={pending !== null}
        title={`Restaurar ${pending ? labels[pending.item.tipo].toLowerCase() : "registro"}`}
        description={pending ? <>¿Deseas restaurar <strong>“{pending.item.nombre}”</strong>?</> : null}
        confirmLabel="Restaurar"
        busy={busy}
        onClose={() => setPending(null)}
        onConfirm={() => void confirm()}
      />
    </section>
  );
}
