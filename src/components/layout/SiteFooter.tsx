import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, Music2 } from "lucide-react";
import { Logo } from "@/components/Logo";

const LINKS = [
  { label: "Feed", to: "/feed" as const },
  { label: "Sobre", to: "/sobre" as const },
  { label: "Termos de uso", to: "/termos" as const },
  { label: "Política de privacidade", to: "/privacidade" as const },
  { label: "Contato", to: "/contato" as const },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            A plataforma que transforma fãs em comunidade e comunidade em renda para bandas e
            artistas independentes.
          </p>
          <div className="mt-5 flex gap-2">
            {[Instagram, Youtube, Music2].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-brand hover:text-foreground"
                aria-label="Rede social"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Plataforma</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            {LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className="transition-colors hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Comece agora</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <Link to="/auth" className="transition-colors hover:text-foreground">
                Criar perfil da banda
              </Link>
            </li>
            <li>
              <Link to="/explorar" className="transition-colors hover:text-foreground">
                Explorar bandas
              </Link>
            </li>
            <li>
              <Link to="/dashboard" search={{ tab: "overview" }} className="transition-colors hover:text-foreground">
                Painel da banda
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6">
        <p className="mx-auto max-w-7xl px-4 text-center text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} IndieBanca. Feito para a música independente.
        </p>
      </div>
    </footer>
  );
}
