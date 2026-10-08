import { createServerFn } from "@tanstack/react-start";
import { createPublicServerClient } from "./supabase-server";

export const listRadioTracks = createServerFn({ method: "GET" }).handler(async () => {
  const sb = createPublicServerClient();
  const { data, error } = await sb
    .from("songs")
    .select(
      "id, title, album, year, duration, cover_url, audio_url, external_url, band:bands(id, slug, name, avatar_url)",
    )
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as RadioTrackRow[];
});

export type RadioTrackRow = {
  id: string;
  title: string;
  album: string;
  year: number;
  duration: string;
  cover_url: string | null;
  audio_url: string | null;
  external_url: string | null;
  band: { id: string; slug: string; name: string; avatar_url: string | null } | null;
};
