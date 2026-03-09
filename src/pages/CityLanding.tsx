import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bike, MapPin, Star, Clock, Shield, CheckCircle2, Menu, X, ArrowRight, 
  Package, Sparkles, Users, Zap, DollarSign, Pill, Phone
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logoImage from "@/assets/logo-simbolo.png";
import heroRide from "@/assets/hero-ride.jpg";
import landingRequesting from "@/assets/landing-requesting.jpg";
import landingDelivery from "@/assets/landing-delivery.jpg";
import landingPharmacy from "@/assets/landing-pharmacy.jpg";
import landingDriver from "@/assets/landing-driver.jpg";
import landingHappyArrival from "@/assets/landing-happy-arrival.jpg";
import { useFranchiseBySubdomain } from "@/hooks/useFranchiseBySubdomain";
import { useCityPixels } from "@/hooks/useCityPixels";
import { Skeleton } from "@/components/ui/skeleton";

export default function CityLanding({ subdomainOverride }: { subdomainOverride?: string }) {
  const { franchise, isLoading, error, subdomain } = useFranchiseBySubdomain(subdomainOverride);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useCityPixels(franchise?.city?.id);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

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
            </div>
            <div className="space-y-3">
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full">Tentar Novamente</Button>
              <Button asChild className="w-full"><a href="https://bibimotos.com.br">Voltar para o site principal</a></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cityName = franchise.city.name;
  const stateName = franchise.city.state;
  const cityId = franchise.city.id;

  const menuItems = [
    { label: 'Início', id: 'hero' },
    { label: 'Serviços', id: 'servicos' },
    { label: 'Como Funciona', id: 'como-funciona' },
    { label: 'Motorista', id: 'motorista' },
    { label: 'Contato', id: 'contato' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* NAVBAR */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-background/95 backdrop-blur-2xl shadow-lg border-b border-border/50' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Bibi Motos" className="h-12 w-12" />
              <div>
                <h1 className={`text-xl font-black transition-colors ${scrolled ? 'text-foreground' : 'text-white'}`}>
                  Bibi<span className="text-primary">Motos</span>
                </h1>
                <p className={`text-xs font-semibold ${scrolled ? 'text-primary' : 'text-accent'}`}>
                  {cityName} - {stateName}
                </p>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {menuItems.map((item) => (
                <button key={item.id} onClick={() => scrollToSection(item.id)}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all hover:scale-105 ${
                    scrolled ? 'text-muted-foreground hover:text-foreground hover:bg-accent/20' : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >{item.label}</button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" className={scrolled ? '' : 'text-white hover:bg-white/10'} asChild>
                <Link to="/login">Entrar</Link>
              </Button>
              <Button className="btn-gradient font-bold shadow-lg" asChild>
                <Link to={`/register?role=passenger&city_id=${cityId}`}>
                  <Bike className="mr-2 h-4 w-4" />
                  Pedir Agora
                </Link>
              </Button>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-xl ${scrolled ? 'hover:bg-accent/20' : 'text-white hover:bg-white/10'}`}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-background/95 backdrop-blur-2xl border-t border-border animate-in slide-in-from-top-5">
            <div className="container mx-auto px-4 py-6 space-y-2">
              {menuItems.map((item) => (
                <button key={item.id} onClick={() => scrollToSection(item.id)}
                  className="w-full text-left px-4 py-3 rounded-xl font-medium hover:bg-accent/20 transition-colors"
                >{item.label}</button>
              ))}
              <div className="pt-4 space-y-3 border-t border-border mt-4">
                <Button variant="outline" className="w-full" asChild><Link to="/login">Entrar</Link></Button>
                <Button className="w-full" asChild><Link to={`/register?role=passenger&city_id=${cityId}`}>Pedir Agora</Link></Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
        <img src={heroRide} alt={`Bibi Motos em ${cityName}`} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-primary/40 to-primary/20" />
        <div className="absolute inset-0 bg-black/20" />

        <div className="container relative z-10 mx-auto px-4 lg:px-8 pt-32 pb-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge className="bg-accent/20 text-accent border-accent/30 px-6 py-2 text-sm backdrop-blur-sm">
              <MapPin className="h-4 w-4 mr-2" />
              Agora em {cityName}!
            </Badge>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.05] tracking-tight">
              Sua Corrida em
              <span className="block bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent">
                {cityName}
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed">
              Mototáxi e entregas rápidas na palma da sua mão. 
              <strong className="text-accent"> Segurança, agilidade e preço justo</strong> para você.
            </p>

            <div className="flex flex-wrap justify-center gap-8 py-4">
              {[
                { icon: Clock, value: "5 min", label: "Tempo médio" },
                { icon: Star, value: "4.9", label: "Avaliação" },
                { icon: Shield, value: "100%", label: "Seguro" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3 text-white">
                  <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <stat.icon className="h-6 w-6 text-accent" />
                  </div>
                  <div className="text-left">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-white/70">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg"
                className="bg-gradient-to-r from-accent via-yellow-400 to-accent hover:from-accent/90 hover:to-yellow-500 text-primary-foreground font-bold text-lg px-8 h-14 shadow-2xl shadow-accent/30 hover:shadow-accent/50 transition-all hover:scale-105 group"
                asChild
              >
                <Link to={`/register?role=passenger&city_id=${cityId}`}>
                  <Bike className="mr-2 h-5 w-5" />
                  Pedir Mototáxi
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline"
                className="border-2 border-white/30 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white font-semibold text-lg px-8 h-14"
                asChild
              >
                <Link to={`/register?role=driver&city_id=${cityId}`}>
                  <Users className="mr-2 h-5 w-5" />
                  Seja Motoboy
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-5 pt-2">
              {[
                { icon: CheckCircle2, text: "Cadastro grátis" },
                { icon: Shield, text: "Capacete incluso" },
                { icon: Clock, text: "Disponível 24h" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-white/70 text-sm">
                  <item.icon className="h-4 w-4 text-accent" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ SERVIÇOS ═══════════════════ */}
      <section id="servicos" className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">Nossos Serviços</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              O que oferecemos em <span className="text-primary">{cityName}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Serviços pensados para quem vive na correria do dia a dia.
            </p>
          </div>

          {/* Mototáxi */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
              <img src={landingRequesting} alt="Passageira solicitando corrida" className="w-full h-[380px] object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <div className="flex items-center gap-2 text-white text-sm font-medium">
                  <Clock className="h-4 w-4 text-accent" />
                  <span>Motorista em 5 minutos</span>
                </div>
              </div>
            </div>
            <div className="space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Bike className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">Mototáxi <span className="text-primary">Seguro</span></h3>
              <p className="text-muted-foreground leading-relaxed">
                Chegue mais rápido com motoristas verificados. Capacete fornecido, rastreamento em tempo real e preço justo.
              </p>
              <ul className="space-y-2">
                {["Motoristas verificados", "Capacete para passageiro", "Rastreamento em tempo real", "Pagamento via app ou dinheiro"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" /><span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button className="btn-gradient glow-primary group" asChild>
                <Link to={`/register?role=passenger&city_id=${cityId}`}>
                  Pedir Corrida <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Entregas */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="space-y-5 lg:order-1">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <Package className="h-7 w-7 text-amber-500" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">Entregas <span className="text-amber-500">Expressas</span></h3>
              <p className="text-muted-foreground leading-relaxed">
                Envie documentos, compras e encomendas com segurança. Entrega no mesmo dia com comprovação fotográfica.
              </p>
              <ul className="space-y-2">
                {["Entrega no mesmo dia", "Seguro incluso", "Foto de comprovação", "Ideal para lojas e e-commerces"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0" /><span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg group" asChild>
                <Link to={`/register?role=merchant&city_id=${cityId}`}>
                  Enviar Entrega <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl group lg:order-2">
              <img src={landingDelivery} alt="Entregador entregando pacote" className="w-full h-[380px] object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-amber-900/50 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <div className="flex items-center gap-2 text-white text-sm font-medium">
                  <Shield className="h-4 w-4 text-amber-300" /><span>Seguro incluso</span>
                </div>
              </div>
            </div>
          </div>

          {/* Farmácia */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
              <img src={landingPharmacy} alt="Entregador entregando medicamentos" className="w-full h-[380px] object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/50 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <div className="flex items-center gap-2 text-white text-sm font-medium">
                  <Pill className="h-4 w-4 text-emerald-300" /><span>Cuidado especial</span>
                </div>
              </div>
            </div>
            <div className="space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-emerald-500" />
              </div>
              <h3 className="text-3xl font-bold text-foreground">Delivery de <span className="text-emerald-500">Farmácia</span></h3>
              <p className="text-muted-foreground leading-relaxed">
                Medicamentos entregues com cuidado na sua porta. Serviço especializado com manuseio seguro.
              </p>
              <ul className="space-y-2">
                {["Manuseio especializado", "Entregas urgentes", "Disponível 7 dias por semana", "Parceria com farmácias locais"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" /><span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold shadow-lg group" asChild>
                <Link to={`/register?role=merchant&city_id=${cityId}`}>
                  Cadastrar Farmácia <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ COMO FUNCIONA ═══════════════════ */}
      <section id="como-funciona" className="py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">Como Funciona</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Simples e <span className="text-primary">rápido</span>
            </h2>
            <p className="text-lg text-muted-foreground">Do cadastro à primeira corrida em menos de 2 minutos.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative hidden lg:block">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img src={landingDriver} alt="Motorista Bibi Motos" className="w-full h-[400px] object-cover" loading="lazy" />
              </div>
              <div className="absolute -bottom-6 -right-4 w-56 h-40 rounded-2xl overflow-hidden shadow-2xl border-4 border-background">
                <img src={landingHappyArrival} alt="Passageira feliz" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="absolute top-4 -left-4 bg-card/95 backdrop-blur-xl border border-border px-4 py-3 rounded-xl shadow-lg animate-float">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold">Verificado</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {[
                { step: "01", icon: MapPin, title: "Informe seu destino", desc: "Abra o app e digite para onde quer ir.", color: "text-primary bg-primary/20 group-hover:bg-primary group-hover:text-primary-foreground" },
                { step: "02", icon: Users, title: "Motoboy a caminho", desc: "Em segundos encontramos o motorista mais próximo.", color: "text-accent bg-accent/20 group-hover:bg-accent group-hover:text-accent-foreground" },
                { step: "03", icon: Bike, title: "Viaje com segurança", desc: "Acompanhe o trajeto em tempo real.", color: "text-emerald-500 bg-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white" },
                { step: "04", icon: Star, title: "Chegou! Avalie", desc: "Avalie o motorista e ganhe pontos.", color: "text-amber-500 bg-amber-500/20 group-hover:bg-amber-500 group-hover:text-white" },
              ].map((item, i) => (
                <div key={i} className="flex gap-5 group cursor-default">
                  <div className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors duration-300 ${item.color}`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    {i < 3 && <div className="w-0.5 h-8 bg-gradient-to-b from-primary/50 to-transparent mt-2" />}
                  </div>
                  <div className="pt-1 pb-2">
                    <span className="text-xs font-bold text-primary block tracking-wider">PASSO {item.step}</span>
                    <h3 className="text-lg font-bold mb-1 text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ SEJA MOTORISTA ═══════════════════ */}
      <section id="motorista" className="py-24 relative overflow-hidden">
        <img src={landingDriver} alt="Motorista Bibi Motos" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-primary/70" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-white space-y-6">
              <Badge className="bg-white/20 text-white border-white/30">
                💰 Oportunidade
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">
                Seja motorista em <span className="text-accent">{cityName}</span>
              </h2>
              <p className="text-lg text-white/85 leading-relaxed">
                Trabalhe no seu horário, ganhe por corrida com bônus em horários de pico. Cadastro gratuito e aprovação rápida.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: DollarSign, title: "Ganhos livres", desc: "Receba por cada corrida" },
                  { icon: Clock, title: "Seu horário", desc: "Você decide quando trabalhar" },
                  { icon: Shield, title: "Seguro", desc: "Cobertura durante corridas" },
                  { icon: Star, title: "Bônus", desc: "Ganhe mais no pico" },
                ].map((item, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <item.icon className="h-5 w-5 text-accent mb-2" />
                    <h4 className="font-bold text-sm">{item.title}</h4>
                    <p className="text-xs text-white/70">{item.desc}</p>
                  </div>
                ))}
              </div>

              <Button size="lg" className="bg-accent hover:bg-accent/90 text-primary-foreground font-bold text-lg px-8 h-14 shadow-2xl group" asChild>
                <Link to={`/register?role=driver&city_id=${cityId}`}>
                  <Bike className="mr-2 h-5 w-5" />
                  Cadastrar como Motorista
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <p className="text-sm text-white/60 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Cadastro gratuito • Aprovação em até 24h
              </p>
            </div>

            {/* Testimonial */}
            <div className="hidden lg:block">
              <div className="bg-card/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-border">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full overflow-hidden">
                    <img src={landingHappyArrival} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Carlos S.</h4>
                    <p className="text-sm text-muted-foreground">Motorista em {cityName}</p>
                    <div className="flex gap-0.5 mt-1">
                      {[1,2,3,4,5].map(s => <Star key={s} className="h-3.5 w-3.5 fill-accent text-accent" />)}
                    </div>
                  </div>
                </div>
                <blockquote className="text-foreground leading-relaxed italic">
                  "Minha renda aumentou 40% desde que comecei. A plataforma é fácil de usar e o suporte é excelente."
                </blockquote>
                <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-border">
                  <div className="text-center">
                    <div className="text-xl font-black text-primary">R$4.200</div>
                    <div className="text-xs text-muted-foreground">Ganho/mês</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-black text-primary">4.9★</div>
                    <div className="text-xs text-muted-foreground">Avaliação</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-black text-primary">320</div>
                    <div className="text-xs text-muted-foreground">Corridas/mês</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA FINAL ═══════════════════ */}
      <section id="contato" className="py-24 relative overflow-hidden">
        <img src={landingHappyArrival} alt="Passageira feliz" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/80" />

        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
          <div className="max-w-3xl mx-auto space-y-8 text-white">
            <Badge className="bg-white/20 text-white border-white/30">
              <Zap className="h-4 w-4 mr-2" />
              Comece Agora
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black">
              Pronto para sua primeira corrida em <span className="text-accent">{cityName}</span>?
            </h2>
            <p className="text-xl text-white/80">
              Cadastre-se grátis em 30 segundos. Sem cartão, sem compromisso.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg"
                className="bg-white text-primary hover:bg-white/90 font-bold text-lg px-10 h-14 shadow-2xl hover:scale-105 transition-all group"
                asChild
              >
                <Link to={`/register?role=passenger&city_id=${cityId}`}>
                  <Bike className="mr-2 h-5 w-5" />
                  Criar Conta Grátis
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline"
                className="border-2 border-white/40 bg-transparent hover:bg-white/10 text-white font-semibold text-lg px-10 h-14"
                asChild
              >
                <Link to={`/register?role=driver&city_id=${cityId}`}>
                  <Shield className="mr-2 h-5 w-5" />
                  Seja Motorista
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
              <a href="https://bibimotos.com.br" className="hover:text-foreground transition-colors">Site Principal</a>
              <Link to="/login" className="hover:text-foreground transition-colors">Entrar</Link>
              <Link to={`/register?city_id=${cityId}`} className="hover:text-foreground transition-colors">Cadastrar</Link>
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
