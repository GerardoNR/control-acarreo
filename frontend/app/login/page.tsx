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
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="grid min-h-screen bg-[#F8FAFC] min-[850px]:grid-cols-[minmax(260px,0.72fr)_minmax(420px,1.28fr)]">
      <section className="hidden border-r border-[#CBD5E1] bg-[#F1F5F9] p-6 min-[850px]:flex min-[850px]:flex-col min-[850px]:justify-between sm:p-8 xl:p-12">
        <div className="flex items-center gap-4">
          <Image src="/indi_logo.png" alt="INDI" width={68} height={68} priority className="rounded-xl" />
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

      <section className="flex items-center justify-center px-4 py-8 sm:px-8 sm:py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 min-[850px]:hidden">
            <Image src="/indi_logo.png" alt="INDI" width={54} height={54} priority className="rounded-xl" />
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
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 w-full rounded-lg border border-[#CBD5E1] bg-white px-3.5 pr-12 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-blue-100"
                    placeholder="Tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-pressed={showPassword}
                    title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    className="absolute inset-y-0 right-1 flex w-10 items-center justify-center rounded-md text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                  >
                    <EyeIcon hidden={!showPassword} />
                  </button>
                </div>
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

function EyeIcon({ hidden }: { hidden: boolean }) {
  return hidden ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.3A10.8 10.8 0 0 1 12 4c5 0 8.7 4 10 8a14.8 14.8 0 0 1-3.2 5.1M6.2 6.2C3.9 7.8 2.6 10.3 2 12c1.3 4 5 8 10 8 1 0 2-.2 2.9-.5" /></svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></svg>
  );
}
