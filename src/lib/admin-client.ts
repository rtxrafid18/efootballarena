import { adminWrite } from "./admin.functions";

type Values = Record<string, unknown>;

/**
 * Passcode-gated write. Mirrors the supabase `{ error }` result shape so the
 * admin UI keeps its existing error handling.
 */
export async function write(
  table: "settings" | "groups" | "teams" | "matches" | "goals" | "assist_stats" | "gk_stats",
  action: "insert" | "update" | "delete",
  values?: Values,
  id?: string | number,
): Promise<{ error: { message: string } | null }> {
  try {
    await adminWrite({ data: { table, action, values, id } });
    return { error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      error: {
        message: /passcode required/i.test(message)
          ? "Session expired — enter the admin passcode again."
          : message,
      },
    };
  }
}
