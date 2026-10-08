import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, Search, ShoppingBag, ShieldCheck, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { NotificationsMenu } from "@/components/NotificationsMenu";
import { getPlatformAdminStatus } from "@/lib/community.functions";

const NAV = [
  { label: "Feed", to: "/feed" },
  { label: "Explorar", to: "/explorar" },
  { label: "Como funciona", to: "/", hash: "como-funciona" },
  { label: "Recursos", to: "/", hash: "recursos" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const admin = useQuery({
    queryKey: ["platform-admin"],
    queryFn: () => getPlatformAdminStatus(),
    enabled: Boolean(user),
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              hash={item.hash}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
            aria-label="Buscar"
            onClick={() => navigate({ to: "/explorar" })}
          >
            <Search className="size-5" />
          </Button>
          <ThemeToggle />
          <Link to="/carrinho" className="relative">
            <Button variant="ghost" size="icon" aria-label="Carrinho">
              <ShoppingBag className="size-5" />
            </Button>
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-gradient-brand text-[10px] font-bold text-brand-foreground">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <>
              <NotificationsMenu />
              {admin.data && (
                <Link to="/admin" className="hidden lg:block">
                  <Button variant="ghost" size="icon" aria-label="Administração" title="Administração">
                    <ShieldCheck className="size-4" />
                  </Button>
                </Link>
              )}
              <Link to="/dashboard" search={{ tab: "overview" }} className="hidden sm:block">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <LayoutDashboard className="size-4" /> Painel
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                aria-label="Sair"
                className="hidden sm:inline-flex"
              >
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link to="/auth" className="hidden sm:block">
                <Button size="sm" className="bg-gradient-brand text-brand-foreground hover:opacity-90">
                  Criar perfil
                </Button>
              </Link>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((p) => !p)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                hash={item.hash}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <div className="mt-2 flex gap-2">
                {admin.data && (
                  <Link to="/admin" className="flex-1" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">Administração</Button>
                  </Link>
                )}
                <Link to="/dashboard" search={{ tab: "overview" }} className="flex-1" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Painel
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setOpen(false);
                    handleSignOut();
                  }}
                >
                  Sair
                </Button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2">
                <Link to="/auth" className="flex-1" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Entrar
                  </Button>
                </Link>
                <Link to="/auth" className="flex-1" onClick={() => setOpen(false)}>
                  <Button className="w-full bg-gradient-brand text-brand-foreground">Criar perfil</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
