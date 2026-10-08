import { Factory, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/domain";
import { formatBRL } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";

export function ProductCard({ product, bandName }: { product: Product; bandName: string }) {
  const { addItem } = useCart();

  return (
    <div className="card-hover group flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image_url || "https://picsum.photos/seed/product/400/400"}
          alt={product.name}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.on_demand ? (
          <Badge className="absolute left-3 top-3 gap-1 border-0 bg-brand-2/90 text-white">
            <Factory className="size-3" /> Sob demanda
          </Badge>
        ) : (
          <Badge className="absolute left-3 top-3 border-0 bg-background/70 text-foreground backdrop-blur">
            {product.stock ?? 0} em estoque
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {product.category}
        </span>
        <h3 className="mt-1 font-semibold leading-tight">{product.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="font-display text-lg font-bold">{formatBRL(Number(product.price))}</span>
          <Button
            size="sm"
            className="bg-gradient-brand text-brand-foreground hover:opacity-90"
            onClick={() => {
              addItem(product, bandName);
              toast.success("Adicionado ao carrinho", { description: product.name });
            }}
          >
            <Plus className="size-4" /> Comprar
          </Button>
        </div>
      </div>
    </div>
  );
}
