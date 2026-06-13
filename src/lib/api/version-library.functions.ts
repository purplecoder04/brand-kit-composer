import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { BuilderDraft } from "../builder-content";
import type { KitVersionRecord } from "../version-library";

const versionStatusSchema = z.enum(["Draft", "Template Test", "In Review", "Approved", "Archived"]);
const qcStatusSchema = z.enum(["Not Reviewed", "Needs Repair", "Passed"]);

const updatePatchSchema = z.object({
  status: versionStatusSchema.optional(),
  qcStatus: qcStatusSchema.optional(),
  saleReady: z.boolean().optional(),
  docHubReady: z.boolean().optional(),
  notes: z.string().optional(),
});

type VersionLibraryResult<T> = { ok: true; data: T } | { ok: false; message: string };

export const listVersionLibraryRecords = createServerFn({ method: "POST" }).handler(
  async (): Promise<VersionLibraryResult<{ records: KitVersionRecord[] }>> => {
    try {
      const { listSupabaseVersions } = await import("../supabase-version-library.server");
      return { ok: true, data: { records: await listSupabaseVersions() } };
    } catch (error) {
      return { ok: false, message: getErrorMessage(error) };
    }
  },
);

export const createVersionLibraryRecord = createServerFn({ method: "POST" })
  .inputValidator(z.object({ draft: z.unknown() }))
  .handler(async ({ data }): Promise<VersionLibraryResult<{ record: KitVersionRecord }>> => {
    try {
      const { createSupabaseVersionFromDraft } = await import("../supabase-version-library.server");
      const record = await createSupabaseVersionFromDraft(data.draft as BuilderDraft);
      return { ok: true, data: { record } };
    } catch (error) {
      return { ok: false, message: getErrorMessage(error) };
    }
  });

export const duplicateVersionLibraryRecord = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }): Promise<VersionLibraryResult<{ record: KitVersionRecord }>> => {
    try {
      const { duplicateSupabaseVersion } = await import("../supabase-version-library.server");
      const record = await duplicateSupabaseVersion(data.id);
      return { ok: true, data: { record } };
    } catch (error) {
      return { ok: false, message: getErrorMessage(error) };
    }
  });

export const updateVersionLibraryRecord = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1), patch: updatePatchSchema }))
  .handler(async ({ data }): Promise<VersionLibraryResult<{ record: KitVersionRecord }>> => {
    try {
      const { updateSupabaseVersion } = await import("../supabase-version-library.server");
      const record = await updateSupabaseVersion(data.id, data.patch);
      return { ok: true, data: { record } };
    } catch (error) {
      return { ok: false, message: getErrorMessage(error) };
    }
  });

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Version Library database action failed.";
}
