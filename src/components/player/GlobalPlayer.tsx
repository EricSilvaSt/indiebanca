import { Link } from "@tanstack/react-router";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Volume2,
  VolumeX,
  Radio,
  Loader2,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { usePlayer, formatTime } from "@/lib/player-store";

export function GlobalPlayer() {
  const {
    current,
    isPlaying,
    shuffle,
    progress,
    duration,
    volume,
    muted,
    loading,
    toggle,
    next,
    previous,
    setShuffle,
    seek,
    setVolume,
    toggleMute,
    startRadio,
  } = usePlayer();

  if (!current) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-brand text-brand-foreground">
              <Radio className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Rádio IndieBanca</p>
              <p className="truncate text-xs text-muted-foreground">
                Descubra bandas independentes no aleatório
              </p>
            </div>
          </div>
          <button
            onClick={() => void startRadio()}
            disabled={loading}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4 fill-current" />}
            Ouvir agora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 py-2.5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]">
        {/* Faixa atual */}
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={current.coverUrl ?? current.bandAvatar ?? "https://picsum.photos/seed/indiebanca/200/200"}
            alt={current.title}
            className="size-11 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{current.title}</p>
            <Link
              to="/banda/$slug"
              params={{ slug: current.bandSlug }}
              className="truncate text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {current.bandName}
            </Link>
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShuffle(!shuffle)}
              aria-label="Aleatório"
              className={cn(
                "rounded-full p-2 transition-colors",
                shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Shuffle className="size-4" />
            </button>
            <button
              onClick={previous}
              aria-label="Anterior"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <SkipBack className="size-4 fill-current" />
            </button>
            <button
              onClick={toggle}
              aria-label={isPlaying ? "Pausar" : "Tocar"}
              className="grid size-10 place-items-center rounded-full bg-gradient-brand text-brand-foreground transition-opacity hover:opacity-90"
            >
              {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
            </button>
            <button
              onClick={next}
              aria-label="Próxima"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <SkipForward className="size-4 fill-current" />
            </button>
          </div>
          <div className="hidden w-full items-center gap-2 md:flex">
            <span className="w-9 text-right text-[11px] tabular-nums text-muted-foreground">
              {formatTime(progress)}
            </span>
            <Slider
              value={[progress]}
              max={duration || 1}
              step={1}
              onValueChange={([v]) => seek(v)}
              className="flex-1"
              aria-label="Progresso"
            />
            <span className="w-9 text-[11px] tabular-nums text-muted-foreground">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden items-center justify-end gap-2 md:flex">
          <button
            onClick={toggleMute}
            aria-label="Mudo"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {muted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
          <Slider
            value={[muted ? 0 : volume * 100]}
            max={100}
            step={1}
            onValueChange={([v]) => setVolume(v / 100)}
            className="w-24"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
