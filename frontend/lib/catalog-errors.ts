import axios from "axios";

export function getCatalogErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return "No fue posible guardar los cambios.";
  if (!error.response) return "No fue posible conectar con el servidor.";
  if (error.response.status === 400) return "Revisa los campos e intenta nuevamente.";
  if (error.response.status === 403) return "No tienes permisos para realizar esta acción.";
  if (error.response.status === 404) return "El registro ya no está disponible.";
  if (error.response.status === 409) {
    const message = (error.response.data as { message?: unknown })?.message;
    return typeof message === "string" ? message : "Ya existe un registro con esos datos.";
  }
  return "No fue posible guardar los cambios.";
}
