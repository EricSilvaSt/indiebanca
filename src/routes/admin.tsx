import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ExternalLink, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getPlatformAdminStatus,
  listPendingBandClaims,
  reviewBandClaim,
} from "@/lib/community.functions";

const adminQuery = {
  queryKey: ["platform-admin"],
  queryFn: () => getPlatformAdminStatus(),
} as const;

const claimsQuery = {
  queryKey: ["band-claims", "pending"],
  queryFn: () => listPendingBandClaims(),
} as const;

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Administração — IndieBanca" }] }),
  component: AdminPage,
});

function AdminPage() {
  const queryClient = useQueryClient();
  const admin = useQuery(adminQuery);
  const claims = useQuery({ ...claimsQuery, enabled: admin.data === true });
  const review = useMutation({
    mutationFn: (input: { claim_id: string; decision: "approved" | "rejected" }) =>
      reviewBandClaim({ data: { ...input, notes: "" } }),
    onSuccess: () => {
      toast.success("Decisão registrada.");
      queryClient.invalidateQueries({ queryKey: claimsQuery.queryKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (admin.isLoading) return <div className="mx-auto max-w-5xl px-4 py-16">Carregando...</div>;
  if (admin.isError || !admin.data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área é exclusiva para administradores da plataforma.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="border-b border-border pb-6">
        <Badge variant="outline">Administração</Badge>
        <h1 className="mt-3 font-display text-3xl font-bold">Reivindicações de bandas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Revise evidências antes de atribuir propriedade e selo oficial.
        </p>
      </header>
      <div className="mt-6 space-y-4">
        {claims.isError && (
          <p className="text-sm text-destructive">Não foi possível carregar as solicitações.</p>
        )}
        {(claims.data ?? []).map((claim) => (
          <article key={claim.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">{claim.band?.name ?? "Banda sem nome"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Solicitante: {claim.claimant_user_id} · Função: {claim.claimed_role}
                </p>
              </div>
              <a
                href={claim.official_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
              >
                Link oficial <ExternalLink className="size-3.5" />
              </a>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm">{claim.evidence}</p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                disabled={review.isPending}
                onClick={() => review.mutate({ claim_id: claim.id, decision: "rejected" })}
              >
                Rejeitar
              </Button>
              <Button
                disabled={review.isPending}
                onClick={() => review.mutate({ claim_id: claim.id, decision: "approved" })}
              >
                <BadgeCheck className="mr-2 size-4" /> Aprovar e verificar
              </Button>
            </div>
          </article>
        ))}
        {!claims.isLoading && !claims.isError && claims.data?.length === 0 && (
          <p className="border-y border-border py-12 text-center text-sm text-muted-foreground">
            Nenhuma reivindicação pendente.
          </p>
        )}
      </div>
    </div>
  );
}
