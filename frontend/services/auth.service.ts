import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth-storage";
import type { AuthUser, LoginRequest, LoginResponse } from "@/types/auth";

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/login", credentials);
    return data;
  },

  async getProfile(): Promise<AuthUser> {
    const { data } = await api.get<AuthUser>("/auth/profile");
    return data;
  },

  logout(): void {
    authStorage.clear();
  },
};
