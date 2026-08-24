import axios from "axios";
import { authStorage } from "@/lib/auth-storage";

export const SESSION_INVALID_EVENT = "indi:session-invalid";

export const api = axios.create({
  baseURL: "/api",
  timeout: 15_000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      authStorage.clear();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(SESSION_INVALID_EVENT));
      }
    }
    return Promise.reject(error);
  },
);
