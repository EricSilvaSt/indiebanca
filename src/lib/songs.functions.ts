import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SongInput = z.object({
  band_id: z.string().uuid(),
  title: z.string().trim().min(1).max(120),
  album: z.string().trim().max(120).default("Single"),
  year: z.coerce.number().int().min(1900).max(2100),
  duration: z.string().trim().max(10).default("3:30"),
  external_url: z.string().url().nullable().optional(),
  audio_url: z.string().url().nullable().optional(),
  cover_url: z.string().url().nullable().optional(),
  album_id: z.string().uuid().nullable().optional(),
  track_number: z.coerce.number().int().min(1).max(999).nullable().optional(),
});

export const createSong = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SongInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("songs")
      .insert(data)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteSong = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("songs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });