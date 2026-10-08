import { supabase } from "@/integrations/supabase/client";

const BUCKET = "band-media";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Uploads to band-media/<userId>/<folder>/<name>, returns a long-lived signed URL.
 * Bucket is private (workspace blocks public buckets), so we store signed URLs.
 */
export async function uploadMedia(
  file: File,
  opts: { userId: string; folder: string },
): Promise<string> {
  const ext = file.name.split(".").pop() || "bin";
  const path = `${opts.userId}/${opts.folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, ONE_YEAR);
  if (signErr) throw signErr;
  return data.signedUrl;
}

export async function uploadAudio(file: File, opts: { userId: string }): Promise<string> {
  const allowed = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/ogg",
    "audio/mp4",
  ];
  if (!allowed.includes(file.type)) throw new Error("Envie um arquivo MP3, WAV, OGG ou M4A.");
  if (file.size > 50 * 1024 * 1024) throw new Error("O áudio deve ter no máximo 50 MB.");
  return uploadMedia(file, { userId: opts.userId, folder: "audio" });
}
