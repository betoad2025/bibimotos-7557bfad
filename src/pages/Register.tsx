import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bike, Mail, Lock, User, Phone, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UserType = "passenger" | "driver" | "merchant";

const Register = () => {
  const [userType, setUserType] = useState<UserType>("passenger");
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
    setIsLoading(true);
    // TODO: Implement register logic
    setTimeout(() => setIsLoading(false), 1000);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center glow-primary">
              <Bike className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">
              <span className="text-foreground">Bibi</span>
              <span className="text-accent">Motos</span>
            </span>
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
                  className="pl-10 h-12 bg-input border-border"
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
                  className="pl-10 h-12 bg-input border-border"
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
                  className="pl-10 h-12 bg-input border-border"
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
                  className="pl-10 h-12 bg-input border-border"
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
                  className="pl-10 h-12 bg-input border-border"
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
              className="w-full h-12 btn-gradient text-lg"
              disabled={isLoading}
            >
              {isLoading ? "Cadastrando..." : "Criar conta"}
            </Button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-muted-foreground">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-accent/20 to-primary/10 p-8">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-accent/20 flex items-center justify-center animate-float">
            <Bike className="h-16 w-16 text-accent" />
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Junte-se a <span className="text-gradient-accent">milhares</span> de usuários
          </h2>
          <p className="text-muted-foreground">
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
