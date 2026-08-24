import type { ReactNode } from "react";
import { AdminGuard } from "@/components/auth/admin-guard";
import { AdminShell } from "@/components/admin/admin-shell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
