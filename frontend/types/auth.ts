export type UserRole = "ADMINISTRADOR" | "CHECADOR";

export interface AuthUser {
  id: number;
  nombre: string;
  usuario: string;
  rol: UserRole;
}

export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: string;
  usuario: AuthUser;
}
