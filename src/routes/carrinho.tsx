import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Minus, Plus, Trash2, ShoppingBag, Factory, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatBRL } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { createOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho — IndieBanca" },
      { name: "description", content: "Revise seus produtos e finalize seu pedido na IndieBanca." },
    ],
  }),
  component: Cart,
});

function Cart() {
  const { items, updateQuantity, removeItem, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const shipping = items.length > 0 ? 19.9 : 0;
  const total = subtotal + shipping;

  const [name, setName] = useState(user?.user_metadata?.display_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  const checkout = useMutation({
    mutationFn: async () =>
      createOrder({
        data: {
          customer_name: name,
          customer_email: email,
          items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        },
      }),
    onSuccess: () => {
      toast.success("Pedido criado!", {
        description: "Você pode acompanhar pelo painel.",
      });
      clear();
      navigate({ to: "/dashboard", search: { tab: "overview" } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-28 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent text-brand">
          <ShoppingBag className="size-8" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold">Seu carrinho está vazio</h1>
        <p className="mt-2 text-muted-foreground">
          Explore as lojas das bandas e apoie a música independente.
        </p>
        <Link to="/explorar">
          <Button className="mt-6 bg-gradient-brand text-brand-foreground">Explorar bandas</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold">Carrinho de compras</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <img
                src={item.product.image_url ?? "https://picsum.photos/seed/cart/200/200"}
                alt={item.product.name}
                loading="lazy"
                className="size-24 shrink-0 rounded-xl object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{item.bandName}</p>
                    <h3 className="truncate font-semibold">{item.product.name}</h3>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="Remover"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                {item.product.on_demand && (
                  <Badge className="mt-1 w-fit gap-1 border-0 bg-brand-2/15 text-brand-2">
                    <Factory className="size-3" /> Sob demanda
                  </Badge>
                )}
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"
                      aria-label="Diminuir"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"
                      aria-label="Aumentar"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="font-display font-bold">
                    {formatBRL(Number(item.product.price) * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={clear}
            className="text-sm text-muted-foreground transition-colors hover:text-destructive"
          >
            Esvaziar carrinho
          </button>
        </div>

        <div className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold">Resumo do pedido</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatBRL(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Frete estimado</dt>
              <dd>{formatBRL(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 font-display text-lg font-bold">
              <dt>Total</dt>
              <dd>{formatBRL(total)}</dd>
            </div>
          </dl>

          {!user ? (
            <div className="mt-6 rounded-lg bg-secondary p-4 text-sm">
              <p className="text-muted-foreground">Você precisa entrar para finalizar o pedido.</p>
              <Link to="/auth">
                <Button className="mt-3 w-full bg-gradient-brand text-brand-foreground">
                  Entrar
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-6 space-y-3">
                <div>
                  <Label htmlFor="checkout-name">Nome</Label>
                  <Input
                    id="checkout-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <Label htmlFor="checkout-email">E-mail</Label>
                  <Input
                    id="checkout-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                  />
                </div>
              </div>
              <Button
                size="lg"
                disabled={checkout.isPending || !name || !email}
                className="mt-6 w-full gap-2 bg-gradient-brand text-brand-foreground hover:opacity-90"
                onClick={() => checkout.mutate()}
              >
                {checkout.isPending ? "Processando..." : "Finalizar pedido"}{" "}
                <ArrowRight className="size-4" />
              </Button>
            </>
          )}

          <p className="mt-4 rounded-lg bg-secondary p-3 text-xs leading-relaxed text-muted-foreground">
            Produtos marcados como <strong>“Produção sob demanda”</strong> serão fabricados após a
            confirmação do pedido e enviados em seguida ao comprador.
          </p>
        </div>
      </div>
    </div>
  );
}