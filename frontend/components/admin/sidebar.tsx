"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, type IconName } from "./icons";
import { catalogNavigation, mainNavigation, utilityNavigation } from "@/lib/admin-navigation";

function NavLink({ label, href, icon, collapsed }: { label: string; href: string; icon: IconName; collapsed: boolean }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={`flex h-10 items-center rounded-lg text-sm font-medium transition-colors ${collapsed ? "justify-center px-2" : "gap-3 px-3"} ${active ? "bg-[#DBEAFE] text-[#1D4ED8]" : "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"}`}
    >
      <Icon name={icon} className="h-5 w-5 shrink-0" />
      {!collapsed ? <span>{label}</span> : null}
    </Link>
  );
}

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const insideCatalog = pathname.startsWith("/dashboard/catalogos/");
  const [catalogOpen, setCatalogOpen] = useState(true);

  return (
    <aside className={`sticky top-0 z-20 hidden h-screen shrink-0 border-r border-[#CBD5E1] bg-white transition-[width] duration-200 md:flex md:flex-col ${collapsed ? "w-20" : "w-60"}`}>
      <div className={`flex h-17 items-center border-b border-[#E2E8F0] ${collapsed ? "justify-center px-2" : "gap-3 px-4"}`}>
        <Image src="/indi_logo.png" alt="INDI" width={42} height={42} className="shrink-0 rounded-xl" />
        {!collapsed ? (
          <div className="min-w-0">
            <p className="font-bold tracking-tight text-[#0F172A]">INDI</p>
            <p className="truncate text-[11px] text-[#64748B]">Panel administrativo</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2.5" aria-label="Navegación administrativa">
        {mainNavigation.map((item) => <NavLink key={item.href} {...item} collapsed={collapsed} />)}

        <div className="pt-3">
          {!collapsed ? (
            <button
              type="button"
              onClick={() => setCatalogOpen((open) => !open)}
              aria-expanded={catalogOpen}
              className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${insideCatalog ? "text-[#1D4ED8]" : "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"}`}
            >
              <Icon name="folder" className="h-5 w-5" />
              <span className="flex-1 text-left">Catálogos</span>
              <Icon name="chevron" className={`h-4 w-4 transition-transform ${catalogOpen ? "rotate-90" : ""}`} />
            </button>
          ) : (
            <div className="my-2 border-t border-[#E2E8F0]" title="Catálogos" />
          )}

          {(catalogOpen || collapsed) ? (
            <div className={`mt-1 space-y-1 ${collapsed ? "" : "ml-3 border-l border-[#E2E8F0] pl-2"}`}>
              {catalogNavigation.map((item) => (
                <NavLink key={item.href} {...item} collapsed={collapsed} />
              ))}
            </div>
          ) : null}
        </div>

        <div className="pt-3">
          {utilityNavigation.map((item) => <NavLink key={item.href} {...item} collapsed={collapsed} />)}
        </div>
      </nav>
    </aside>
  );
}
