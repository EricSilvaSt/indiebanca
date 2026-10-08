import { Link } from "@tanstack/react-router";
import { Disc3 } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className ?? ""}`}>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-brand shadow-glow">
        <Disc3 className="size-5 text-brand-foreground" />
      </span>
      <span className="font-display text-xl font-bold tracking-tight">IndieBanca</span>
    </Link>
  );
}
