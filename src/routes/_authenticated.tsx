import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Music2, ShoppingBag, CalendarDays, Newspaper, Receipt, Users, HandHeart, BadgeCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getMyBand } from "@/lib/bands.functions";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

const NAV = [
  { to: "/dashboard", label: "Visão geral", icon: LayoutDashboard, search: { tab: "overview" } },
  { to: "/dashboard", label: "Banda", icon: LayoutDashboard, search: { tab: "banda" } },
  { to: "/dashboard", label: "Músicas", icon: Music2, search: { tab: "musicas" } },
  { to: "/dashboard", label: "Produtos", icon: ShoppingBag, search: { tab: "produtos" } },
  { to: "/dashboard", label: "Eventos", icon: CalendarDays, search: { tab: "eventos" } },
  { to: "/dashboard", label: "Publicações", icon: Newspaper, search: { tab: "publicacoes" } },
  { to: "/dashboard", label: "Pedidos", icon: Receipt, search: { tab: "pedidos" } },
  { to: "/dashboard", label: "Integrantes", icon: Users, search: { tab: "integrantes" } },
  { to: "/dashboard", label: "Apoios", icon: HandHeart, search: { tab: "apoios" } },
  { to: "/dashboard", label: "Verificação", icon: BadgeCheck, search: { tab: "verificacao" } },
];

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const selectedBand = useRouterState({
    select: (state) => new URLSearchParams(state.location.searchStr).get("band"),
  });
  const bandQuery = useQuery({
    queryKey: ["my-band", selectedBand],
    queryFn: () => getMyBand({ data: { band_id: selectedBand ?? undefined } }),
    enabled: Boolean(user) && !loading,
  });
  const activeTab = useRouterState({ select: (s) => new URLSearchParams(s.location.searchStr).get("tab") ?? "overview" });
  const role = bandQuery.data?.membership_role;
  const isManager = role === "owner" || role === "admin";
  const canManageContent = isManager || role === "editor";
  const visibleNav = NAV.filter((item) => {
    const tab = item.search.tab;
    if (tab === "overview") return true;
    if (!bandQuery.data) return false;
    if (tab === "banda") return isManager;
    if (tab === "integrantes" || tab === "apoios" || tab === "verificacao" || tab === "pedidos") return isManager;
    return canManageContent;
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:h-fit">
        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Painel
          </p>
          <nav className="flex flex-col gap-0.5">
            {visibleNav.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                search={(previous) => ({ ...previous, tab: item.search.tab })}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground ${activeTab === item.search.tab ? "bg-accent text-foreground" : "text-muted-foreground"}`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}