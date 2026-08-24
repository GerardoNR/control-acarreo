"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SessionLoading } from "@/components/auth/session-loading";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
    if (status === "unauthenticated") router.replace("/login");
  }, [router, status]);

  return <SessionLoading message="Preparando el panel administrativo" />;
}
