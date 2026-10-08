import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade — IndieBanca" },
      { name: "description", content: "Como a IndieBanca coleta, usa e protege seus dados." },
    ],
  }),
  component: Privacidade,
});

const SECTIONS = [
  {
    title: "1. Dados que coletamos",
    body: "Coletamos os dados fornecidos no cadastro (nome artístico, e-mail, localização, biografia e imagens) e dados de uso da plataforma, como visualizações de perfil e estatísticas de vendas.",
  },
  {
    title: "2. Como usamos os dados",
    body: "Utilizamos seus dados para operar a plataforma, exibir seu perfil público, processar pedidos, gerar estatísticas e melhorar a sua experiência.",
  },
  {
    title: "3. Compartilhamento",
    body: "Não vendemos seus dados. Compartilhamos informações apenas com parceiros necessários para a operação, como serviços de produção sob demanda e pagamentos.",
  },
  {
    title: "4. Cookies",
    body: "Usamos cookies e tecnologias semelhantes para lembrar preferências, como o tema escolhido, e para entender como a plataforma é utilizada.",
  },
  {
    title: "5. Seus direitos",
    body: "Você pode acessar, corrigir ou solicitar a exclusão dos seus dados a qualquer momento através das configurações da conta ou entrando em contato conosco.",
  },
  {
    title: "6. Segurança",
    body: "Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda ou alteração.",
  },
];

function Privacidade() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-bold">Política de privacidade</h1>
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
