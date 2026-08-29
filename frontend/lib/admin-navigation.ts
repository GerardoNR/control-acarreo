import type { IconName } from "@/components/admin/icons";

export interface AdminNavigationItem {
  label: string;
  href: string;
  icon: IconName;
}

export const mainNavigation: AdminNavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Viajes", href: "/dashboard/viajes", icon: "trips" },
  { label: "Órdenes de acarreo", href: "/dashboard/ordenes-acarreo", icon: "orders" },
  { label: "Estimaciones", href: "/dashboard/estimaciones", icon: "estimate" },
  { label: "Reportes", href: "/dashboard/reportes", icon: "report" },
];

export const catalogNavigation: AdminNavigationItem[] = [
  { label: "Proyectos", href: "/dashboard/catalogos/proyectos", icon: "folder" },
  { label: "Checadores", href: "/dashboard/catalogos/checadores", icon: "checker" },
  { label: "Choferes", href: "/dashboard/catalogos/choferes", icon: "driver" },
  { label: "Camiones", href: "/dashboard/catalogos/camiones", icon: "truck" },
  { label: "Materiales", href: "/dashboard/catalogos/materiales", icon: "material" },
  { label: "Bancos y frentes", href: "/dashboard/catalogos/ubicaciones", icon: "location" },
  { label: "Rutas de acarreo", href: "/dashboard/catalogos/rutas", icon: "location" },
  { label: "Unidades de control", href: "/dashboard/catalogos/unidades-control", icon: "material" },
  { label: "Tarifas", href: "/dashboard/catalogos/tarifas", icon: "estimate" },
];

export const utilityNavigation: AdminNavigationItem[] = [
  { label: "Papelera", href: "/dashboard/papelera", icon: "trash" },
  { label: "Ajustes", href: "/dashboard/ajustes", icon: "settings" },
];

const detailTitles = [
  { prefix: "/dashboard/viajes/", label: "Detalle de viaje" },
  { prefix: "/dashboard/ordenes-acarreo/", label: "Detalle de orden" },
  { prefix: "/dashboard/estimaciones/", label: "Detalle de estimación" },
];

export function getAdminSectionTitle(pathname: string): string {
  const detail = detailTitles.find(({ prefix }) => pathname.startsWith(prefix));
  if (detail) return detail.label;
  const item = [...mainNavigation, ...catalogNavigation, ...utilityNavigation]
    .sort((a, b) => b.href.length - a.href.length)
    .find(({ href }) => pathname === href);
  return item?.label ?? "Panel administrativo";
}
