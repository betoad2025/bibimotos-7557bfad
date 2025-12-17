import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bike, Mail, Lock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement login logic
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Bem-vindo de volta</h1>
            <p className="text-muted-foreground">Entre com sua conta para continuar</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-input border-border"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-input border-border"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 btn-gradient text-lg"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-muted-foreground">
            Não tem uma conta?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-primary/20 to-accent/10 p-8">
        <div className="text-center max-w-md">
          <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-primary/20 flex items-center justify-center animate-float">
            <Bike className="h-16 w-16 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Sua cidade, <span className="text-gradient-primary">sua mobilidade</span>
          </h2>
          <p className="text-muted-foreground">
            Conectamos passageiros, motoristas e comerciantes em uma plataforma completa de transporte e entregas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
