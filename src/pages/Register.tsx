import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bike, Mail, Lock, User, Phone, ArrowLeft, Loader2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import registerHero from "@/assets/register-hero.jpg";
import logoFull from "@/assets/logo-full.png";

type UserType = "passenger" | "driver" | "merchant";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp } = useAuth();
  const { toast } = useToast();
  
  // Read role and city_id from URL params
  const roleFromUrl = searchParams.get('role') as UserType | null;
  const cityIdFromUrl = searchParams.get('city_id');
  
  const [userType, setUserType] = useState<UserType>(
    roleFromUrl && ['passenger', 'driver', 'merchant'].includes(roleFromUrl) 
      ? roleFromUrl 
      : "passenger"
  );

  // Sync with URL param changes
  useEffect(() => {
    if (roleFromUrl && ['passenger', 'driver', 'merchant'].includes(roleFromUrl)) {
      setUserType(roleFromUrl);
    }
  }, [roleFromUrl]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(formData.email, formData.password, formData.name, {
      user_type: userType,
      city_id: cityIdFromUrl || undefined,
      phone: formData.phone || undefined,
    });

    if (!error) {
      toast({
        title: "Conta criada com sucesso! 🎉",
        description: "Você já pode fazer login e começar a usar.",
      });
      navigate("/login");
    }

    setIsLoading(false);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <img src={logoFull} alt="Bibi Motos" className="h-12" />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Crie sua conta</h1>
            <p className="text-muted-foreground">Escolha seu perfil e comece agora</p>
          </div>

          {/* User type tabs */}
          <Tabs value={userType} onValueChange={(v) => setUserType(v as UserType)} className="mb-6">
            <TabsList className="grid grid-cols-3 h-12 bg-secondary">
              <TabsTrigger value="passenger" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Passageiro
              </TabsTrigger>
              <TabsTrigger value="driver" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Motoboy
              </TabsTrigger>
              <TabsTrigger value="merchant" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Comerciante
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="pl-10 h-12 bg-muted/50 border-border rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="pl-10 h-12 bg-muted/50 border-border rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="pl-10 h-12 bg-muted/50 border-border rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  className="pl-10 h-12 bg-muted/50 border-border rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  className="pl-10 h-12 bg-muted/50 border-border rounded-xl"
                  required
                />
              </div>
            </div>

            {userType === "driver" && (
              <div className="glass-card p-4 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  📋 Após o cadastro, você precisará enviar seus documentos (CNH, CRLV, comprovante de residência) para aprovação.
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 btn-gradient text-lg rounded-xl font-semibold shadow-lg shadow-primary/25"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>

          {/* Login link */}
          <p className="mt-8 text-center text-muted-foreground">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Cinematic Hero Image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src={registerHero}
          alt="Bibi Motos - Cadastre-se"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent" />

        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">
            Bibi Motos <span className="text-accent">Brasil</span>
          </h2>
          <p className="text-lg text-white/90 max-w-md drop-shadow-md">
            {userType === "passenger" && "Viaje com segurança e agilidade para qualquer lugar da cidade."}
            {userType === "driver" && "Ganhe dinheiro extra com flexibilidade e autonomia."}
            {userType === "merchant" && "Entregue seus produtos de forma rápida e confiável."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
