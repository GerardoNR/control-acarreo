"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { LoginError } from "@/components/auth/auth-provider";
import { SessionLoading } from "@/components/auth/session-loading";
import { useAuth } from "@/hooks/use-auth";

const LOGIN_MESSAGES = {
  INVALID_CREDENTIALS: "Usuario o contraseña incorrectos.",
  FORBIDDEN_ROLE: "Tu cuenta no tiene permisos para acceder al panel administrativo.",
  CONNECTION: "No fue posible conectar con el servidor.",
  UNKNOWN: "No fue posible iniciar sesión.",
} as const;

export default function LoginPage() {
  const router = useRouter();
  const { login, status } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login({ usuario, password });
      router.replace("/dashboard");
    } catch (loginError) {
      const reason = loginError instanceof LoginError ? loginError.reason : "UNKNOWN";
      setError(LOGIN_MESSAGES[reason]);
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" || status === "authenticated") {
    return <SessionLoading message="Validando acceso administrativo" />;
  }

  return (
    <main className="grid min-h-screen bg-[#F8FAFC] lg:grid-cols-[minmax(320px,0.8fr)_minmax(520px,1.2fr)]">
      <section className="hidden border-r border-[#CBD5E1] bg-[#F1F5F9] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-4">
          <Image src="/indi_logo.png" alt="INDI" width={68} height={68} priority />
          <div>
            <p className="text-2xl font-bold tracking-tight text-[#0F172A]">INDI</p>
            <p className="text-sm text-[#475569]">Control de acarreo</p>
          </div>
        </div>
        <div className="max-w-md">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#2563EB]">
            Operación y trazabilidad
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-[#0F172A]">
            Transporte de materiales bajo control.
          </h1>
          <p className="mt-5 text-base leading-7 text-[#475569]">
            Acceso administrativo para supervisar la operación, los viajes y los catálogos de INDI.
          </p>
        </div>
        <p className="text-xs text-[#64748B]">Sistema de trazabilidad de materiales</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Image src="/indi_logo.png" alt="INDI" width={54} height={54} priority />
            <div>
              <p className="text-xl font-bold text-[#0F172A]">INDI</p>
              <p className="text-xs text-[#475569]">Panel administrativo</p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#CBD5E1] bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-9">
            <p className="text-sm font-semibold text-[#2563EB]">Panel administrativo</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#0F172A]">Iniciar sesión</h2>
            <p className="mt-2 text-sm leading-6 text-[#475569]">
              Ingresa con tu cuenta de administrador para continuar.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="usuario" className="mb-2 block text-sm font-medium text-[#0F172A]">
                  Usuario
                </label>
                <input
                  id="usuario"
                  name="usuario"
                  type="text"
                  autoComplete="username"
                  minLength={3}
                  required
                  value={usuario}
                  onChange={(event) => setUsuario(event.target.value)}
                  className="h-11 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-blue-100"
                  placeholder="Tu usuario"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#0F172A]">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-blue-100"
                  placeholder="Tu contraseña"
                />
              </div>

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700" role="alert">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-65"
              >
                {submitting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/45 border-t-white" />
                ) : null}
                {submitting ? "Validando acceso" : "Iniciar sesión"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
