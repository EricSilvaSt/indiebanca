import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Music2,
  ShoppingBag,
  CalendarDays,
  Newspaper,
  Receipt,
  Trash2,
  Plus,
  ExternalLink,
  Upload,
  Users,
  HandHeart,
  BadgeCheck,
  Disc3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBRL, formatNumber } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { getMyBand, getMyBands, upsertMyBand, getBandBySlug } from "@/lib/bands.functions";
import { createSong, deleteSong } from "@/lib/songs.functions";
import { createProduct, deleteProduct } from "@/lib/products.functions";
import { createEvent, deleteEvent } from "@/lib/events.functions";
import { createPost, deletePost } from "@/lib/posts.functions";
import { listMyOrders } from "@/lib/orders.functions";
import { listFeedPosts } from "@/lib/posts.functions";
import { PostCard } from "@/components/PostCard";
import { uploadAudio, uploadMedia } from "@/lib/upload";
import {
  acceptBandInvitation,
  createAlbum,
  getBandManagement,
  inviteBandMember,
  listMyInvitations,
  setBandSupport,
} from "@/lib/community.functions";
import {
  ARTIST_TYPES,
  GENRES,
  PRODUCT_CATEGORIES,
  type ArtistType,
  type Genre,
  type ProductCategory,
} from "@/lib/enums";

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: typeof search.tab === "string" ? search.tab : "overview",
    ...(typeof search.band === "string" ? { band: search.band } : {}),
  }),
  head: () => ({ meta: [{ title: "Painel — IndieBanca" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { tab, band: selectedBand } = Route.useSearch();

  const myBand = useQuery({
    queryKey: ["my-band", selectedBand],
    queryFn: () => getMyBand({ data: { band_id: selectedBand } }),
  });
  const myBands = useQuery({ queryKey: ["my-bands"], queryFn: () => getMyBands() });
  const myOrders = useQuery({ queryKey: ["my-orders"], queryFn: () => listMyOrders() });
  const profile = useQuery({
    queryKey: ["band-profile", myBand.data?.slug],
    queryFn: () => (myBand.data ? getBandBySlug({ data: { slug: myBand.data.slug } }) : null),
    enabled: Boolean(myBand.data?.slug),
  });

  const setTab = (value: string) =>
    navigate({
      to: "/dashboard",
      search: (previous) => ({ tab: value, ...(previous.band ? { band: previous.band } : {}) }),
    });

  const band = myBand.data;
  const bandData = profile.data;
  const role = band?.membership_role;
  const isManager = role === "owner" || role === "admin";
  const canManageContent = isManager || role === "editor";

  if (myBand.isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground">
        Carregando seu espaço...
      </div>
    );
  }
  if (myBand.isError) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center text-sm text-destructive">
        Não foi possível carregar seu perfil e suas permissões.
      </div>
    );
  }
  if (!band) {
    return (
      <FanDashboard
        orders={myOrders.data ?? []}
        displayName={user?.user_metadata?.display_name ?? user?.email ?? "fã"}
      />
    );
  }

  return (
    <div>
      <InvitationsPanel
        onAccepted={(bandId) => {
          qc.invalidateQueries({ queryKey: ["my-band"] });
          qc.invalidateQueries({ queryKey: ["my-bands"] });
          navigate({ to: "/dashboard", search: { tab: "overview", band: bandId } });
        }}
      />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Olá, {user?.user_metadata?.display_name ?? user?.email}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isManager
              ? "Gerencie sua banda, conteúdo, equipe e pedidos."
              : role === "editor"
                ? `Você pode publicar e atualizar conteúdo de ${band.name}.`
                : `Você integra ${band.name} com acesso de leitura.`}
          </p>
        </div>
        {band && (
          <div className="flex flex-wrap items-center gap-2">
            {(myBands.data?.length ?? 0) > 1 && (
              <Select
                value={band.id}
                onValueChange={(bandId) =>
                  navigate({
                    to: "/dashboard",
                    search: (previous) => ({ tab: previous.tab ?? "overview", band: bandId }),
                  })
                }
              >
                <SelectTrigger aria-label="Selecionar banda" className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {myBands.data?.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name} · {option.membership_role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Link to="/banda/$slug" params={{ slug: band.slug }}>
              <Button variant="outline" className="gap-2">
                Ver perfil público <ExternalLink className="size-4" />
              </Button>
            </Link>
          </div>
        )}
      </header>

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-card p-1 lg:hidden">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          {(!band || isManager) && <TabsTrigger value="banda">Banda</TabsTrigger>}
          {(!band || canManageContent) && (
            <>
              <TabsTrigger value="musicas">Músicas</TabsTrigger>
              <TabsTrigger value="produtos">Produtos</TabsTrigger>
              <TabsTrigger value="eventos">Eventos</TabsTrigger>
              <TabsTrigger value="publicacoes">Publicações</TabsTrigger>
            </>
          )}
          {isManager && (
            <>
              <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
              <TabsTrigger value="integrantes">Integrantes</TabsTrigger>
              <TabsTrigger value="apoios">Apoios</TabsTrigger>
              <TabsTrigger value="verificacao">Verificação</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="overview" className="py-8">
          {
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={Music2} label="Músicas" value={bandData?.songs.length ?? 0} />
              <StatCard
                icon={ShoppingBag}
                label="Produtos"
                value={bandData?.products.length ?? 0}
              />
              <StatCard icon={CalendarDays} label="Eventos" value={bandData?.events.length ?? 0} />
              <StatCard icon={Newspaper} label="Publicações" value={bandData?.posts.length ?? 0} />
              <StatCard
                icon={Receipt}
                label="Pedidos"
                value={myOrders.data?.length ?? 0}
                className="sm:col-span-2"
              />
              <StatCard
                icon={Music2}
                label="Ouvintes mensais"
                value={formatNumber(band.monthly_listeners)}
                className="sm:col-span-2"
              />
            </div>
          }
        </TabsContent>

        <TabsContent value="banda" className="py-8">
          {!band || isManager ? (
            <BandForm
              initial={band}
              bandId={band.id}
              onSaved={() => {
                qc.invalidateQueries({ queryKey: ["my-band"] });
                qc.invalidateQueries({ queryKey: ["bands"] });
              }}
            />
          ) : (
            <ReadOnlyNotice role={role} />
          )}
        </TabsContent>

        <TabsContent value="musicas" className="py-8">
          {band && canManageContent ? (
            <SongsPanel
              bandId={band.id}
              albums={bandData?.albums ?? []}
              songs={bandData?.songs ?? []}
              onChange={() => qc.invalidateQueries({ queryKey: ["band-profile", band.slug] })}
            />
          ) : band ? (
            <ReadOnlyNotice role={role} />
          ) : (
            <EmptyBand onCreate={() => setTab("banda")} />
          )}
        </TabsContent>

        <TabsContent value="produtos" className="py-8">
          {band && canManageContent ? (
            <ProductsPanel
              bandId={band.id}
              products={bandData?.products ?? []}
              onChange={() => qc.invalidateQueries({ queryKey: ["band-profile", band.slug] })}
            />
          ) : band ? (
            <ReadOnlyNotice role={role} />
          ) : (
            <EmptyBand onCreate={() => setTab("banda")} />
          )}
        </TabsContent>

        <TabsContent value="eventos" className="py-8">
          {band && canManageContent ? (
            <EventsPanel
              bandId={band.id}
              events={bandData?.events ?? []}
              onChange={() => qc.invalidateQueries({ queryKey: ["band-profile", band.slug] })}
            />
          ) : band ? (
            <ReadOnlyNotice role={role} />
          ) : (
            <EmptyBand onCreate={() => setTab("banda")} />
          )}
        </TabsContent>

        <TabsContent value="publicacoes" className="py-8">
          {band && canManageContent ? (
            <PostsPanel
              bandId={band.id}
              posts={bandData?.posts ?? []}
              onChange={() => qc.invalidateQueries({ queryKey: ["band-profile", band.slug] })}
            />
          ) : band ? (
            <ReadOnlyNotice role={role} />
          ) : (
            <EmptyBand onCreate={() => setTab("banda")} />
          )}
        </TabsContent>

        <TabsContent value="pedidos" className="py-8">
          <OrdersPanel orders={myOrders.data ?? []} />
        </TabsContent>
        <TabsContent value="integrantes" className="py-8">
          {band && isManager ? (
            <MembersPanel bandId={band.id} />
          ) : band ? (
            <ReadOnlyNotice role={role} />
          ) : (
            <EmptyBand onCreate={() => setTab("banda")} />
          )}
        </TabsContent>
        <TabsContent value="apoios" className="py-8">
          {band && isManager ? (
            <SupportPanel band={band} />
          ) : band ? (
            <ReadOnlyNotice role={role} />
          ) : (
            <EmptyBand onCreate={() => setTab("banda")} />
          )}
        </TabsContent>
        <TabsContent value="verificacao" className="py-8">
          {band && isManager ? (
            <VerificationPanel band={band} />
          ) : band ? (
            <ReadOnlyNotice role={role} />
          ) : (
            <EmptyBand onCreate={() => setTab("banda")} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </div>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

function ReadOnlyNotice({ role }: { role?: string }) {
  const roleName = role === "member" ? "integrante da banda" : "usuário";
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-semibold">Área de leitura</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Seu papel de {roleName} não permite alterar esta área. As permissões são verificadas também
        no servidor e no banco.
      </p>
    </section>
  );
}

function FanDashboard({
  orders,
  displayName,
}: {
  orders: Awaited<ReturnType<typeof listMyOrders>>;
  displayName: string;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [creatingBand, setCreatingBand] = useState(false);
  const feed = useQuery({
    queryKey: ["feed", "latest"],
    queryFn: () => listFeedPosts(),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-sm font-medium text-brand">Seu espaço IndieBanca</p>
          <h1 className="mt-2 font-display text-3xl font-bold">Oi, {displayName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Novidades dos artistas e bandas independentes.
          </p>
        </div>
        <Link to="/explorar">
          <Button className="gap-2">
            Descobrir bandas <ExternalLink className="size-4" />
          </Button>
        </Link>
      </header>
      {creatingBand && (
        <BandForm
          initial={undefined}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["my-band"] });
            setCreatingBand(false);
          }}
        />
      )}
      <InvitationsPanel
        onAccepted={(bandId) => {
          queryClient.invalidateQueries({ queryKey: ["my-band"] });
          queryClient.invalidateQueries({ queryKey: ["my-bands"] });
          navigate({ to: "/dashboard", search: { tab: "overview", band: bandId } });
        }}
      />
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          <div className="flex items-end justify-between gap-4 border-b border-border pb-3">
            <div>
              <h2 className="font-display text-xl font-bold">Feed da cena</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Publicações recentes de artistas.
              </p>
            </div>
            <Link to="/feed" className="text-sm font-medium text-brand hover:underline">
              Ver tudo
            </Link>
          </div>
          <div className="mt-5 space-y-4">
            {(feed.data ?? []).slice(0, 8).map((post) => (
              <PostCard
                key={post.id}
                post={{
                  id: post.id,
                  content: post.content,
                  image_url: post.image_url,
                  type: post.type,
                  created_at: post.created_at,
                  likes: post.likes,
                  author: post.band,
                }}
              />
            ))}
            {!feed.isLoading && !feed.data?.length && (
              <p className="border-y border-border py-10 text-center text-sm text-muted-foreground">
                As primeiras novidades aparecem aqui em breve.
              </p>
            )}
          </div>
        </div>
        <aside className="border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <h2 className="font-display text-xl font-bold">Suas compras</h2>
          <div className="mt-4">
            <OrdersPanel orders={orders} />
          </div>
          <Button
            variant="link"
            className="mt-6 h-auto whitespace-normal p-0 text-left text-sm text-muted-foreground"
            onClick={() => setCreatingBand((visible) => !visible)}
          >
            Você também faz música? Crie seu perfil de artista.
          </Button>
        </aside>
      </section>
    </div>
  );
}

function InvitationsPanel({ onAccepted }: { onAccepted: (bandId: string) => void }) {
  const queryClient = useQueryClient();
  const invitations = useQuery({
    queryKey: ["my-invitations"],
    queryFn: () => listMyInvitations(),
  });
  const accept = useMutation({
    mutationFn: (invitationId: string) =>
      acceptBandInvitation({ data: { invitation_id: invitationId } }),
    onSuccess: (result) => {
      toast.success("Convite aceito. Você já pode acessar o painel da banda.");
      queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
      onAccepted(result.band_id);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (invitations.isError || !invitations.data?.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-semibold">Convites para bandas</h2>
      {invitations.data.map((invitation) => (
        <div
          key={invitation.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
        >
          <div>
            <p className="font-medium">{invitation.bands?.name ?? "Banda"}</p>
            <p className="text-xs text-muted-foreground">Papel: {invitation.role}</p>
          </div>
          <Button disabled={accept.isPending} onClick={() => accept.mutate(invitation.id)}>
            Aceitar convite
          </Button>
        </div>
      ))}
    </section>
  );
}

function EmptyBand({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-12 text-center">
      <h2 className="font-display text-xl font-bold">Crie o perfil da sua banda</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Antes de publicar conteúdo, configure as informações da banda.
      </p>
      <Button
        onClick={onCreate}
        className="mt-5 bg-gradient-brand text-brand-foreground hover:opacity-90"
      >
        Configurar banda
      </Button>
    </div>
  );
}

function BandForm({
  initial,
  bandId,
  onSaved,
}: {
  initial: Awaited<ReturnType<typeof getMyBand>> | undefined;
  bandId?: string;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    type: (initial?.type ?? "Banda") as ArtistType,
    genre: (initial?.genre ?? "Rock") as Genre,
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    country: initial?.country ?? "Brasil",
    bio: initial?.bio ?? "",
    avatar_url: initial?.avatar_url ?? null,
    cover_url: initial?.cover_url ?? null,
  });

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name,
        type: initial.type as ArtistType,
        genre: initial.genre as Genre,
        city: initial.city,
        state: initial.state,
        country: initial.country,
        bio: initial.bio ?? "",
        avatar_url: initial.avatar_url,
        cover_url: initial.cover_url,
      });
    }
  }, [initial]);

  const save = useMutation({
    mutationFn: () => upsertMyBand({ data: { ...form, ...(bandId ? { band_id: bandId } : {}) } }),
    onSuccess: () => {
      toast.success("Banda salva!");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleUpload = async (file: File, kind: "avatar" | "cover") => {
    if (!user) return;
    try {
      const url = await uploadMedia(file, { userId: user.id, folder: kind });
      setForm((f) => ({ ...f, [`${kind}_url`]: url }));
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="space-y-6 rounded-2xl border border-border bg-card p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="band-name">Nome</Label>
          <Input
            id="band-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Tipo</Label>
          <Select
            value={form.type}
            onValueChange={(v: ArtistType) => setForm({ ...form, type: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ARTIST_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Gênero</Label>
          <Select value={form.genre} onValueChange={(v: Genre) => setForm({ ...form, genre: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GENRES.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="country">País</Label>
          <Input
            id="country"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={5}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageField
          label="Avatar"
          url={form.avatar_url}
          onPick={(file) => handleUpload(file, "avatar")}
        />
        <ImageField
          label="Capa"
          url={form.cover_url}
          onPick={(file) => handleUpload(file, "cover")}
          aspect="aspect-[16/6]"
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={save.isPending}
          className="bg-gradient-brand text-brand-foreground hover:opacity-90"
        >
          {save.isPending ? "Salvando..." : "Salvar banda"}
        </Button>
      </div>
    </form>
  );
}

function ImageField({
  label,
  url,
  onPick,
  aspect = "aspect-square",
}: {
  label: string;
  url: string | null;
  onPick: (file: File) => void;
  aspect?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div
        className={`${aspect} mt-1 overflow-hidden rounded-xl border border-dashed border-border bg-secondary`}
      >
        {url ? (
          <img src={url} alt={label} className="size-full object-cover" />
        ) : (
          <div className="grid size-full place-items-center text-xs text-muted-foreground">
            Sem imagem
          </div>
        )}
      </div>
      <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">
        <Upload className="size-3.5" /> Enviar imagem
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
          }}
        />
      </label>
    </div>
  );
}

function SongsPanel({
  bandId,
  albums,
  songs,
  onChange,
}: {
  bandId: string;
  albums: NonNullable<Awaited<ReturnType<typeof getBandBySlug>>>["albums"];
  songs: NonNullable<Awaited<ReturnType<typeof getBandBySlug>>>["songs"];
  onChange: () => void;
}) {
  const { user } = useAuth();
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumType, setAlbumType] = useState<"Álbum" | "EP" | "Single" | "Ao vivo" | "Coletânea">(
    "Álbum",
  );
  const [albumYear, setAlbumYear] = useState(new Date().getFullYear());
  const [albumCover, setAlbumCover] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [albumId, setAlbumId] = useState("none");
  const [trackNumber, setTrackNumber] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [duration, setDuration] = useState("3:30");
  const [externalUrl, setExternalUrl] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const createAlbumMutation = useMutation({
    mutationFn: () =>
      createAlbum({
        data: {
          band_id: bandId,
          title: albumTitle,
          type: albumType,
          cover_url: albumCover,
          release_year: albumYear,
        },
      }),
    onSuccess: () => {
      toast.success("Lançamento criado");
      setAlbumTitle("");
      setAlbumCover(null);
      onChange();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const create = useMutation({
    mutationFn: async () => {
      if (audioFile && !user) throw new Error("Entre novamente para enviar o áudio.");
      const audioUrl = audioFile && user ? await uploadAudio(audioFile, { userId: user.id }) : null;
      const selectedAlbum = albums.find((item) => item.id === albumId);
      return createSong({
        data: {
          band_id: bandId,
          title,
          album: selectedAlbum?.title ?? "Single",
          year: selectedAlbum?.release_year ?? year,
          duration,
          album_id: selectedAlbum?.id ?? null,
          track_number: trackNumber ? Number(trackNumber) : null,
          audio_url: audioUrl,
          external_url: externalUrl || null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Música adicionada");
      setTitle("");
      setTrackNumber("");
      setExternalUrl("");
      setAudioFile(null);
      onChange();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteSong({ data: { id } }),
    onSuccess: () => {
      toast.success("Música removida");
      onChange();
    },
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          createAlbumMutation.mutate();
        }}
        className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-5"
      >
        <div className="sm:col-span-2">
          <Label htmlFor="album-title">Nome do lançamento</Label>
          <Input
            id="album-title"
            value={albumTitle}
            onChange={(event) => setAlbumTitle(event.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="album-type">Formato</Label>
          <Select
            value={albumType}
            onValueChange={(value: typeof albumType) => setAlbumType(value)}
          >
            <SelectTrigger id="album-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["Álbum", "EP", "Single", "Ao vivo", "Coletânea"] as const).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="album-year">Ano</Label>
          <Input
            id="album-year"
            type="number"
            min="1900"
            max="2100"
            value={albumYear}
            onChange={(event) => setAlbumYear(Number(event.target.value))}
          />
        </div>
        <div className="sm:col-span-2">
          <ImageField
            label="Capa do lançamento"
            url={albumCover}
            onPick={async (file) => {
              if (!user) return toast.error("Entre novamente para enviar a capa.");
              try {
                setAlbumCover(await uploadMedia(file, { userId: user.id, folder: "albums" }));
              } catch (error) {
                toast.error((error as Error).message);
              }
            }}
          />
        </div>
        <div className="flex items-end sm:col-span-3 sm:justify-end">
          <Button type="submit" disabled={createAlbumMutation.isPending || !albumTitle.trim()}>
            <Disc3 className="mr-2 size-4" />
            {createAlbumMutation.isPending ? "Salvando..." : "Criar álbum, EP ou single"}
          </Button>
        </div>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-6"
      >
        <div className="sm:col-span-2">
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <Label>Álbum</Label>
          <Select value={albumId} onValueChange={(value) => setAlbumId(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Single sem álbum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Single sem álbum</SelectItem>
              {albums.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.title} ({item.release_year})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Ano</Label>
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
        </div>
        <div>
          <Label>Duração</Label>
          <Input
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="3:30"
          />
        </div>
        <div>
          <Label>Número da faixa</Label>
          <Input
            type="number"
            min="1"
            max="999"
            value={trackNumber}
            onChange={(event) => setTrackNumber(event.target.value)}
          />
        </div>
        <div className="sm:col-span-3">
          <Label htmlFor="song-audio">Arquivo de áudio (MP3 ou WAV)</Label>
          <Input
            id="song-audio"
            type="file"
            accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav"
            onChange={(event) => setAudioFile(event.target.files?.[0] ?? null)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Máximo de 50 MB. Você também pode informar um link externo.
          </p>
        </div>
        <div className="sm:col-span-5">
          <Label>Link externo (Spotify, YouTube...)</Label>
          <Input
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="sm:col-span-5">
          {audioFile && (
            <p className="text-xs text-muted-foreground">Arquivo selecionado: {audioFile.name}</p>
          )}
        </div>
        <div className="flex items-end sm:col-span-1">
          <Button
            type="submit"
            disabled={create.isPending || !title}
            className="w-full gap-1 bg-gradient-brand text-brand-foreground"
          >
            <Plus className="size-4" /> Adicionar
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        {albums.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm"
          >
            <span className="truncate">
              {item.title} · {item.type} · {item.release_year}
            </span>
            <Badge variant="outline">
              {songs.filter((song) => song.album_id === item.id).length} faixas
            </Badge>
          </div>
        ))}
        {songs.map((s) => (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{s.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {s.track_number ? `${s.track_number}. ` : ""}
                {s.album} • {s.year} • {s.duration} {s.audio_url ? "• Áudio enviado" : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => del.mutate(s.id)}
              aria-label="Remover"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {songs.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma música ainda.</p>
        )}
      </div>
    </div>
  );
}

function ProductsPanel({
  bandId,
  products,
  onChange,
}: {
  bandId: string;
  products: NonNullable<Awaited<ReturnType<typeof getBandBySlug>>>["products"];
  onChange: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("Camisetas");
  const [price, setPrice] = useState("89.90");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [onDemand, setOnDemand] = useState(true);
  const [stock, setStock] = useState(0);

  const create = useMutation({
    mutationFn: () =>
      createProduct({
        data: {
          band_id: bandId,
          name,
          category,
          price: Number(price),
          description,
          on_demand: onDemand,
          stock: onDemand ? null : stock,
          image_url: imageUrl,
        },
      }),
    onSuccess: () => {
      toast.success("Produto criado");
      setName("");
      setDescription("");
      setImageUrl(null);
      onChange();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteProduct({ data: { id } }),
    onSuccess: () => {
      toast.success("Produto removido");
      onChange();
    },
  });

  const handleUpload = async (file: File) => {
    if (!user) return;
    try {
      const url = await uploadMedia(file, { userId: user.id, folder: "products" });
      setImageUrl(url);
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2"
      >
        <div>
          <Label>Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label>Categoria</Label>
          <Select value={category} onValueChange={(v: ProductCategory) => setCategory(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Preço (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onDemand}
              onChange={(e) => setOnDemand(e.target.checked)}
            />
            Sob demanda
          </label>
          {!onDemand && (
            <Input
              type="number"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              placeholder="Estoque"
              className="w-32"
            />
          )}
        </div>
        <div className="sm:col-span-2">
          <Label>Descrição</Label>
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <ImageField label="Imagem" url={imageUrl} onPick={handleUpload} />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button
            type="submit"
            disabled={create.isPending || !name}
            className="gap-1 bg-gradient-brand text-brand-foreground"
          >
            <Plus className="size-4" /> Criar produto
          </Button>
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="aspect-square overflow-hidden rounded-xl bg-secondary">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="size-full object-cover" />
              ) : null}
            </div>
            <div className="mt-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.category} • {formatBRL(Number(p.price))}
                </p>
                {p.on_demand && (
                  <Badge className="mt-1 border-0 bg-brand-2/15 text-brand-2">Sob demanda</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => del.mutate(p.id)}
                aria-label="Remover"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum produto ainda.</p>
        )}
      </div>
    </div>
  );
}

function EventsPanel({
  bandId,
  events,
  onChange,
}: {
  bandId: string;
  events: NonNullable<Awaited<ReturnType<typeof getBandBySlug>>>["events"];
  onChange: () => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("20:00");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createEvent({
        data: {
          band_id: bandId,
          title,
          event_date: date,
          event_time: time,
          venue,
          city,
          description,
        },
      }),
    onSuccess: () => {
      toast.success("Evento criado");
      setTitle("");
      setDescription("");
      onChange();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteEvent({ data: { id } }),
    onSuccess: () => {
      toast.success("Evento removido");
      onChange();
    },
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-6"
      >
        <div className="sm:col-span-3">
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <Label>Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>Horário</Label>
          <Input value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="sm:col-span-3">
          <Label>Local</Label>
          <Input value={venue} onChange={(e) => setVenue(e.target.value)} />
        </div>
        <div className="sm:col-span-3">
          <Label>Cidade</Label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="sm:col-span-6">
          <Label>Descrição</Label>
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="sm:col-span-6 flex justify-end">
          <Button
            type="submit"
            disabled={create.isPending || !title}
            className="gap-1 bg-gradient-brand text-brand-foreground"
          >
            <Plus className="size-4" /> Criar evento
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{ev.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {ev.event_date} • {ev.event_time} • {ev.venue}, {ev.city}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => del.mutate(ev.id)}
              aria-label="Remover"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {events.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum evento agendado.</p>
        )}
      </div>
    </div>
  );
}

function PostsPanel({
  bandId,
  posts,
  onChange,
}: {
  bandId: string;
  posts: NonNullable<Awaited<ReturnType<typeof getBandBySlug>>>["posts"];
  onChange: () => void;
}) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      createPost({
        data: { band_id: bandId, content, image_url: imageUrl, type: "post" },
      }),
    onSuccess: () => {
      toast.success("Publicação criada");
      setContent("");
      setImageUrl(null);
      onChange();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deletePost({ data: { id } }),
    onSuccess: () => {
      toast.success("Publicação removida");
      onChange();
    },
  });

  const handleUpload = async (file: File) => {
    if (!user) return;
    try {
      const url = await uploadMedia(file, { userId: user.id, folder: "posts" });
      setImageUrl(url);
      toast.success("Imagem enviada");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="space-y-3 rounded-2xl border border-border bg-card p-5"
      >
        <Textarea
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="O que está acontecendo com a banda?"
          required
        />
        <ImageField
          label="Imagem (opcional)"
          url={imageUrl}
          onPick={handleUpload}
          aspect="aspect-video"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={create.isPending || !content}
            className="gap-1 bg-gradient-brand text-brand-foreground"
          >
            <Plus className="size-4" /> Publicar
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm whitespace-pre-wrap">{p.content}</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => del.mutate(p.id)}
                aria-label="Remover"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            {p.image_url && (
              <img
                src={p.image_url}
                alt="Imagem"
                className="mt-3 aspect-video w-full rounded-lg object-cover"
              />
            )}
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma publicação ainda.</p>
        )}
      </div>
    </div>
  );
}

function OrdersPanel({ orders }: { orders: Awaited<ReturnType<typeof listMyOrders>> }) {
  if (orders.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Você ainda não tem pedidos. Quando você ou um fã realizar uma compra, ela aparece aqui.
      </p>
    );

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{o.customer_name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(o.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="text-right">
              <Badge className="border-0 bg-accent text-brand">{o.status}</Badge>
              <p className="mt-1 font-display text-lg font-bold">{formatBRL(Number(o.total))}</p>
            </div>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {o.items.map((it, idx) => (
              <li key={idx}>
                {it.quantity}× {it.product_name}
                {it.on_demand && " (sob demanda)"}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function MembersPanel({ bandId }: { bandId: string }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "member">("member");
  const management = useQuery({
    queryKey: ["band-management", bandId],
    queryFn: () => getBandManagement({ data: { band_id: bandId } }),
  });
  const invite = useMutation({
    mutationFn: () => inviteBandMember({ data: { band_id: bandId, email, role } }),
    onSuccess: () => {
      setEmail("");
      qc.invalidateQueries({ queryKey: ["band-management", bandId] });
      toast.success(
        "Convite registrado. O envio de e-mail e o aceite ainda não estão disponíveis.",
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          invite.mutate();
        }}
        className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[1fr_150px_auto]"
      >
        <div>
          <Label htmlFor="member-email">E-mail</Label>
          <Input
            id="member-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="member-role">Papel</Label>
          <Select
            value={role}
            onValueChange={(value: "admin" | "editor" | "member") => setRole(value)}
          >
            <SelectTrigger id="member-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="member">Integrante</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={invite.isPending} className="self-end">
          {invite.isPending ? "Registrando..." : "Convidar"}
        </Button>
      </form>

      {management.isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar os integrantes.</p>
      ) : (
        <div className="space-y-2">
          {(management.data?.members ?? []).map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <span className="truncate text-sm">{member.user_id}</span>
              <Badge variant="outline">
                {member.role} · {member.status}
              </Badge>
            </div>
          ))}
          {(management.data?.invitations ?? []).map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border p-4"
            >
              <span className="truncate text-sm">{invitation.email}</span>
              <Badge variant="outline">Convite {invitation.status}</Badge>
            </div>
          ))}
          {!management.isLoading &&
            !management.data?.members.length &&
            !management.data?.invitations.length && (
              <p className="text-sm text-muted-foreground">
                Nenhum integrante ou convite encontrado.
              </p>
            )}
        </div>
      )}
    </div>
  );
}

function SupportPanel({
  band,
}: {
  band: { id: string; verified: boolean; support_enabled: boolean };
}) {
  const qc = useQueryClient();
  const management = useQuery({
    queryKey: ["band-management", band.id],
    queryFn: () => getBandManagement({ data: { band_id: band.id } }),
  });
  const toggle = useMutation({
    mutationFn: (enabled: boolean) => setBandSupport({ data: { band_id: band.id, enabled } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-band"] });
      toast.success("Preferência de apoio atualizada.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="font-semibold">Apoio direto</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {band.verified
              ? "O recebimento permanece indisponível até a integração de pagamentos."
              : "A banda precisa ser verificada para habilitar apoios."}
          </p>
        </div>
        <Button
          variant={band.support_enabled ? "outline" : "default"}
          disabled={!band.verified || toggle.isPending}
          onClick={() => toggle.mutate(!band.support_enabled)}
        >
          {band.support_enabled ? "Desativar apoios" : "Habilitar apoios"}
        </Button>
      </section>
      <div>
        <h3 className="mb-3 font-semibold">Histórico</h3>
        {(management.data?.tips ?? []).map((tip) => (
          <div
            key={tip.id}
            className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm"
          >
            <span>
              {tip.supporter_name}
              {tip.message ? ` · ${tip.message}` : ""}
            </span>
            <span>
              {formatBRL(Number(tip.amount))} · {tip.status}
            </span>
          </div>
        ))}
        {!management.isLoading && !management.data?.tips.length && (
          <p className="text-sm text-muted-foreground">
            Nenhum apoio registrado. A cobrança real ainda não está integrada.
          </p>
        )}
      </div>
    </div>
  );
}

function VerificationPanel({ band }: { band: { verified: boolean } }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 font-semibold">
        <BadgeCheck className="size-5" />
        {band.verified ? "Banda verificada" : "Banda ainda não verificada"}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {band.verified
          ? "O selo é exibido no perfil público."
          : "A solicitação pode ser iniciada em Reivindicar esta banda no perfil público. A área administrativa para analisar solicitações ainda não está disponível."}
      </p>
    </section>
  );
}