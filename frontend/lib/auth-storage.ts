const TOKEN_KEY = "indi_admin_access_token";

function hasBrowserStorage() {
  return typeof window !== "undefined";
}

export const authStorage = {
  getToken(): string | null {
    if (!hasBrowserStorage()) return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    if (!hasBrowserStorage()) return;
    window.localStorage.setItem(TOKEN_KEY, token);
  },

  clear(): void {
    if (!hasBrowserStorage()) return;
    window.localStorage.removeItem(TOKEN_KEY);
  },
};
