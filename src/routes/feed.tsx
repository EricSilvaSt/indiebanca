import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/PostCard";
import { listFeedPosts } from "@/lib/posts.functions";

const feedQuery = {
  queryKey: ["feed", "latest"],
  queryFn: () => listFeedPosts(),
} as const;

export const Route = createFileRoute("/feed")({
  loader: ({ context }) => context.queryClient.ensureQueryData(feedQuery),
  head: () => ({
    meta: [
      { title: "Feed da cena — IndieBanca" },
      {
        name: "description",
        content: "Novidades, lançamentos e bastidores das bandas independentes.",
      },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const { data: posts } = useSuspenseQuery(feedQuery);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-7">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-brand">
            <Radio className="size-4" /> IndieBanca
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Feed da cena</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Acompanhe o que bandas independentes estão publicando, em um só lugar.
          </p>
        </div>
        <Link to="/explorar">
          <Button variant="outline" className="gap-2">
            Encontrar bandas <ArrowRight className="size-4" />
          </Button>
        </Link>
      </header>
      <div className="mx-auto mt-8 max-w-2xl space-y-5">
        {posts.map((post) => (
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
        {posts.length === 0 && (
          <div className="border-y border-border py-12 text-center">
            <p className="font-medium">Ainda não há publicações por aqui.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Explore bandas e acompanhe as novidades da cena.
            </p>
            <Link to="/explorar">
              <Button className="mt-5">Explorar bandas</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
