import { useMemo } from "react";

export type JwtGuestPayload = {
  invitado_id: number | null;
  entrevista_id: number;
  nombre: string;
  email: string;
  moderator: boolean;
};

export function useJwtDecode(token: string | null): JwtGuestPayload | null {
  return useMemo(() => {
    if (!token) return null;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const decoded = atob(base64);
      return JSON.parse(decoded) as JwtGuestPayload;
    } catch {
      return null;
    }
  }, [token]);
}
