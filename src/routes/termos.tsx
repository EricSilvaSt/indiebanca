import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso — IndieBanca" },
      { name: "description", content: "Termos de uso da plataforma IndieBanca." },
    ],
  }),
  component: Termos,
});

const SECTIONS = [
  {
    title: "1. Aceitação dos termos",
    body: "Ao criar uma conta ou utilizar a IndieBanca, você concorda com estes termos de uso. Caso não concorde, não utilize a plataforma.",
  },
  {
    title: "2. Cadastro e conta",
    body: "Você é responsável por manter a confidencialidade dos seus dados de acesso e por todas as atividades realizadas em sua conta. As informações fornecidas devem ser verdadeiras e atualizadas.",
  },
  {
    title: "3. Conteúdo do artista",
    body: "Bandas e artistas mantêm todos os direitos sobre as músicas, imagens e textos publicados. Ao publicar, você concede à IndieBanca uma licença para exibir esse conteúdo dentro da plataforma.",
  },
  {
    title: "4. Loja e vendas",
    body: "Os produtos vendidos podem ser fabricados sob demanda. A IndieBanca intermedia as vendas e retém uma comissão por transação, repassando o valor restante ao artista conforme as condições vigentes.",
  },
  {
    title: "5. Produção sob demanda",
    body: "Produtos marcados como produção sob demanda são fabricados somente após a confirmação do pedido. Prazos de produção e envio são informados no momento da compra.",
  },
  {
    title: "6. Conduta",
    body: "É proibido publicar conteúdo ilegal, ofensivo ou que viole direitos de terceiros. A IndieBanca pode remover conteúdos e suspender contas que descumpram estas regras.",
  },
];

function Termos() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-bold">Termos de uso</h1>
      <p className="mt-3 text-sm text-muted-foreground">Última atualização: junho de 2026</p>
      <div className="mt-10 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-lg font-bold">{s.title}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
