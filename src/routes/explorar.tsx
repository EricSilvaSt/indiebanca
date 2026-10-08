import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { BandCard } from "@/components/BandCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GENRES, type Genre } from "@/lib/enums";
import { listAllBands } from "@/lib/bands.functions";

const allBandsQuery = {
  queryKey: ["bands", "all"],
  queryFn: () => listAllBands(),
} as const;

export const Route = createFileRoute("/explorar")({
  loader: ({ context }) => context.queryClient.ensureQueryData(allBandsQuery),
  head: () => ({
    meta: [
      { title: "Explorar bandas — IndieBanca" },
      {
        name: "description",
        content:
          "Descubra bandas e artistas independentes por nome, cidade, estado, país ou gênero musical.",
      },
      { property: "og:title", content: "Explorar bandas — IndieBanca" },
      { property: "og:description", content: "Encontre novas bandas independentes para seguir." },
    ],
  }),
  component: Explore,
});

function Explore() {
  const { data: bands } = useSuspenseQuery(allBandsQuery);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<Genre | "Todos">("Todos");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bands.filter((b) => {
      const matchesQuery =
        !q ||
        [b.name, b.city, b.state, b.country, b.genre].some((field) =>
          (field ?? "").toLowerCase().includes(q),
        );
      const matchesGenre = genre === "Todos" || b.genre === genre;
      return matchesQuery && matchesGenre;
    });
  }, [bands, query, genre]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Explorar bandas</h1>
        <p className="mt-3 text-muted-foreground">
          Busque por nome, cidade, estado, país ou gênero musical.
        </p>
      </div>

      <div className="relative mt-8 max-w-xl">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar bandas, cidades, gêneros..."
          className="h-12 rounded-xl pl-10"
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["Todos", ...GENRES] as const).map((g) => (
          <Button
            key={g}
            size="sm"
            variant={genre === g ? "default" : "outline"}
            onClick={() => setGenre(g)}
            className={
              genre === g
                ? "rounded-full bg-gradient-brand text-brand-foreground hover:opacity-90"
                : "rounded-full"
            }
          >
            {g}
          </Button>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
      </p>

      {filtered.length > 0 ? (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((band) => (
            <BandCard key={band.slug} band={band} />
          ))}
        </div>
      ) : (
        <div className="mt-16 rounded-2xl border border-dashed border-border py-20 text-center">
          <p className="font-display text-lg font-semibold">Nenhuma banda encontrada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tente outra busca ou remova os filtros.
          </p>
        </div>
      )}
    </div>
  );
}