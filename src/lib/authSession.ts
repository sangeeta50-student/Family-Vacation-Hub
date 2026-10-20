import type { Session } from "@supabase/supabase-js";

// Tracks session changes only; MFA and database access are still checked by Supabase.
export const getSessionVerificationKey = (session: Session | null): string | null => {
  if (!session) return null;

  try {
    const payload = session.access_token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const claims = JSON.parse(new TextDecoder().decode(
      Uint8Array.from(decoded, character => character.charCodeAt(0))
    )) as Record<string, unknown>;

    if (
      !claims ||
      claims.sub !== session.user.id ||
      typeof claims.session_id !== "string" ||
      !claims.session_id ||
      (claims.aal !== "aal1" && claims.aal !== "aal2")
    ) {
      return null;
    }

    return JSON.stringify([session.user.id, claims.session_id, claims.aal]);
  } catch {
    return null;
  }
};
