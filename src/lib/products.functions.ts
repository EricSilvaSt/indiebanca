import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CATEGORY_VALUES = [
  "Camisetas",
  "Bonés",
  "CDs",
  "Vinis",
  "Adesivos",
  "Palhetas",
  "Posters",
  "Personalizados",
] as const;

const ProductInput = z.object({
  band_id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  category: z.enum(CATEGORY_VALUES),
  price: z.coerce.number().nonnegative(),
  description: z.string().trim().max(2000).default(""),
  on_demand: z.boolean().default(true),
  stock: z.coerce.number().int().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
});

export const createProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProductInput.parse(d))
  .handler(async ({ data, context }) => {
    const payload = { ...data, stock: data.on_demand ? null : data.stock ?? 0 };
    const { data: row, error } = await context.supabase
      .from("products")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });