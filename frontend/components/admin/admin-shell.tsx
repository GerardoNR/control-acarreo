"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AdminShell({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onToggleSidebar={() => setSidebarCollapsed((value) => !value)} />
        <main className="flex-1 p-5 sm:p-7 lg:p-9">{children}</main>
      </div>
    </div>
  );
}
