import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import {
  adminSessionConfig,
  isUnlocked,
  passcodeMatches,
  requireUnlocked,
  validateWriteInput,
  type AdminSession,
  type AdminWriteInput,
} from "./admin.server";

export const getAdminStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { unlocked: await isUnlocked() };
});

export const unlockAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { passcode: string }) => {
    if (!data || typeof data.passcode !== "string" || data.passcode.length > 200) {
      throw new Error("Invalid passcode");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSCODE;
    if (!expected) throw new Error("Admin passcode is not configured");
    if (!passcodeMatches(data.passcode, expected)) return { ok: false as const };
    const session = await useSession<AdminSession>(adminSessionConfig());
    await session.update({ unlocked: true });
    return { ok: true as const };
  });

export const lockAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<AdminSession>(adminSessionConfig());
  await session.clear();
  return { ok: true as const };
});

export const adminWrite = createServerFn({ method: "POST" })
  .inputValidator((data: AdminWriteInput) => validateWriteInput(data))
  .handler(async ({ data }) => {
    await requireUnlocked();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const table = supabaseAdmin.from(data.table);

    const result =
      data.action === "insert"
        ? await table.insert(data.values as never)
        : data.action === "update"
          ? await table.update(data.values as never).eq("id", data.id as never)
          : await table.delete().eq("id", data.id as never);

    if (result.error) throw new Error(result.error.message);
    return { ok: true as const };
  });
