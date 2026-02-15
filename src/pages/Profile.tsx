import * as React from "react";
import { cloud } from "@/lib/cloudClient";
import { useAuth } from "@/auth/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, User, Shield, Mail, Check, AlertCircle } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [resetEmailSent, setResetEmailSent] = React.useState(false);
  const [sendingReset, setSendingReset] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load profile data
  React.useEffect(() => {
    let cancelled = false;
    if (!user) return;

    cloud
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setDisplayName(data?.display_name ?? "");
        setAvatarUrl(data?.avatar_url ?? null);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const onSave = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { error } = await cloud
        .from("profiles")
        .upsert({
          user_id: user.id,
          display_name: displayName.trim() || null,
          avatar_url: avatarUrl,
        });
      if (error) throw error;
      toast({ title: "Perfil atualizado" });
    } catch (e: any) {
      toast({ title: "Erro", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem.", variant: "destructive" });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 2MB.", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar.${ext}`;

      // Upload to storage
      const { error: uploadError } = await cloud.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = cloud.storage
        .from("avatars")
        .getPublicUrl(path);

      const newUrl = urlData?.publicUrl + `?t=${Date.now()}`;
      setAvatarUrl(newUrl);

      // Update profile
      await cloud
        .from("profiles")
        .upsert({
          user_id: user.id,
          avatar_url: newUrl,
          display_name: displayName.trim() || null,
        });

      toast({ title: "Avatar atualizado" });
    } catch (e: any) {
      toast({ title: "Erro no upload", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSendPasswordReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      const { error } = await cloud.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/profile`,
      });
      if (error) throw error;
      setResetEmailSent(true);
      toast({ title: "Email enviado", description: "Verifique sua caixa de entrada." });
    } catch (e: any) {
      toast({ title: "Erro", description: String(e?.message ?? e), variant: "destructive" });
    } finally {
      setSendingReset(false);
    }
  };

  const initials = React.useMemo(() => {
    if (displayName?.trim()) {
      return displayName.trim().slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "U";
  }, [displayName, user?.email]);

  const emailVerified = user?.email_confirmed_at != null;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais e segurança.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Info Card */}
        <Card className="surface-1 shadow-elev">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>Seu nome e foto de perfil.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={avatarUrl ?? undefined} alt="Avatar" />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploadingAvatar ? "Enviando..." : "Alterar foto"}
                </Button>
                <p className="text-xs text-muted-foreground">JPG, PNG. Máx 2MB.</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatarChange}
              />
            </div>

            {/* Display Name */}
            <div className="grid gap-2">
              <Label htmlFor="displayName">Nome de exibição</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Como você quer ser chamado?"
              />
            </div>

            {/* Email (read-only) */}
            <div className="grid gap-2">
              <Label>Email</Label>
              <div className="flex items-center gap-2">
                <Input value={user?.email ?? ""} disabled className="bg-muted" />
                {emailVerified ? (
                  <Badge variant="outline" className="shrink-0 gap-1 border-green-500/50 text-green-600">
                    <Check className="h-3 w-3" />
                    Verificado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="shrink-0 gap-1 border-yellow-500/50 text-yellow-600">
                    <AlertCircle className="h-3 w-3" />
                    Pendente
                  </Badge>
                )}
              </div>
            </div>

            <Button variant="hero" onClick={onSave} disabled={busy} className="w-full">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar alterações
            </Button>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="surface-1 shadow-elev">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Segurança
            </CardTitle>
            <CardDescription>Gerencie sua senha e acesso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Password Reset */}
            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="grid gap-2">
                  <div className="font-medium">Alterar senha</div>
                  <p className="text-sm text-muted-foreground">
                    Enviaremos um link de redefinição para {user?.email}.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onSendPasswordReset}
                    disabled={sendingReset || resetEmailSent}
                    className="w-fit"
                  >
                    {sendingReset && <Loader2 className="h-4 w-4 animate-spin" />}
                    {resetEmailSent ? "Email enviado ✓" : "Enviar link de redefinição"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Email Verification Status */}
            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="flex items-start gap-3">
                {emailVerified ? (
                  <Check className="mt-0.5 h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600" />
                )}
                <div className="grid gap-1">
                  <div className="font-medium">Status do email</div>
                  {emailVerified ? (
                    <p className="text-sm text-muted-foreground">
                      Seu email foi verificado em{" "}
                      {new Date(user?.email_confirmed_at ?? "").toLocaleDateString("pt-BR")}.
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Seu email ainda não foi verificado. Verifique sua caixa de entrada.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID da conta</span>
                  <code className="text-xs">{user?.id?.slice(0, 8)}...</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Criada em</span>
                  <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Último login</span>
                  <span>{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("pt-BR") : "-"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
