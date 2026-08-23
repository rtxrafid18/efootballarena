import { createHash, timingSafeEqual } from "node:crypto";
import { useSession } from "@tanstack/react-start/server";

export type AdminSession = { unlocked?: boolean };

export function adminSessionConfig() {
  return {
    password: process.env.ADMIN_SESSION_SECRET!,
    name: "efc-admin",
    maxAge: 60 * 60 * 12, // 12 hours
    cookie: { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/" },
  };
}

export function passcodeMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function isUnlocked(): Promise<boolean> {
  const session = await useSession<AdminSession>(adminSessionConfig());
  return session.data.unlocked === true;
}

export async function requireUnlocked(): Promise<void> {
  if (!(await isUnlocked())) throw new Error("Admin passcode required");
}

export const ADMIN_TABLES = [
  "settings",
  "groups",
  "teams",
  "matches",
  "goals",
  "assist_stats",
  "gk_stats",
] as const;

export type AdminTable = (typeof ADMIN_TABLES)[number];
export type AdminAction = "insert" | "update" | "delete";

export type AdminWriteInput = {
  table: AdminTable;
  action: AdminAction;
  values?: Record<string, unknown>;
  id?: string | number;
};

export function validateWriteInput(input: unknown): AdminWriteInput {
  const raw = input as Partial<AdminWriteInput> | null;
  if (!raw || typeof raw !== "object") throw new Error("Invalid request");
  if (!ADMIN_TABLES.includes(raw.table as AdminTable)) throw new Error("Unknown table");
  if (!["insert", "update", "delete"].includes(raw.action as string)) {
    throw new Error("Unknown action");
  }
  if (raw.action !== "insert" && raw.id === undefined) throw new Error("Missing row id");
  if (raw.action !== "delete" && (!raw.values || typeof raw.values !== "object")) {
    throw new Error("Missing values");
  }
  return {
    table: raw.table as AdminTable,
    action: raw.action as AdminAction,
    values: raw.values as Record<string, unknown> | undefined,
    id: raw.id,
  };
}

/* ---------------- Tournament reset ---------------- */

export const RESET_SCOPES = ["results", "fixtures", "everything"] as const;
export type ResetScope = (typeof RESET_SCOPES)[number];

export function validateResetInput(input: unknown): { scope: ResetScope } {
  const raw = input as { scope?: string } | null;
  if (!raw || !RESET_SCOPES.includes(raw.scope as ResetScope)) {
    throw new Error("Unknown reset scope");
  }
  return { scope: raw.scope as ResetScope };
}
