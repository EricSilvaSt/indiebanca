import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { formatNumber, relativeTime } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { togglePostLike } from "@/lib/posts.functions";

export type PostCardData = {
  id: string;
  content: string;
  image_url: string | null;
  type: "post" | "evento";
  created_at: string;
  likes?: number;
  author?: { name: string; avatar_url: string | null; slug?: string } | null;
};

export function PostCard({ post }: { post: PostCardData }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const likes = (post.likes ?? 0) + (liked ? 1 : 0);

  const like = useMutation({
    mutationFn: async () => togglePostLike({ data: { post_id: post.id } }),
    onSuccess: (res) => setLiked(res.liked),
    onError: (e: Error) => toast.error(e.message),
  });

  const authorName = post.author?.name ?? "Banda";
  const authorAvatar = post.author?.avatar_url ?? "https://picsum.photos/seed/avatar/100/100";

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <header className="flex items-center gap-3">
        <img
          src={authorAvatar}
          alt={authorName}
          loading="lazy"
          className="size-10 rounded-full object-cover"
        />
        <div className="min-w-0">
          {post.author?.slug ? (
            <Link
              to="/banda/$slug"
              params={{ slug: post.author.slug }}
              className="truncate font-semibold leading-tight hover:underline"
            >
              {authorName}
            </Link>
          ) : (
            <p className="truncate font-semibold leading-tight">{authorName}</p>
          )}
          <p className="text-xs text-muted-foreground">{relativeTime(post.created_at)}</p>
        </div>
        {post.type === "evento" && (
          <Badge className="ml-auto gap-1 border-0 bg-brand-2/15 text-brand-2">
            <CalendarDays className="size-3" /> Evento
          </Badge>
        )}
      </header>

      <p className="mt-4 text-sm leading-relaxed">{post.content}</p>

      {post.image_url && (
        <img
          src={post.image_url}
          alt="Imagem da publicação"
          loading="lazy"
          className="mt-4 aspect-video w-full rounded-xl object-cover"
        />
      )}

      <footer className="mt-4 flex items-center gap-1 border-t border-border pt-3 text-sm text-muted-foreground">
        <button
          onClick={() => {
            if (!user) {
              toast.info("Entre para curtir publicações");
              return;
            }
            like.mutate();
          }}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors hover:bg-accent ${
            liked ? "text-brand-2" : ""
          }`}
        >
          <Heart className={`size-4 ${liked ? "fill-current" : ""}`} />
          {formatNumber(likes)}
        </button>
      </footer>
    </article>
  );
}
