import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  UserPlus,
  Music,
  Store,
  ShoppingBag,
  Wallet,
  Store as StoreIcon,
  ListMusic,
  Newspaper,
  CalendarDays,
  Images,
  Shirt,
  BarChart3,
  UserCircle,
  Heart,
} from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import heroImg from "@/assets/hero-concert.jpg";
import { Button } from "@/components/ui/button";
import { BandCard } from "@/components/BandCard";
import { listFeaturedBands } from "@/lib/bands.functions";
import { PostCard } from "@/components/PostCard";
import { listFeedPosts } from "@/lib/posts.functions";

const featuredBandsQuery = {
  queryKey: ["bands", "featured"],
  queryFn: () => listFeaturedBands(),
} as const;

const feedQuery = {
  queryKey: ["feed", "latest"],
  queryFn: () => listFeedPosts(),
} as const;

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(featuredBandsQuery),
      context.queryClient.ensureQueryData(feedQuery),
    ]),
  head: () => ({
    meta: [
      { title: "IndieBanca — Música independente, perto de você" },
      {
        name: "description",
        content:
          "Descubra bandas independentes, acompanhe novidades e apoie quem faz música. Artistas também encontram ferramentas para crescer.",
      },
      { property: "og:title", content: "IndieBanca — Descubra música independente" },
      {
        property: "og:description",
        content: "Transforme fãs em comunidade. Transforme comunidade em renda.",
      },
    ],
  }),
  component: Home,
});

const STEPS = [
  {
    icon: UserCircle,
    title: "Encontre artistas",
    desc: "Explore bandas novas por estilo e região.",
  },
  { icon: Music, title: "Ouça por aqui", desc: "Dê play nos lançamentos com áudio disponível." },
  { icon: UserPlus, title: "Acompanhe de perto", desc: "Siga bandas e veja o que elas publicam." },
  { icon: CalendarDays, title: "Vá aos shows", desc: "Descubra eventos e datas da cena." },
  {
    icon: Heart,
    title: "Fortaleça a cena",
    desc: "Curta, compartilhe e apoie artistas independentes.",
  },
];

const FEATURES = [
  {
    icon: UserCircle,
    title: "Perfil profissional",
    desc: "Uma página exclusiva e completa para a sua banda.",
  },
  {
    icon: StoreIcon,
    title: "Loja integrada",
    desc: "Venda merchandising sem administrar estoque.",
  },
  {
    icon: ListMusic,
    title: "Catálogo de músicas",
    desc: "Organize seu repertório com player visual.",
  },
  { icon: Newspaper, title: "Feed de publicações", desc: "Mantenha seus fãs sempre por dentro." },
  { icon: CalendarDays, title: "Agenda de eventos", desc: "Divulgue shows e datas importantes." },
  { icon: Images, title: "Galeria de fotos", desc: "Mostre os melhores momentos da banda." },
  {
    icon: Shirt,
    title: "Produtos personalizados",
    desc: "Camisetas, vinis, posters e muito mais.",
  },
  { icon: BarChart3, title: "Estatísticas básicas", desc: "Acompanhe visualizações e desempenho." },
];

function Home() {
  const { data: featured } = useSuspenseQuery(featuredBandsQuery);
  const { data: recentPosts } = useSuspenseQuery(feedQuery);
  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <img
            src={heroImg}
            alt="Multidão em show ao vivo"
            width={1600}
            height={1200}
            className="size-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="size-2 rounded-full bg-gradient-brand" />
              Para bandas e artistas independentes
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Indie<span className="text-gradient">Banca</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Descubra novos sons, acompanhe de perto as bandas que você ama e fortaleça a cena
              independente. Se você faz música, encontre seu público por aqui.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/explorar">
                <Button
                  size="lg"
                  className="w-full gap-2 bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90 sm:w-auto"
                >
                  Descobrir bandas <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sou artista
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="feed" className="border-y border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">Da cena, agora</h2>
              <p className="mt-3 text-muted-foreground">
                Lançamentos, bastidores e recados publicados por bandas independentes.
              </p>
            </div>
            <Link to="/feed">
              <Button variant="outline" className="gap-2">
                Abrir feed <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {recentPosts.slice(0, 3).map((post) => (
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
            {recentPosts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                As primeiras novidades da cena aparecem aqui em breve.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Como funciona</h2>
          <p className="mt-3 text-muted-foreground">
            Siga artistas, encontre shows e descubra o próximo som que vai entrar na sua playlist.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative rounded-2xl border border-border bg-card p-6"
            >
              <span className="font-display text-sm font-bold text-brand">Passo {i + 1}</span>
              <div className="mt-4 grid size-12 place-items-center rounded-xl bg-accent text-brand">
                <step.icon className="size-6" />
              </div>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* RECURSOS */}
      <section id="recursos" className="scroll-mt-20 border-y border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Recursos da plataforma</h2>
            <p className="mt-3 text-muted-foreground">
              Tudo o que sua banda precisa para crescer, em um só lugar.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="card-hover rounded-2xl border border-border bg-card p-6"
              >
                <div className="grid size-11 place-items-center rounded-xl bg-gradient-brand text-brand-foreground">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DESTAQUES */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Bandas em destaque</h2>
            <p className="mt-3 text-muted-foreground">
              Conheça artistas que estão movimentando a cena independente.
            </p>
          </div>
          <Link to="/explorar">
            <Button variant="outline" className="gap-2">
              Ver todas <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((band) => (
            <BandCard key={band.slug} band={band} />
          ))}
          {featured.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">
              Em breve, bandas em destaque aparecerão por aqui.
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-brand px-6 py-16 text-center sm:px-12">
          <div className="absolute inset-0 bg-glow opacity-60" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold text-brand-foreground sm:text-4xl">
              Quer levar sua banda para mais pessoas?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-foreground/80">
              Comece gratuitamente e tenha sua presença digital e sua loja prontas hoje mesmo.
            </p>
            <Link to="/auth">
              <Button
                size="lg"
                className="mt-8 gap-2 bg-background text-foreground hover:bg-background/90"
              >
                Criar perfil da banda <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
