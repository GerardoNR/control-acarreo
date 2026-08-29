"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Icon } from "./icons";
import { getAdminSectionTitle } from "@/lib/admin-navigation";

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-10 flex h-17 shrink-0 items-center justify-between bg-[#0F172A] px-4 text-white sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onToggleSidebar} className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white" aria-label="Expandir o colapsar menú">
          <Icon name="menu" className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold sm:text-base">{getAdminSectionTitle(pathname)}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden items-center gap-3 sm:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-slate-200">
            <Icon name="user" className="h-5 w-5" />
          </span>
          <div className="max-w-48 leading-tight">
            <p className="truncate text-sm font-medium">{user?.nombre}</p>
            <p className="mt-0.5 text-[10px] font-semibold tracking-wider text-slate-400">ADMINISTRADOR</p>
          </div>
        </div>
        <button type="button" onClick={handleLogout} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white" title="Cerrar sesión">
          <Icon name="logout" className="h-5 w-5" />
          <span className="hidden lg:inline">Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}
