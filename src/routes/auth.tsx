import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — IndieBanca" },
      {
        name: "description",
        content: "Acesse sua conta da IndieBanca ou crie um perfil para acompanhar artistas independentes.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const signin = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bem-vindo de volta!");
      navigate({ to: "/dashboard", search: { tab: "overview" } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signup = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name || email.split("@")[0] },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conta criada!", {
        description: "Confirme seu e-mail e entre para continuar.",
      });
      setTab("signin");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="text-center">
        <div className="inline-flex"><Logo /></div>
        <h1 className="mt-6 font-display text-3xl font-bold">Bem-vindo à IndieBanca</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acesse sua conta ou crie uma para começar.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-elevated">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-6 space-y-4">
            <div>
              <Label htmlFor="signin-email">E-mail</Label>
              <Input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="signin-password">Senha</Label>
              <Input
                id="signin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <Button
              className="w-full bg-gradient-brand text-brand-foreground hover:opacity-90"
              disabled={signin.isPending || !email || !password}
              onClick={() => signin.mutate()}
            >
              {signin.isPending ? "Entrando..." : "Entrar"}
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="mt-6 space-y-4">
            <div>
              <Label htmlFor="signup-name">Como prefere ser chamado(a)?</Label>
              <Input
                id="signup-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome ou da banda"
              />
            </div>
            <div>
              <Label htmlFor="signup-email">E-mail</Label>
              <Input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="signup-password">Senha</Label>
              <Input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </div>
            <Button
              className="w-full bg-gradient-brand text-brand-foreground hover:opacity-90"
              disabled={signup.isPending || !email || password.length < 6}
              onClick={() => signup.mutate()}
            >
              {signup.isPending ? "Criando..." : "Criar conta"}
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Ao continuar você concorda com nossos{" "}
        <Link to="/termos" className="underline hover:text-foreground">
          termos
        </Link>{" "}
        e{" "}
        <Link to="/privacidade" className="underline hover:text-foreground">
          política de privacidade
        </Link>
        .
      </p>
    </div>
  );
}