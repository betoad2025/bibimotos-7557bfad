import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import notFoundHero from "@/assets/404-hero.jpg";
import logoFull from "@/assets/logo-full.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Cinematic Background */}
      <img
        src={notFoundHero}
        alt="Caminho não encontrado"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />

      <div className="relative z-10 text-center px-4 max-w-lg">
        <img src={logoFull} alt="Bibi Motos" className="h-12 mx-auto mb-8" />
        <h1 className="text-8xl font-black text-white mb-4 drop-shadow-2xl">404</h1>
        <p className="text-xl text-white/80 mb-8 drop-shadow-md">
          Ops! Parece que esta rota não existe. Vamos te levar de volta.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="btn-gradient" asChild>
            <Link to="/">
              <Home className="mr-2 h-5 w-5" />
              Voltar ao Início
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" asChild>
            <Link to="/login">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Fazer Login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
