import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createPublicServerClient } from "./supabase-server";

export const listFeedPosts = createServerFn({ method: "GET" }).handler(async () => {
  const sb = createPublicServerClient();
  const { data, error } = await sb
    .from("posts")
    .select("*, band:bands(id, slug, name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) throw new Error(error.message);
  const posts = data ?? [];
  if (posts.length === 0) return [];
  const ids = posts.map((p) => p.id);
  const { data: likeRows } = await sb.from("post_likes").select("post_id").in("post_id", ids);
  const counts = new Map<string, number>();
  for (const r of likeRows ?? []) counts.set(r.post_id, (counts.get(r.post_id) ?? 0) + 1);
  return posts.map((p) => ({ ...p, likes: counts.get(p.id) ?? 0 }));
});

const PostInput = z.object({
  band_id: z.string().uuid(),
  content: z.string().trim().min(1).max(2000),
  image_url: z.string().url().nullable().optional(),
  type: z.enum(["post", "evento"]).default("post"),
});

export const createPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PostInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("posts")
      .insert(data)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const togglePostLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ post_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("post_likes")
      .select("post_id")
      .eq("post_id", data.post_id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) {
      const { error } = await context.supabase
        .from("post_likes")
        .delete()
        .eq("post_id", data.post_id)
        .eq("user_id", context.userId);
      if (error) throw new Error(error.message);
      return { liked: false };
    }
    const { error } = await context.supabase
      .from("post_likes")
      .insert({ post_id: data.post_id, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { liked: true };
  });