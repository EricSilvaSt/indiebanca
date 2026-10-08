import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Users, Store, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — IndieBanca" },
      {
        name: "description",
        content:
          "Conheça a missão da IndieBanca: aproximar fãs e artistas independentes.",
      },
      { property: "og:title", content: "Sobre — IndieBanca" },
      { property: "og:description", content: "A plataforma da música independente." },
    ],
  }),
  component: Sobre,
});

const VALUES = [
  { icon: Users, title: "Comunidade", desc: "Aproximamos artistas e fãs em torno da música." },
  { icon: Store, title: "Independência", desc: "Ferramentas para você vender sem intermediários." },
  { icon: Sparkles, title: "Criatividade", desc: "Espaço para sua identidade artística brilhar." },
  { icon: Heart, title: "Profissionalismo", desc: "Uma presença digital à altura do seu trabalho." },
];

function Sobre() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-bold">Sobre a IndieBanca</h1>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
        A IndieBanca nasceu para aproximar a cena independente: divulgar o trabalho,
        construir uma base de fãs e gerar renda sem depender de gravadoras ou de uma estrutura de
        estoque cara. Aqui, cada banda tem um perfil profissional, uma loja integrada e um feed para
        se conectar diretamente com a sua comunidade.
      </p>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        Com a produção sob demanda, os produtos são fabricados apenas após a confirmação do pedido —
        ou seja, nada de risco com estoque parado. A banda foca no que faz de melhor: música. Nós
        cuidamos do resto.
      </p>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {VALUES.map((v) => (
          <div key={v.title} className="rounded-2xl border border-border bg-card p-6">
            <div className="grid size-11 place-items-center rounded-xl bg-gradient-brand text-brand-foreground">
              <v.icon className="size-5" />
            </div>
            <h2 className="mt-4 font-display text-lg font-bold">{v.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-border bg-card/50 p-8 text-center">
        <h2 className="font-display text-2xl font-bold">Faça parte da cena</h2>
        <p className="mt-2 text-muted-foreground">Crie o perfil da sua banda hoje mesmo.</p>
        <Link to="/auth">
          <Button className="mt-5 bg-gradient-brand text-brand-foreground">Criar perfil</Button>
        </Link>
      </div>
    </div>
  );
}
