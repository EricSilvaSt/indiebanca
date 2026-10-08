import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createPublicServerClient } from "./supabase-server";
import { slugify } from "./format";

const ARTIST_TYPE_VALUES = ["Banda", "Artista solo"] as const;
const GENRE_VALUES = [
  "Rock",
  "Metal",
  "Punk",
  "Hardcore",
  "Blues",
  "Indie",
  "Rap",
  "Reggae",
  "MPB",
  "Outros",
] as const;

const BandInput = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(ARTIST_TYPE_VALUES),
  genre: z.enum(GENRE_VALUES),
  city: z.string().trim().max(80).default(""),
  state: z.string().trim().max(80).default(""),
  country: z.string().trim().max(80).default("Brasil"),
  bio: z.string().trim().max(2000).default(""),
  avatar_url: z.string().url().nullable().optional(),
  cover_url: z.string().url().nullable().optional(),
});
const BandUpsertInput = BandInput.extend({ band_id: z.string().uuid().optional() });

export const listFeaturedBands = createServerFn({ method: "GET" }).handler(async () => {
  const sb = createPublicServerClient();
  const { data, error } = await sb
    .from("bands")
    .select("id, slug, name, type, genre, city, state, country, avatar_url, cover_url, monthly_listeners")
    .eq("featured", true)
    .order("monthly_listeners", { ascending: false })
    .limit(8);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listAllBands = createServerFn({ method: "GET" }).handler(async () => {
  const sb = createPublicServerClient();
  const { data, error } = await sb
    .from("bands")
    .select("id, slug, name, type, genre, city, state, country, avatar_url, cover_url, monthly_listeners")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getBandBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const sb = createPublicServerClient();
    const { data: band, error } = await sb.from("bands").select("*").eq("slug", data.slug).maybeSingle();
    if (error) throw new Error(error.message);
    if (!band) return null;
    const [songsRes, albumsRes, productsRes, eventsRes, postsRes, followersRes] = await Promise.all([
      sb.from("songs").select("*").eq("band_id", band.id).order("position"),
      sb.from("albums").select("*").eq("band_id", band.id).order("release_year", { ascending: false }),
      sb.from("products").select("*").eq("band_id", band.id).order("created_at", { ascending: false }),
      sb.from("events").select("*").eq("band_id", band.id).order("event_date"),
      sb.from("posts").select("*").eq("band_id", band.id).order("created_at", { ascending: false }),
      sb.from("followers").select("user_id", { count: "exact", head: true }).eq("band_id", band.id),
    ]);
    return {
      band,
      songs: songsRes.data ?? [],
      albums: albumsRes.data ?? [],
      products: productsRes.data ?? [],
      events: eventsRes.data ?? [],
      posts: postsRes.data ?? [],
      followers: followersRes.count ?? 0,
    };
  });

export const getMyBand = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ band_id: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data: input, context }) => {
    const [memberships, ownerships] = await Promise.all([
      context.supabase
      .from("band_members")
      .select("band_id, role")
      .eq("user_id", context.userId)
      .eq("status", "active"),
      context.supabase.from("bands").select("id").eq("owner_user_id", context.userId),
    ]);
    if (memberships.error) throw new Error(memberships.error.message);
    if (ownerships.error) throw new Error(ownerships.error.message);

    const roles = new Map((memberships.data ?? []).map((membership) => [membership.band_id, membership.role]));
    const bandIds = [...new Set([
      ...roles.keys(),
      ...(ownerships.data ?? []).map((band) => band.id),
    ])];
    if (!bandIds.length) return null;
    if (input.band_id && !bandIds.includes(input.band_id)) {
      throw new Error("Você não tem acesso a esta banda.");
    }

    const selectedBandId = input.band_id ?? bandIds[0];
    const { data, error } = await context.supabase
      .from("bands")
      .select("*")
      .eq("id", selectedBandId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      ...data,
      membership_role: data.owner_user_id === context.userId ? "owner" : (roles.get(data.id) ?? "member"),
    };
  });

export const getMyBands = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [memberships, ownerships] = await Promise.all([
      context.supabase
        .from("band_members")
        .select("band_id, role")
        .eq("user_id", context.userId)
        .eq("status", "active"),
      context.supabase.from("bands").select("id").eq("owner_user_id", context.userId),
    ]);
    if (memberships.error) throw new Error(memberships.error.message);
    if (ownerships.error) throw new Error(ownerships.error.message);

    const roles = new Map((memberships.data ?? []).map((membership) => [membership.band_id, membership.role]));
    const ownedIds = new Set((ownerships.data ?? []).map((band) => band.id));
    const bandIds = [...new Set([...roles.keys(), ...ownedIds])];
    if (!bandIds.length) return [];

    const { data, error } = await context.supabase
      .from("bands")
      .select("id, slug, name, avatar_url")
      .in("id", bandIds)
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []).map((band) => ({
      ...band,
      membership_role: ownedIds.has(band.id) ? "owner" : (roles.get(band.id) ?? "member"),
    }));
  });

export const upsertMyBand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => BandUpsertInput.parse(d))
  .handler(async ({ data, context }) => {
    const { band_id, ...bandData } = data;
    let existingQuery = context.supabase
      .from("bands")
      .select("id, slug");
    existingQuery = band_id
      ? existingQuery.eq("id", band_id)
      : existingQuery.eq("owner_user_id", context.userId);
    const { data: existing, error: lookupError } = await existingQuery.maybeSingle();
    if (lookupError) throw new Error(lookupError.message);
    if (band_id && !existing) throw new Error("Você não tem permissão para editar esta banda.");

    if (existing) {
      const { data: updated, error } = await context.supabase
        .from("bands")
        .update(bandData)
        .eq("id", existing.id)
        .select("id, slug")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!updated) throw new Error("Você não tem permissão para editar esta banda.");
      return { id: updated.id, slug: updated.slug, created: false };
    }

    const base = slugify(bandData.name) || "banda";
    let slug = base;
    for (let i = 2; i < 50; i++) {
      const { data: clash } = await context.supabase.from("bands").select("id").eq("slug", slug).maybeSingle();
      if (!clash) break;
      slug = `${base}-${i}`;
    }

    const { data: created, error } = await context.supabase
      .from("bands")
      .insert({ ...bandData, slug, owner_user_id: context.userId, featured: false })
      .select("id, slug")
      .single();
    if (error) throw new Error(error.message);
    return { id: created.id, slug: created.slug, created: true };
  });

export const isFollowingBand = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ band_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("followers")
      .select("band_id")
      .eq("band_id", data.band_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    return Boolean(row);
  });

export const toggleFollow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ band_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("followers")
      .select("band_id")
      .eq("band_id", data.band_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) {
      const { error } = await context.supabase
        .from("followers")
        .delete()
        .eq("band_id", data.band_id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
      return { following: false };
    }
    const { error } = await context.supabase
      .from("followers")
      .insert({ band_id: data.band_id, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { following: true };
  });