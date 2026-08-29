export type CatalogSortOption = { value: string; label: string };

export function compareTextEs(a: string | null | undefined, b: string | null | undefined, direction: "asc" | "desc" = "asc") {
  const left = a?.trim() ?? "";
  const right = b?.trim() ?? "";
  if (!left && right) return 1;
  if (left && !right) return -1;
  return left.localeCompare(right, "es-MX", { sensitivity: "base", numeric: true }) * (direction === "desc" ? -1 : 1);
}

export function compareDate(a: string | null | undefined, b: string | null | undefined, direction: "asc" | "desc" = "desc") {
  if (!a && b) return 1;
  if (a && !b) return -1;
  if (!a && !b) return 0;
  return (new Date(a!).getTime() - new Date(b!).getTime()) * (direction === "desc" ? -1 : 1);
}

export function activeFirst<T extends { activo: boolean }>(items: T[], compare: (a: T, b: T) => number) {
  return [...items].sort((a, b) => Number(b.activo) - Number(a.activo) || compare(a, b));
}
