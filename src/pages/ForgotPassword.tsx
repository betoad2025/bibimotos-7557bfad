import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Phone, KeyRound, Lock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import loginHero from "@/assets/login-hero.jpg";
import logoFull from "@/assets/logo-full.png";

type Step = 'phone' | 'code' | 'password' | 'success';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      toast({ title: "Erro", description: "Digite um telefone válido", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('password-reset', {
        body: { phone: phone.replace(/\D/g, ''), action: 'request' }
      });
      if (error || !data?.success) throw new Error(data?.error || 'Erro ao enviar código');
      toast({ title: "Código enviado!", description: "Verifique seu SMS" });
      setStep('code');
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast({ title: "Erro", description: "Digite o código de 6 dígitos", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('password-reset', {
        body: { phone: phone.replace(/\D/g, ''), code, action: 'verify' }
      });
      if (error || !data?.success) throw new Error(data?.error || 'Código inválido');
      toast({ title: "Código verificado!", description: "Agora defina sua nova senha" });
      setStep('password');
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('password-reset', {
        body: { phone: phone.replace(/\D/g, ''), newPassword, action: 'reset' }
      });
      if (error || !data?.success) throw new Error(data?.error || 'Erro ao redefinir senha');
      setStep('success');
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </Link>

          <div className="flex items-center gap-3 mb-10">
            <img src={logoFull} alt="Bibi Motos" className="h-12" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Recuperar Senha</h1>
            <p className="text-muted-foreground">
              {step === 'phone' && "Digite seu telefone para receber o código"}
              {step === 'code' && "Digite o código recebido por SMS"}
              {step === 'password' && "Defina sua nova senha"}
              {step === 'success' && "Senha alterada com sucesso!"}
            </p>
          </div>

          {step === 'phone' && (
            <form onSubmit={handleRequestCode} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    className="pl-10 h-12 bg-muted/50 border-border rounded-xl"
                    maxLength={15}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 btn-gradient text-lg rounded-xl font-semibold" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar código"}
              </Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="code">Código de verificação</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="pl-10 h-12 text-center text-2xl tracking-widest bg-muted/50 border-border rounded-xl"
                    maxLength={6}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Código enviado para {phone}
                </p>
              </div>
              <Button type="submit" className="w-full h-12 btn-gradient text-lg rounded-xl font-semibold" disabled={isLoading}>
                {isLoading ? "Verificando..." : "Verificar código"}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('phone')}>
                Reenviar código
              </Button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 h-12 bg-muted/50 border-border rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-12 bg-muted/50 border-border rounded-xl"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 btn-gradient text-lg rounded-xl font-semibold" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Redefinir senha"}
              </Button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <p className="text-muted-foreground">
                Sua senha foi alterada com sucesso. Agora você pode fazer login com a nova senha.
              </p>
              <Button onClick={() => navigate('/login')} className="w-full h-12 btn-gradient text-lg rounded-xl font-semibold">
                Ir para o login
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Cinematic Hero Image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src={loginHero}
          alt="Bibi Motos - Recuperar senha"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent" />

        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">
            Bibi Motos <span className="text-accent">Brasil</span>
          </h2>
          <p className="text-lg text-white/90 max-w-md drop-shadow-md">
            Recupere o acesso à sua conta de forma rápida e segura.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
