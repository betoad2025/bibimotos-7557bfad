import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import heroRide from "@/assets/hero-ride.jpg";
import { Badge } from "@/components/ui/badge";
import { 
  Bike, 
  MapPin, 
  Star, 
  Clock, 
  Shield,
  CheckCircle2,
  Phone,
  Menu,
  X,
  ArrowRight,
  Package,
  Sparkles,
  Users,
  Zap
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logoImage from "@/assets/logo-simbolo.png";
import { useFranchiseBySubdomain } from "@/hooks/useFranchiseBySubdomain";
import { useCityPixels } from "@/hooks/useCityPixels";
import { Skeleton } from "@/components/ui/skeleton";

export default function CityLanding({ subdomainOverride }: { subdomainOverride?: string }) {
  const { franchise, isLoading, error, subdomain } = useFranchiseBySubdomain(subdomainOverride);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Inject marketing pixels for this city
  useCityPixels(franchise?.city?.id);
  
  // Base path para links internos (preserva contexto da cidade)
  const cityBasePath = subdomain ? `/cidade/${subdomain}` : '';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={logoImage} alt="Bibi Motos" className="h-20 w-20 mx-auto animate-pulse" />
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // Error state - cidade não encontrada
  if (error || !franchise) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="h-20 w-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <MapPin className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Cidade não encontrada</h1>
              <p className="text-muted-foreground">
                O subdomínio <strong>{subdomain}</strong> não está associado a nenhuma cidade ativa.
              </p>
              {error && (
                <p className="text-xs text-muted-foreground/60 mt-2">
                  Detalhe: {error}
                </p>
              )}
            </div>
            <div className="space-y-3">
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                Tentar Novamente
              </Button>
              <Button asChild className="w-full">
                <a href="https://bibimotos.com.br">
                  Voltar para o site principal
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cityName = franchise.city.name;
  const stateName = franchise.city.state;

  const menuItems = [
    { label: 'Início', id: 'hero' },
    { label: 'Serviços', id: 'servicos' },
    { label: 'Como Funciona', id: 'como-funciona' },
    { label: 'Contato', id: 'contato' },
  ];

  const services = [
    {
      icon: Bike,
      title: "Mototáxi",
      description: "Transporte rápido e seguro para qualquer lugar da cidade.",
      color: "from-primary to-primary/80",
    },
    {
      icon: Package,
      title: "Entregas",
      description: "Delivery de documentos, compras e encomendas em minutos.",
      color: "from-amber-500 to-orange-500",
    },
    {
      icon: Sparkles,
      title: "Delivery de Farmácia",
      description: "Medicamentos entregues com segurança e rapidez.",
      color: "from-emerald-500 to-green-500",
    },
  ];

  const steps = [
    { step: "01", title: "Baixe o App", description: "Disponível para Android e iOS" },
    { step: "02", title: "Solicite", description: "Informe origem e destino" },
    { step: "03", title: "Acompanhe", description: "Veja seu motoboy em tempo real" },
    { step: "04", title: "Chegue", description: "Rápido, seguro e econômico" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* NAVBAR */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-background/95 backdrop-blur-2xl shadow-lg border-b border-border/50' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Bibi Motos" className="h-12 w-12" />
              <div>
                <h1 className={`text-xl font-black transition-colors ${scrolled ? 'text-foreground' : 'text-white'}`}>
                  Bibi<span className="text-primary">Motos</span>
                </h1>
                <p className={`text-xs font-semibold ${scrolled ? 'text-primary' : 'text-amber-300'}`}>
                  {cityName} - {stateName}
                </p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all hover:scale-105 ${
                    scrolled 
                      ? 'text-muted-foreground hover:text-foreground hover:bg-accent' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" className={scrolled ? '' : 'text-white hover:bg-white/10'} asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button 
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary font-bold shadow-lg"
                asChild
              >
                <Link to="/register">
                  <Bike className="mr-2 h-4 w-4" />
                  Pedir Agora
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-xl transition-colors ${scrolled ? 'hover:bg-accent' : 'text-white hover:bg-white/10'}`}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-background/95 backdrop-blur-2xl border-t border-border animate-in slide-in-from-top-5 duration-300">
            <div className="container mx-auto px-4 py-6 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="w-full text-left px-4 py-3 rounded-xl font-medium hover:bg-accent transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4 space-y-3 border-t border-border mt-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link to="/register">Pedir Agora</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
        {/* Cinematic Background Image */}
        <img
          src={heroRide}
          alt={`Bibi Motos em ${cityName}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-primary/40 to-primary/20" />
        <div className="absolute inset-0 bg-black/30" />

        <div className="container relative z-10 mx-auto px-4 lg:px-8 pt-32 pb-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <Badge className="bg-amber-400/20 text-amber-200 border-amber-400/30 px-6 py-2 text-sm backdrop-blur-sm">
              <MapPin className="h-4 w-4 mr-2" />
              Agora em {cityName}!
            </Badge>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight">
              Sua Corrida em
              <span className="block bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                {cityName}
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              Mototáxi e entregas rápidas na palma da sua mão. 
              <strong className="text-amber-300"> Segurança, agilidade e preço justo</strong> para você.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 py-4">
              {[
                { icon: Clock, value: "5 min", label: "Tempo médio" },
                { icon: Star, value: "4.9", label: "Avaliação" },
                { icon: Shield, value: "100%", label: "Seguro" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3 text-white">
                  <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-amber-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-white/70">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-bold text-lg px-8 h-14 shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all hover:scale-105 group"
                asChild
              >
                <Link to={`/register?role=passenger&city_id=${franchise.city.id}`}>
                  <Bike className="mr-2 h-5 w-5" />
                  Pedir Mototáxi
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white/30 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white font-semibold text-lg px-8 h-14"
                asChild
              >
                <Link to={`/register?role=driver&city_id=${franchise.city.id}`}>
                  <Users className="mr-2 h-5 w-5" />
                  Seja Motoboy
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section id="servicos" className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">Nossos Serviços</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              O que oferecemos em <span className="text-primary">{cityName}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transporte e entregas com a qualidade e segurança que você merece.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {services.map((service, i) => (
              <Card key={i} className="group hover:shadow-xl transition-all hover:-translate-y-1 border-0 shadow-lg">
                <CardContent className="p-8 text-center">
                  <div className={`h-16 w-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <service.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">Como Funciona</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Simples e <span className="text-primary">rápido</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {steps.map((item, i) => (
              <div key={i} className="relative text-center group">
                <div className="relative inline-block mb-6">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="text-3xl font-black text-primary group-hover:text-white transition-colors">
                      {item.step}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section id="contato" className="py-24 bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <Badge className="bg-white/20 text-white border-white/30">
              <Zap className="h-4 w-4 mr-2" />
              Comece Agora
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              Pronto para sua primeira corrida em {cityName}?
            </h2>
            <p className="text-xl text-white/80">
              Cadastre-se grátis e solicite sua corrida em minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-bold text-lg px-8 h-14 shadow-2xl"
                asChild
              >
                <Link to={`/register?role=passenger&city_id=${franchise.city.id}`}>
                  <Bike className="mr-2 h-5 w-5" />
                  Criar Conta Grátis
                </Link>
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white/50 bg-transparent hover:bg-white/10 text-white font-semibold text-lg px-8 h-14"
                asChild
              >
                <Link to="/login">
                  Já tenho conta
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-background border-t">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Bibi Motos" className="h-10 w-10" />
              <div>
                <h3 className="font-bold">BibiMotos {cityName}</h3>
                <p className="text-sm text-muted-foreground">{stateName}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="https://bibimotos.com.br" className="hover:text-foreground transition-colors">
                Site Principal
              </a>
              <Link to="/login" className="hover:text-foreground transition-colors">
                Entrar
              </Link>
              <Link to="/register" className="hover:text-foreground transition-colors">
                Cadastrar
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Bibi Motos. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
