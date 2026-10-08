import { Link } from "@tanstack/react-router";
import { MapPin, Headphones, BadgeCheck } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export type BandCardData = {
  slug: string;
  name: string;
  type: string;
  genre: string;
  city: string;
  state: string;
  avatar_url: string | null;
  cover_url: string | null;
  monthly_listeners?: number | null;
  verified?: boolean;
};

const FALLBACK_COVER = "https://picsum.photos/seed/cover/800/500";
const FALLBACK_AVATAR = "https://picsum.photos/seed/avatar/200/200";

export function BandCard({ band }: { band: BandCardData }) {
  return (
    <Link
      to="/banda/$slug"
      params={{ slug: band.slug }}
      className="card-hover group block overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={band.cover_url || FALLBACK_COVER}
          alt={`Capa de ${band.name}`}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        <Badge className="absolute right-3 top-3 border-0 bg-background/70 text-foreground backdrop-blur">
          {band.genre}
        </Badge>
      </div>
      <div className="relative z-10 -mt-8 flex items-end gap-3 px-4">
        <img
          src={band.avatar_url || FALLBACK_AVATAR}
          alt={band.name}
          loading="lazy"
          className="size-16 shrink-0 rounded-xl border-4 border-card object-cover"
        />
        <div className="min-w-0 pb-1">
          <h3 className="flex items-center gap-1 truncate font-display text-lg font-bold leading-tight">
            <span className="truncate">{band.name}</span>
            {band.verified && <BadgeCheck className="size-4 shrink-0 text-brand" aria-label="Banda verificada" />}
          </h3>
          <p className="text-xs text-muted-foreground">{band.type}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 px-4 pb-4 pt-3 text-xs text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {band.city}, {band.state}
          </span>
        </span>
        {typeof band.monthly_listeners === "number" && (
          <span className="flex shrink-0 items-center gap-1">
            <Headphones className="size-3.5" />
            {formatNumber(band.monthly_listeners)}
          </span>
        )}
      </div>
    </Link>
  );
}
