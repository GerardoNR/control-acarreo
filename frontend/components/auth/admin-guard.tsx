"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { SessionLoading } from "./session-loading";

export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated" || (user && user.rol !== "ADMINISTRADOR")) {
      router.replace("/login");
    }
  }, [router, status, user]);

  if (status !== "authenticated" || user?.rol !== "ADMINISTRADOR") {
    return <SessionLoading />;
  }

  return children;
}
