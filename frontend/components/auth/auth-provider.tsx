"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SESSION_INVALID_EVENT } from "@/lib/api";
import { authStorage } from "@/lib/auth-storage";
import { authService } from "@/services/auth.service";
import type { AuthUser, LoginRequest } from "@/types/auth";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";
export type LoginFailure = "INVALID_CREDENTIALS" | "FORBIDDEN_ROLE" | "CONNECTION" | "UNKNOWN";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export class LoginError extends Error {
  constructor(public readonly reason: LoginFailure) {
    super(reason);
    this.name = "LoginError";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const clearSession = useCallback(() => {
    authService.logout();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      if (!authStorage.getToken()) {
        setStatus("unauthenticated");
        return;
      }

      try {
        const profile = await authService.getProfile();
        if (profile.rol !== "ADMINISTRADOR") {
          clearSession();
          return;
        }
        setUser(profile);
        setStatus("authenticated");
      } catch {
        clearSession();
      }
    };

    void restoreSession();
  }, [clearSession]);

  useEffect(() => {
    window.addEventListener(SESSION_INVALID_EVENT, clearSession);
    return () => window.removeEventListener(SESSION_INVALID_EVENT, clearSession);
  }, [clearSession]);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      const response = await authService.login(credentials);
      authStorage.setToken(response.access_token);

      const profile = await authService.getProfile();
      if (profile.rol !== "ADMINISTRADOR") {
        authService.logout();
        throw new LoginError("FORBIDDEN_ROLE");
      }

      setUser(profile);
      setStatus("authenticated");
    } catch (error) {
      if (error instanceof LoginError) throw error;
      authService.logout();

      const axiosError = error as {
        response?: { status?: number };
        code?: string;
      };
      if (axiosError.response?.status === 401) {
        throw new LoginError("INVALID_CREDENTIALS");
      }
      if (!axiosError.response || axiosError.code === "ECONNABORTED") {
        throw new LoginError("CONNECTION");
      }
      throw new LoginError("UNKNOWN");
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, login, logout: clearSession }),
    [clearSession, login, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
