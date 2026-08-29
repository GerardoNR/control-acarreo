import { api } from "@/lib/api";
import type { ReportesResumen, ReportesViajesQuery, ReportesViajesResponse } from "@/types/reportes";

export const reportesService = {
  async resumen(): Promise<ReportesResumen> {
    return (await api.get<ReportesResumen>("/reportes/resumen")).data;
  },
  async viajes(query: ReportesViajesQuery): Promise<ReportesViajesResponse> {
    return (await api.get<ReportesViajesResponse>("/reportes/viajes", { params: query })).data;
  },
  async exportarExcel(query: Omit<ReportesViajesQuery, "page" | "limit">) {
    const response = await api.get<Blob>("/reportes/viajes/exportar/excel", {
      params: query,
      responseType: "blob",
      timeout: 120_000,
    });
    const disposition = response.headers["content-disposition"] as string | undefined;
    const filename = disposition?.match(/filename="?([^";]+)"?/i)?.[1]
      ?? "INDI_Reporte_Viajes.xlsx";
    return { blob: response.data, filename };
  },
};
