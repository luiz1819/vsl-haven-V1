import * as React from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { cloud } from "@/lib/cloudClient";
import { useAuth } from "@/auth/useAuth";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";

const emailSchema = z.string().email("Digite um email válido");
const passwordSchema = z.string().min(8, "Senha precisa ter pelo menos 8 caracteres");

function getErrorMessage(err: unknown) {
  if (!err) return "Algo deu errado.";
  if (typeof err === "string") return err;
  if (typeof err === "object" && "message" in err && typeof (err as any).message === "string") return (err as any).message;
  return "Algo deu errado.";
}

export default function Login() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading } = useAuth();

  const [tab, setTab] = React.useState<"login" | "signup" | "reset">("login");
  const [busy, setBusy] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const from = (location.state as any)?.from as string | undefined;

  if (!loading && session) return <Navigate to={from ?? "/dashboard"} replace />;

  const validate = () => {
    const emailRes = emailSchema.safeParse(email.trim());
    if (!emailRes.success) return emailRes.error.issues[0]?.message;

    if (tab !== "reset") {
      const passRes = passwordSchema.safeParse(password);
      if (!passRes.success) return passRes.error.issues[0]?.message;
    }
    return null;
  };

  const onSubmit = async () => {
    const msg = validate();
    if (msg) {
      toast({ title: "Verifique os campos", description: msg, variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      if (tab === "login") {
        const { error } = await cloud.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast({ title: "Bem-vindo!", description: "Login efetuado com sucesso." });
        navigate(from ?? "/dashboard", { replace: true });
      }

      if (tab === "signup") {
        const redirectUrl = `${window.location.origin}/`;
        const { data, error } = await cloud.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;

        // Create profile row for the user.
        const uid = data.user?.id;
        if (uid) {
          // Defer DB work to avoid auth callback issues.
          setTimeout(() => {
            cloud.from("profiles").upsert({ user_id: uid }).then(() => {});
          }, 0);
        }

        toast({
          title: "Conta criada",
          description: "Confira seu email para confirmar o cadastro (se estiver habilitado).",
        });
      }

      if (tab === "reset") {
        const redirectUrl = `${window.location.origin}/login`;
        const { error } = await cloud.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUrl });
        if (error) throw error;
        toast({ title: "Email enviado", description: "Se existir uma conta, você receberá o link de recuperação." });
      }
    } catch (e) {
      toast({ title: "Não foi possível continuar", description: getErrorMessage(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
      // If not redirected, tokens were set and session should update.
      navigate(from ?? "/dashboard", { replace: true });
    } catch (e) {
      toast({ title: "Não foi possível continuar", description: getErrorMessage(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-svh">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-primary/25 to-primaryGlow/10 blur-3xl motion-safe:animate-[aurora_10s_ease-in-out_infinite]" />
        <div className="absolute -bottom-24 -right-24 h-[30rem] w-[30rem] rounded-full bg-gradient-to-tr from-primaryGlow/18 to-primary/10 blur-3xl motion-safe:animate-[aurora_12s_ease-in-out_infinite]" />
      </div>

      <div className="mx-auto flex min-h-svh w-full max-w-lg items-center px-4">
        <Card className="w-full surface-1 shadow-glow">
          <CardHeader>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <div className="text-sm text-muted-foreground">MakoVid</div>
            </div>
            <CardTitle className="text-2xl">Acesse o painel</CardTitle>
            <CardDescription>
              Login, registro e recuperação de senha via autenticação do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Registro</TabsTrigger>
                <TabsTrigger value="reset">Recuperar</TabsTrigger>
              </TabsList>

              <div className="mt-4 grid gap-3">
                {tab !== "reset" && (
                  <Button variant="outline" type="button" onClick={onGoogle} disabled={busy}>
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    Entrar com Google
                  </Button>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@empresa.com"
                  />
                </div>

                {tab !== "reset" && (
                  <div className="grid gap-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete={tab === "login" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <TabsContent value="login" className="m-0" />
                <TabsContent value="signup" className="m-0" />
                <TabsContent value="reset" className="m-0" />

                <Button variant="hero" onClick={onSubmit} disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {tab === "login" && "Entrar"}
                  {tab === "signup" && "Criar conta"}
                  {tab === "reset" && "Enviar link"}
                </Button>

                <div className="text-xs text-muted-foreground">
                  Dica: para testes mais rápidos, você pode desativar a confirmação de email nas configurações de autenticação.
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
