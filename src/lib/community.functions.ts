import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const uuid = z.string().uuid();

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getPlatformAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) throw new Error(error.message);
    return Boolean(data);
  });

export const listMyInvitations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = typeof context.claims.email === "string" ? context.claims.email.toLowerCase() : "";
    const { data, error } = await context.supabase
      .from("band_invitations")
      .select("id, band_id, email, role, expires_at, bands(name, slug)")
      .eq("email", email)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const acceptBandInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ invitation_id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: bandId, error } = await context.supabase.rpc("accept_band_invitation", {
      _invitation_id: data.invitation_id,
    });
    if (error) throw new Error(error.message);
    if (!bandId) throw new Error("O convite foi aceito, mas não foi possível identificar a banda.");
    return { ok: true, band_id: bandId };
  });

export const listPendingBandClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("band_claims")
      .select("id, band_id, claimant_user_id, claimed_role, official_url, evidence, created_at, band:bands(name, slug)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const reviewBandClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ claim_id: uuid, decision: z.enum(["approved", "rejected"]), notes: z.string().trim().max(1000).default("") }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("review_band_claim", {
      _claim_id: data.claim_id,
      _decision: data.decision,
      _notes: data.notes || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: uuid.optional(), all: z.boolean().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    let query = context.supabase.from("notifications").update({ read_at: new Date().toISOString() });
    query = data.all ? query.eq("user_id", context.userId) : query.eq("id", data.id ?? "");
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ band_id: uuid, claimed_role: z.string().trim().min(2).max(80), official_url: z.string().url(), evidence: z.string().trim().min(20).max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("band_claims").insert({ ...data, claimant_user_id: context.userId, status: "pending" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createTipIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ band_id: uuid, supporter_name: z.string().trim().min(2).max(100), supporter_email: z.string().email(), amount: z.coerce.number().min(1).max(10000), message: z.string().trim().max(500).default("") }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: band } = await context.supabase.from("bands").select("verified, support_enabled").eq("id", data.band_id).single();
    if (!band?.verified || !band.support_enabled) throw new Error("Esta banda ainda não está habilitada para receber apoios.");
    return { available: false as const, message: "Os pagamentos serão liberados quando a conta de pagamentos da plataforma estiver conectada." };
  });

export const getBandManagement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ band_id: uuid }).parse(d))
  .handler(async ({ data, context }) => {
    const [albums, members, invitations, tips, claims] = await Promise.all([
      context.supabase.from("albums").select("*").eq("band_id", data.band_id).order("release_year", { ascending: false }),
      context.supabase.from("band_members").select("*").eq("band_id", data.band_id),
      context.supabase.from("band_invitations").select("*").eq("band_id", data.band_id).order("created_at", { ascending: false }),
      context.supabase.from("tips").select("*").eq("band_id", data.band_id).order("created_at", { ascending: false }),
      context.supabase.from("band_claims").select("*").eq("band_id", data.band_id).order("created_at", { ascending: false }),
    ]);
    for (const result of [albums, members, invitations, tips, claims]) if (result.error) throw new Error(result.error.message);
    return { albums: albums.data ?? [], members: members.data ?? [], invitations: invitations.data ?? [], tips: tips.data ?? [], claims: claims.data ?? [] };
  });

export const createAlbum = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ band_id: uuid, title: z.string().trim().min(1).max(120), type: z.enum(["Álbum", "EP", "Single", "Ao vivo", "Coletânea"]), cover_url: z.string().url().nullable().optional(), release_year: z.coerce.number().int().min(1900).max(2100) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("albums").insert(data).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const inviteBandMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ band_id: uuid, email: z.string().email(), role: z.enum(["admin", "editor", "member"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("band_invitations").insert({ ...data, email: data.email.toLowerCase(), invited_by: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setBandSupport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ band_id: uuid, enabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("set_band_support", {
      _band_id: data.band_id,
      _enabled: data.enabled,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });