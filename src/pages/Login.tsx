import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import loginHero from "@/assets/login-hero.jpg";
import logoFull from "@/assets/logo-full.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();

  // Load saved email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("bibi_saved_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Save or remove email based on remember me
    if (rememberMe) {
      localStorage.setItem("bibi_saved_email", email);
    } else {
      localStorage.removeItem("bibi_saved_email");
    }

    const { error } = await signIn(email, password);

    if (!error) {
      navigate("/dashboard");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
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
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Bem-vindo de volta
            </h1>
            <p className="text-muted-foreground">
              Entre com sua conta para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-muted/50 border-border rounded-xl focus:ring-2 focus:ring-primary/30 transition-all"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-12 h-12 bg-muted/50 border-border rounded-xl focus:ring-2 focus:ring-primary/30 transition-all"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) =>
                  setRememberMe(checked as boolean)
                }
              />
              <Label
                htmlFor="remember"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Lembrar meu email
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 btn-gradient text-lg rounded-xl font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          {/* Register link */}
          <p className="mt-8 text-center text-muted-foreground">
            Não tem uma conta?{" "}
            <Link
              to="/register"
              className="text-primary font-semibold hover:underline"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Cinematic Hero Image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src={loginHero}
          alt="Bibi Motos - Mobilidade urbana no Brasil"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-transparent" />

        {/* Text overlay */}
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">
            Bibi Motos <span className="text-accent">Brasil</span>
          </h2>
          <p className="text-lg text-white/90 max-w-md drop-shadow-md">
            Conectamos passageiros, motoristas e comerciantes em uma plataforma
            completa de transporte e entregas por todo o Brasil.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
