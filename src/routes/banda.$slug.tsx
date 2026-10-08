import { useState } from "react";
import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MapPin,
  Music2,
  Users,
  Play,
  CalendarDays,
  Clock,
  Check,
  UserPlus,
  Instagram,
  Youtube,
  ArrowRight,
  Heart,
  Sparkles,
  ShoppingBag,
  Headphones,
  BadgeCheck,
  Shuffle,
  HandHeart,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/ProductCard";
import { PostCard } from "@/components/PostCard";
import { formatNumber, relativeTime } from "@/lib/format";
import { getBandBySlug, toggleFollow } from "@/lib/bands.functions";
import { useAuth } from "@/lib/auth-context";
import { usePlayer, isPlayableAudioUrl } from "@/lib/player-store";
import type { Song, Product, Post, BandEvent, BandSocial } from "@/lib/domain";
import { createClaim, createTipIntent } from "@/lib/community.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const bandQuery = (slug: string) => ({
  queryKey: ["band", slug],
  queryFn: () => getBandBySlug({ data: { slug } }),
});

export const Route = createFileRoute("/banda/$slug")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(bandQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Banda — IndieBanca" }] };
    const { band } = loaderData;
    return {
      meta: [
        { title: `${band.name} — IndieBanca` },
        { name: "description", content: (band.bio ?? "").slice(0, 155) },
        { property: "og:title", content: `${band.name} — IndieBanca` },
        { property: "og:description", content: (band.bio ?? "").slice(0, 155) },
        ...(band.cover_url ? [{ property: "og:image" as const, content: band.cover_url }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-32 text-center">
      <h1 className="font-display text-2xl font-bold">Banda não encontrada</h1>
      <p className="mt-2 text-muted-foreground">Talvez ela tenha mudado de nome.</p>
      <Link to="/explorar">
        <Button className="mt-6">Explorar bandas</Button>
      </Link>
    </div>
  ),
  component: BandProfile,
});

const monthLabels = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function toTrack(song: Song, band: { name: string; slug: string; avatar_url: string | null }) {
  return {
    id: song.id,
    title: song.title,
    album: song.album,
    coverUrl: song.cover_url,
    audioUrl: song.audio_url ?? song.external_url,
    bandName: band.name,
    bandSlug: band.slug,
    bandAvatar: band.avatar_url,
  };
}

function SongRow({
  song,
  onPlay,
  isCurrent,
}: {
  song: Song;
  onPlay: () => void;
  isCurrent: boolean;
}) {
  const playable = isPlayableAudioUrl(song.audio_url ?? song.external_url);
  return (
    <div className="card-hover flex items-center gap-4 rounded-xl border border-border bg-card p-3">
      <div className="group relative shrink-0">
        <img
          src={song.cover_url ?? "https://picsum.photos/seed/cover/200/200"}
          alt={song.title}
          loading="lazy"
          className="size-14 rounded-lg object-cover"
        />
        {playable && (
          <button
            onClick={onPlay}
            aria-label={`Tocar ${song.title}`}
            className="absolute inset-0 grid place-items-center rounded-lg bg-background/50 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <Play className="size-5 fill-current" />
          </button>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate font-medium ${isCurrent ? "text-brand" : ""}`}>{song.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {song.album} • {song.year}
        </p>
      </div>
      <span className="text-xs text-muted-foreground">{song.duration}</span>
      {song.external_url && !playable && (
        <a
          href={song.external_url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-brand hover:underline"
        >
          Ouvir
        </a>
      )}
    </div>
  );
}

function BandProfile() {
  const params = Route.useParams();
  const { data } = useSuspenseQuery(bandQuery(params.slug));
  const { user } = useAuth();
  const { playTrack, current } = usePlayer();
  const qc = useQueryClient();
  const [following, setFollowing] = useState(false);
  const [tab, setTab] = useState("sobre");
  const loadedBand = data?.band;

  const followMutation = useMutation({
    mutationFn: () => {
      if (!loadedBand) throw new Error("Banda não encontrada.");
      return toggleFollow({ data: { band_id: loadedBand.id } });
    },
    onSuccess: (res) => {
      setFollowing(res.following);
      toast.success(res.following ? `Seguindo ${loadedBand?.name}` : "Deixou de seguir");
      qc.invalidateQueries({ queryKey: ["band", loadedBand?.slug] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!data) return null;
  const { band, songs, albums, products, events, posts, followers } = data;

  const followersDisplay = followers + (following ? 1 : 0);
  const featuredSong = songs[0];
  const bandTracks = songs
    .filter((s) => isPlayableAudioUrl(s.audio_url ?? s.external_url))
    .map((s) => toTrack(s, band));
  const nextEvent =
    events.find((e) => e.event_date >= new Date().toISOString().slice(0, 10)) ?? events[0];
  const previewProducts = products.slice(0, 3);
  const latestPost = posts[0];
  const socials = (Array.isArray(band.socials) ? band.socials : []) as BandSocial[];
  const cover = band.cover_url || "https://picsum.photos/seed/cover/1600/600";
  const avatar = band.avatar_url || "https://picsum.photos/seed/avatar/400/400";

  return (
    <div>
      <div className="relative h-48 w-full sm:h-64 lg:h-80">
        <img src={cover} alt={`Capa de ${band.name}`} className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative z-10 -mt-16 flex flex-col gap-5 sm:-mt-20 sm:flex-row sm:items-end">
          <img
            src={avatar}
            alt={band.name}
            className="size-28 shrink-0 rounded-2xl border-4 border-background object-cover shadow-elevated sm:size-36"
          />
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:pb-2">
            <div className="min-w-0">
              <Badge className="border-0 bg-accent text-brand">{band.type}</Badge>
              <h1 className="mt-2 flex items-center gap-2 font-display text-3xl font-bold sm:text-4xl">
                {band.name}
                {band.verified && (
                  <BadgeCheck className="size-7 text-brand" aria-label="Banda verificada" />
                )}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-4" /> {band.city}, {band.state}
                </span>
                <span className="flex items-center gap-1">
                  <Music2 className="size-4" /> {band.genre}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="size-4" /> {formatNumber(followersDisplay)} seguidores
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="icon" aria-label={s.label}>
                    {s.label === "Instagram" ? (
                      <Instagram className="size-4" />
                    ) : s.label === "YouTube" ? (
                      <Youtube className="size-4" />
                    ) : (
                      <Music2 className="size-4" />
                    )}
                  </Button>
                </a>
              ))}
              <Button
                onClick={() => {
                  if (!user) {
                    toast.info("Entre para seguir bandas");
                    return;
                  }
                  followMutation.mutate();
                }}
                className={
                  following
                    ? "gap-2"
                    : "gap-2 bg-gradient-brand text-brand-foreground hover:opacity-90"
                }
                variant={following ? "outline" : "default"}
              >
                {following ? <Check className="size-4" /> : <UserPlus className="size-4" />}
                {following ? "Seguindo" : "Seguir"}
              </Button>
              {band.support_enabled && band.verified && (
                <SupportDialog bandId={band.id} bandName={band.name} signedIn={Boolean(user)} />
              )}
              {!band.verified && (
                <ClaimDialog bandId={band.id} bandName={band.name} signedIn={Boolean(user)} />
              )}
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-10">
          <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-card p-1">
            {["sobre", "musicas", "loja", "publicacoes", "eventos"].map((t) => (
              <TabsTrigger key={t} value={t} className="capitalize">
                {t === "musicas" ? "Músicas" : t === "publicacoes" ? "Publicações" : t}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="sobre" className="py-8">
            <div className="grid gap-5 lg:grid-cols-12">
              <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-accent/30 p-7 sm:p-9 lg:col-span-8">
                <div className="absolute -right-12 -top-12 size-48 rounded-full bg-gradient-brand opacity-20 blur-3xl" />
                <div className="relative">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-brand">
                    <Sparkles className="size-3.5" /> Sobre {band.name}
                  </span>
                  <p className="mt-4 font-display text-2xl leading-snug sm:text-3xl">
                    “{(band.bio || band.name).split(". ")[0]}.”
                  </p>
                  <p className="mt-4 leading-relaxed text-muted-foreground">
                    {(band.bio || "").split(". ").slice(1).join(". ")}
                  </p>
                </div>
              </section>

              <aside className="grid grid-cols-2 gap-4 lg:col-span-4 lg:grid-cols-1">
                <div className="rounded-3xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <Headphones className="size-3.5" /> Ouvintes mensais
                  </div>
                  <p className="mt-2 font-display text-3xl font-bold">
                    {formatNumber(band.monthly_listeners)}
                  </p>
                </div>
                <div className="rounded-3xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <Users className="size-3.5" /> Seguidores
                  </div>
                  <p className="mt-2 font-display text-3xl font-bold">
                    {formatNumber(followersDisplay)}
                  </p>
                </div>
                <div className="col-span-2 rounded-3xl border border-border bg-card p-5 lg:col-span-1">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <MapPin className="size-3.5" /> Onde encontrar
                  </div>
                  <p className="mt-2 font-medium">
                    {band.city}, {band.state}
                  </p>
                  <p className="text-sm text-muted-foreground">{band.country}</p>
                </div>
              </aside>

              {featuredSong && (
                <section className="group relative overflow-hidden rounded-3xl border border-border bg-card lg:col-span-7">
                  <div
                    className="absolute inset-0 opacity-40 blur-2xl"
                    style={{
                      backgroundImage: `url(${featuredSong.cover_url ?? cover})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-card via-card/85 to-card/40" />
                  <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-7">
                    <div className="relative shrink-0">
                      <img
                        src={featuredSong.cover_url ?? cover}
                        alt={featuredSong.title}
                        className="size-32 rounded-2xl object-cover shadow-elevated sm:size-36"
                      />
                      <button
                        aria-label="Tocar faixa em destaque"
                        onClick={() => playTrack(toTrack(featuredSong, band), bandTracks)}
                        className="absolute inset-0 grid place-items-center rounded-2xl bg-background/30 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                      >
                        <span className="grid size-12 place-items-center rounded-full bg-gradient-brand text-brand-foreground shadow-elevated">
                          <Play className="size-5 fill-current" />
                        </span>
                      </button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium uppercase tracking-wider text-brand">
                        Faixa em destaque
                      </span>
                      <h3 className="mt-1 truncate font-display text-2xl font-bold">
                        {featuredSong.title}
                      </h3>
                      <p className="truncate text-sm text-muted-foreground">
                        {featuredSong.album} • {featuredSong.year}
                      </p>
                      <button
                        onClick={() => setTab("musicas")}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                      >
                        Ver discografia <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {nextEvent && (
                <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand/15 via-card to-card p-6 sm:p-7 lg:col-span-5">
                  <span className="text-xs font-medium uppercase tracking-wider text-brand">
                    Próximo show
                  </span>
                  <div className="mt-4 flex items-start gap-4">
                    <div className="grid w-20 shrink-0 place-items-center rounded-2xl bg-gradient-brand py-3 text-brand-foreground shadow-elevated">
                      <span className="font-display text-3xl font-bold leading-none">
                        {nextEvent.event_date.split("-")[2]}
                      </span>
                      <span className="text-xs uppercase tracking-wider">
                        {monthLabels[Number(nextEvent.event_date.split("-")[1]) - 1]}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xl font-bold leading-tight">
                        {nextEvent.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" /> {nextEvent.event_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3.5" /> {nextEvent.venue}, {nextEvent.city}
                        </span>
                      </div>
                      <button
                        onClick={() => setTab("eventos")}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                      >
                        Todos os shows <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {previewProducts.length > 0 && (
                <section className="rounded-3xl border border-border bg-card p-6 sm:p-7 lg:col-span-7">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <span className="text-xs font-medium uppercase tracking-wider text-brand">
                        Da loja
                      </span>
                      <h3 className="mt-1 font-display text-xl font-bold">
                        Leve um pedaço da banda
                      </h3>
                    </div>
                    <button
                      onClick={() => setTab("loja")}
                      className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                    >
                      <ShoppingBag className="size-3.5" /> Ver loja
                    </button>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {previewProducts.map((p: Product) => (
                      <button
                        key={p.id}
                        onClick={() => setTab("loja")}
                        className="group/item text-left"
                      >
                        <div className="overflow-hidden rounded-2xl border border-border bg-background">
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={p.image_url ?? "https://picsum.photos/seed/product/400/400"}
                              alt={p.name}
                              loading="lazy"
                              className="size-full object-cover transition-transform duration-500 group-hover/item:scale-105"
                            />
                          </div>
                        </div>
                        <p className="mt-2 truncate text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          R$ {Number(p.price).toFixed(2).replace(".", ",")}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {latestPost && (
                <section className="flex flex-col rounded-3xl border border-border bg-card p-6 sm:p-7 lg:col-span-5">
                  <span className="text-xs font-medium uppercase tracking-wider text-brand">
                    Última publicação
                  </span>
                  <div className="mt-4 flex items-center gap-3">
                    <img
                      src={avatar}
                      alt={band.name}
                      className="size-10 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{band.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {relativeTime(latestPost.created_at)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                    {latestPost.content}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Heart className="size-3.5" /> publicação recente
                    </span>
                    <button
                      onClick={() => setTab("publicacoes")}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
                    >
                      Ver feed <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </section>
              )}
            </div>
          </TabsContent>

          <TabsContent value="musicas" className="space-y-8 py-8">
            {albums.map((album) => {
              const albumSongs = songs
                .filter((song) => song.album_id === album.id)
                .sort((a, b) => (a.track_number ?? a.position) - (b.track_number ?? b.position));
              const tracks = albumSongs
                .filter((song) => isPlayableAudioUrl(song.audio_url ?? song.external_url))
                .map((song) => toTrack(song, band));
              return (
                <section
                  key={album.id}
                  className="grid gap-5 border-b border-border pb-8 sm:grid-cols-[180px_1fr]"
                >
                  <div>
                    <img
                      src={album.cover_url ?? cover}
                      alt={album.title}
                      className="aspect-square w-full rounded-xl object-cover"
                    />
                    <h2 className="mt-3 font-display text-xl font-bold">{album.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {album.type} • {album.release_year}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        disabled={!tracks.length}
                        onClick={() => tracks[0] && playTrack(tracks[0], tracks, { shuffle: false })}
                      >
                        <Play className="mr-1 size-4" /> Na ordem
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        disabled={!tracks.length}
                        onClick={() => {
                          const random = [...tracks].sort(() => Math.random() - 0.5);
                          if (random[0]) playTrack(random[0], random, { shuffle: false });
                        }}
                        aria-label="Tocar álbum aleatoriamente"
                      >
                        <Shuffle className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {albumSongs.map((song) => (
                      <SongRow
                        key={song.id}
                        song={song}
                        isCurrent={current?.id === song.id}
                        onPlay={() => playTrack(toTrack(song, band), tracks)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
            {songs
              .filter((song) => !song.album_id)
              .map((song) => (
                <SongRow
                  key={song.id}
                  song={song}
                  isCurrent={current?.id === song.id}
                  onPlay={() => playTrack(toTrack(song, band), bandTracks)}
                />
              ))}
            {songs.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma música publicada ainda.</p>
            )}
          </TabsContent>

          <TabsContent value="loja" className="py-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} bandName={band.name} />
              ))}
              {products.length === 0 && (
                <p className="text-sm text-muted-foreground">Loja em construção.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="publicacoes" className="py-8">
            <div className="mx-auto max-w-2xl space-y-5">
              {posts.map((post: Post) => (
                <PostCard
                  key={post.id}
                  post={{
                    id: post.id,
                    content: post.content,
                    image_url: post.image_url,
                    type: post.type,
                    created_at: post.created_at,
                    author: { name: band.name, avatar_url: band.avatar_url },
                  }}
                />
              ))}
              {posts.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma publicação ainda.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="eventos" className="py-8">
            <div className="space-y-4">
              {events.map((ev: BandEvent) => (
                <div
                  key={ev.id}
                  className="card-hover flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center"
                >
                  <div className="grid w-16 shrink-0 place-items-center rounded-xl bg-gradient-brand py-3 text-brand-foreground">
                    <span className="font-display text-2xl font-bold leading-none">
                      {ev.event_date.split("-")[2]}
                    </span>
                    <span className="text-xs uppercase">
                      {monthLabels[Number(ev.event_date.split("-")[1]) - 1]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{ev.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{ev.description}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" /> {ev.event_time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" /> {ev.venue}, {ev.city}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" className="gap-2 sm:shrink-0">
                    <CalendarDays className="size-4" /> Tenho interesse
                  </Button>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum show agendado.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SupportDialog({
  bandId,
  bandName,
  signedIn,
}: {
  bandId: string;
  bandName: string;
  signedIn: boolean;
}) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("10");
  const [message, setMessage] = useState("");
  const intent = useMutation({
    mutationFn: () =>
      createTipIntent({
        data: {
          band_id: bandId,
          supporter_name: user?.user_metadata?.display_name ?? "Apoiador",
          supporter_email: user?.email ?? "",
          amount: Number(amount),
          message,
        },
      }),
    onSuccess: (result) => toast.info(result.message),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <HandHeart className="size-4" /> Apoiar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apoiar {bandName}</DialogTitle>
          <DialogDescription>
            Pix e cartão ainda não estão disponíveis. Nenhuma cobrança será feita.
          </DialogDescription>
        </DialogHeader>
        {signedIn ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              intent.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="support-amount">Valor (R$)</Label>
              <Input
                id="support-amount"
                type="number"
                min="1"
                max="10000"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="support-message">Mensagem (opcional)</Label>
              <Textarea
                id="support-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={500}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={intent.isPending || !Number(amount)}>
                {intent.isPending ? "Verificando..." : "Verificar disponibilidade"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <Link to="/auth" className="text-sm text-brand hover:underline">
            Entre para continuar
          </Link>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ClaimDialog({
  bandId,
  bandName,
  signedIn,
}: {
  bandId: string;
  bandName: string;
  signedIn: boolean;
}) {
  const [claimedRole, setClaimedRole] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [evidence, setEvidence] = useState("");
  const claim = useMutation({
    mutationFn: () =>
      createClaim({
        data: { band_id: bandId, claimed_role: claimedRole, official_url: officialUrl, evidence },
      }),
    onSuccess: () =>
      toast.success("Solicitação registrada. A análise administrativa ainda não está disponível."),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ShieldCheck className="size-4" /> Reivindicar esta banda
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reivindicar {bandName}</DialogTitle>
          <DialogDescription>
            Informe sua relação com a banda e links que ajudem a confirmar a solicitação.
          </DialogDescription>
        </DialogHeader>
        {signedIn ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              claim.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="claim-role">Sua função na banda</Label>
              <Input
                id="claim-role"
                value={claimedRole}
                onChange={(event) => setClaimedRole(event.target.value)}
                minLength={2}
                maxLength={80}
                required
              />
            </div>
            <div>
              <Label htmlFor="claim-url">Link oficial</Label>
              <Input
                id="claim-url"
                type="url"
                value={officialUrl}
                onChange={(event) => setOfficialUrl(event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="claim-evidence">Evidências</Label>
              <Textarea
                id="claim-evidence"
                value={evidence}
                onChange={(event) => setEvidence(event.target.value)}
                minLength={20}
                maxLength={2000}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={claim.isPending || evidence.trim().length < 20}>
                {claim.isPending ? "Enviando..." : "Enviar solicitação"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <Link to="/auth" className="text-sm text-brand hover:underline">
            Entre para enviar uma solicitação
          </Link>
        )}
      </DialogContent>
    </Dialog>
  );
}