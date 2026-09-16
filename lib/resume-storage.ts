import type { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

type DB = SupabaseClient<Database>;

const BUCKET = "resumes";

export type StoredResume = { storage_path: string; filename: string };

/** Uploads a resume to the user's private storage folder and points the profile at it, removing the previous file if there was one. */
export async function uploadResume(
  supabase: DB,
  userId: string,
  profileId: string,
  file: File,
  oldStoragePath: string | null
): Promise<StoredResume> {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "pdf";
  const path = `${userId}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ resume_storage_path: path, resume_filename: file.name, resume_uploaded_at: new Date().toISOString() })
    .eq("id", profileId);
  if (updateError) throw updateError;

  if (oldStoragePath) {
    await supabase.storage.from(BUCKET).remove([oldStoragePath]).catch(() => {});
  }

  return { storage_path: path, filename: file.name };
}

/** Removes the user's resume from storage and clears the profile fields pointing at it. */
export async function deleteResume(supabase: DB, profileId: string, storagePath: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([storagePath]);
  await supabase
    .from("user_profiles")
    .update({ resume_storage_path: null, resume_filename: null, resume_uploaded_at: null })
    .eq("id", profileId);
}

/** Downloads the resume's raw bytes, for attaching to an outbound email. */
export async function downloadResume(supabase: DB, storagePath: string): Promise<Buffer> {
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
  if (error || !data) throw new Error("Failed to download resume from storage");
  return Buffer.from(await data.arrayBuffer());
}

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
};

export function guessResumeMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}
