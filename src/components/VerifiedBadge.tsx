import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedBadge({ className }: { className?: string }) {
  return <BadgeCheck className={cn("size-5 shrink-0 text-brand", className)} aria-label="Banda verificada" />;
}