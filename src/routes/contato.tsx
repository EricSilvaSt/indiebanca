import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, MapPin, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — IndieBanca" },
      { name: "description", content: "Fale com a equipe da IndieBanca. Estamos aqui para ajudar." },
    ],
  }),
  component: Contato,
});

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  message: z.string().trim().min(10, "Escreva ao menos 10 caracteres").max(1000),
});

function Contato() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const result = schema.safeParse(data);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    toast.success("Mensagem enviada!", { description: "Responderemos em breve." });
    e.currentTarget.reset();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-bold">Fale com a gente</h1>
        <p className="mt-3 text-muted-foreground">
          Tem dúvidas, sugestões ou quer levar sua banda mais longe? Estamos aqui.
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          {[
            { icon: Mail, label: "E-mail", value: "contato@indiebanca.app" },
            { icon: MessageSquare, label: "Suporte", value: "Resposta em até 24h" },
            { icon: MapPin, label: "Onde estamos", value: "São Paulo, Brasil" },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-brand">
                <c.icon className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="font-medium">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-border bg-card p-6 sm:p-8"
        >
          <div>
            <Label htmlFor="name" className="mb-2 block">
              Nome
            </Label>
            <Input id="name" name="name" placeholder="Seu nome" />
          </div>
          <div>
            <Label htmlFor="email" className="mb-2 block">
              E-mail
            </Label>
            <Input id="email" name="email" type="email" placeholder="voce@email.com" />
          </div>
          <div>
            <Label htmlFor="message" className="mb-2 block">
              Mensagem
            </Label>
            <Textarea id="message" name="message" rows={5} placeholder="Como podemos ajudar?" />
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full bg-gradient-brand text-brand-foreground hover:opacity-90"
          >
            Enviar mensagem
          </Button>
        </form>
      </div>
    </div>
  );
}
