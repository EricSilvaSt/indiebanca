import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { listRadioTracks } from "./player.functions";

export type PlayerTrack = {
  id: string;
  title: string;
  album?: string;
  coverUrl: string | null;
  audioUrl: string | null;
  bandName: string;
  bandSlug: string;
  bandAvatar: string | null;
};

/** True when the URL points at a file the browser can decode natively. */
export function isPlayableAudioUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const path = new URL(url).pathname.toLowerCase();
    return /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/.test(path);
  } catch {
    return false;
  }
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type PlayerContextValue = {
  queue: PlayerTrack[];
  current: PlayerTrack | null;
  isPlaying: boolean;
  shuffle: boolean;
  progress: number;
  duration: number;
  volume: number;
  muted: boolean;
  loading: boolean;
  playTrack: (track: PlayerTrack, queue?: PlayerTrack[], options?: { shuffle?: boolean }) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  setShuffle: (value: boolean) => void;
  seek: (seconds: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  startRadio: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<PlayerTrack[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffleState] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);

  const current = queue[index] ?? null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;
    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd = () => setIndex((i) => i + 1);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audioRef.current = null;
    };
  }, []);

  // Load the current track's source whenever the track changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!current) {
      audio.pause();
      audio.removeAttribute("src");
      return;
    }
    if (!isPlayableAudioUrl(current.audioUrl)) {
      // Not natively playable — skip forward so the radio keeps flowing.
      audio.pause();
      if (index < queue.length - 1) setIndex((i) => i + 1);
      return;
    }
    audio.src = current.audioUrl;
    audio.volume = muted ? 0 : volume;
    setProgress(0);
    void audio.play().catch(() => setIsPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  // Wrap the queue when the last track finishes.
  useEffect(() => {
    if (queue.length > 0 && index >= queue.length) setIndex(0);
  }, [index, queue.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const playTrack = useCallback(
    (track: PlayerTrack, nextQueue?: PlayerTrack[], options?: { shuffle?: boolean }) => {
      const base = nextQueue && nextQueue.length > 0 ? nextQueue : [track];
      const ordered =
        (options?.shuffle ?? shuffle)
          ? [track, ...shuffled(base.filter((t) => t.id !== track.id))]
          : base;
      setQueue(ordered);
      setIndex(
        Math.max(
          0,
          ordered.findIndex((t) => t.id === track.id),
        ),
      );
    },
    [shuffle],
  );

  const startRadio = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listRadioTracks();
      const tracks: PlayerTrack[] = rows
        .filter((r) => r.band && isPlayableAudioUrl(r.audio_url ?? r.external_url))
        .map((r) => ({
          id: r.id,
          title: r.title,
          album: r.album,
          coverUrl: r.cover_url,
          audioUrl: r.audio_url ?? r.external_url,
          bandName: r.band!.name,
          bandSlug: r.band!.slug,
          bandAvatar: r.band!.avatar_url,
        }));
      if (tracks.length === 0) return;
      const ordered = shuffle ? shuffled(tracks) : tracks;
      setQueue(ordered);
      setIndex(0);
    } finally {
      setLoading(false);
    }
  }, [shuffle]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) {
      void startRadio();
      return;
    }
    if (audio.paused) void audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
  }, [current, startRadio]);

  const next = useCallback(() => {
    setIndex((i) => (queue.length ? (i + 1) % queue.length : 0));
  }, [queue.length]);

  const previous = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 4) {
      audio.currentTime = 0;
      return;
    }
    setIndex((i) => (queue.length ? (i - 1 + queue.length) % queue.length : 0));
  }, [queue.length]);

  const setShuffle = useCallback(
    (value: boolean) => {
      setShuffleState(value);
      if (value && queue.length > 1 && current) {
        const rest = shuffled(queue.filter((t) => t.id !== current.id));
        setQueue([current, ...rest]);
        setIndex(0);
      }
    },
    [queue, current],
  );

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = seconds;
      setProgress(seconds);
    }
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(value);
    setMuted(value === 0);
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      queue,
      current,
      isPlaying,
      shuffle,
      progress,
      duration,
      volume,
      muted,
      loading,
      playTrack,
      toggle,
      next,
      previous,
      setShuffle,
      seek,
      setVolume,
      toggleMute,
      startRadio,
    }),
    [
      queue,
      current,
      isPlaying,
      shuffle,
      progress,
      duration,
      volume,
      muted,
      loading,
      playTrack,
      toggle,
      next,
      previous,
      setShuffle,
      seek,
      setVolume,
      toggleMute,
      startRadio,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
