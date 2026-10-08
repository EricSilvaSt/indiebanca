import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CheckoutInput = z.object({
  customer_name: z.string().trim().min(1).max(120),
  customer_email: z.string().trim().email().max(255),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.coerce.number().int().min(1).max(99),
      }),
    )
    .min(1),
});

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CheckoutInput.parse(d))
  .handler(async ({ data, context }) => {
    const ids = data.items.map((i) => i.product_id);
    const { data: products, error: pErr } = await context.supabase
      .from("products")
      .select("id, name, price, on_demand, band_id")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);
    const byId = new Map((products ?? []).map((p) => [p.id, p]));
    let total = 0;
    const lines = data.items.map((i) => {
      const p = byId.get(i.product_id);
      if (!p) throw new Error("Produto não encontrado");
      const unit = Number(p.price);
      total += unit * i.quantity;
      return {
        product_id: p.id,
        band_id: p.band_id,
        product_name: p.name,
        quantity: i.quantity,
        unit_price: unit,
        on_demand: p.on_demand,
      };
    });

    const { data: order, error: oErr } = await context.supabase
      .from("orders")
      .insert({
        user_id: context.userId,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        total,
        status: "Pendente",
      })
      .select("id")
      .single();
    if (oErr) throw new Error(oErr.message);

    const { error: iErr } = await context.supabase
      .from("order_items")
      .insert(lines.map((l) => ({ ...l, order_id: order.id })));
    if (iErr) throw new Error(iErr.message);

    return { id: order.id, total };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select(
        "id, customer_name, total, status, created_at, items:order_items(product_name, quantity, on_demand)",
      )
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listBandOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ band_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("order_items")
      .select(
        "id, product_name, quantity, unit_price, on_demand, order:orders(id, customer_name, customer_email, total, status, created_at)",
      )
      .eq("band_id", data.band_id)
      .limit(100);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["Pendente", "Em produção", "Enviado", "Entregue"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });