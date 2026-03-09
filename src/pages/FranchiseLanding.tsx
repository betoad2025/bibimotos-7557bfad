import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Bike, 
  MapPin, 
  Star, 
  Clock, 
  Zap, 
  TrendingUp, 
  Users, 
  Award,
  Shield,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MessageCircle,
  Crown,
  Rocket,
  Building2,
  BarChart3,
  Smartphone,
  HeadphonesIcon,
  Video,
  Target,
  DollarSign,
  Percent,
  Calendar,
  ArrowRight,
  Play,
  Menu,
  X,
  Globe,
  Lock,
  Sparkles,
  Timer,
  Gift,
  ExternalLink,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/logo-simbolo.png";

// Todos os estados brasileiros
const BRAZILIAN_STATES = [
  { uf: "AC", name: "Acre", cities: 22 },
  { uf: "AL", name: "Alagoas", cities: 102 },
  { uf: "AP", name: "Amapá", cities: 16 },
  { uf: "AM", name: "Amazonas", cities: 62 },
  { uf: "BA", name: "Bahia", cities: 417 },
  { uf: "CE", name: "Ceará", cities: 184 },
  { uf: "DF", name: "Distrito Federal", cities: 1 },
  { uf: "ES", name: "Espírito Santo", cities: 78 },
  { uf: "GO", name: "Goiás", cities: 246 },
  { uf: "MA", name: "Maranhão", cities: 217 },
  { uf: "MT", name: "Mato Grosso", cities: 141 },
  { uf: "MS", name: "Mato Grosso do Sul", cities: 79 },
  { uf: "MG", name: "Minas Gerais", cities: 853 },
  { uf: "PA", name: "Pará", cities: 144 },
  { uf: "PB", name: "Paraíba", cities: 223 },
  { uf: "PR", name: "Paraná", cities: 399 },
  { uf: "PE", name: "Pernambuco", cities: 185 },
  { uf: "PI", name: "Piauí", cities: 224 },
  { uf: "RJ", name: "Rio de Janeiro", cities: 92 },
  { uf: "RN", name: "Rio Grande do Norte", cities: 167 },
  { uf: "RS", name: "Rio Grande do Sul", cities: 497 },
  { uf: "RO", name: "Rondônia", cities: 52 },
  { uf: "RR", name: "Roraima", cities: 15 },
  { uf: "SC", name: "Santa Catarina", cities: 295 },
  { uf: "SP", name: "São Paulo", cities: 645 },
  { uf: "SE", name: "Sergipe", cities: 75 },
  { uf: "TO", name: "Tocantins", cities: 139 },
];

const TOTAL_CITIES = BRAZILIAN_STATES.reduce((acc, state) => acc + state.cities, 0);

interface City {
  id: string;
  name: string;
  state: string;
  subdomain: string;
}

export default function FranchiseLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showCities, setShowCities] = useState(false);
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '', city: '', state: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operatingCities, setOperatingCities] = useState<City[]>([]);
  const [citySearch, setCitySearch] = useState("");
  const [statesPage, setStatesPage] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const STATES_PER_PAGE = 9;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Carregar cidades operando do banco
  useEffect(() => {
    const fetchCities = async () => {
      const { data } = await supabase
        .from('cities')
        .select('id, name, state, subdomain')
        .eq('is_active', true);
      
      if (data) setOperatingCities(data);
    };
    fetchCities();
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleCityClick = (city: City) => {
    window.open(`https://${city.subdomain}.bibimotos.com.br`, '_blank');
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone || !leadForm.city) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      // Check for existing lead with same phone or email
      const phone = leadForm.phone.replace(/\D/g, '');
      const { data: existingByPhone } = await supabase
        .from('franchise_leads')
        .select('id, name, city')
        .eq('phone', phone)
        .maybeSingle();

      if (existingByPhone) {
        toast({ 
          title: "Cadastro já existe!", 
          description: `${existingByPhone.name} já está registrado(a) para ${existingByPhone.city}. Nossa equipe entrará em contato.`,
        });
        setIsSubmitting(false);
        return;
      }

      if (leadForm.email) {
        const { data: existingByEmail } = await supabase
          .from('franchise_leads')
          .select('id, name, city')
          .eq('email', leadForm.email)
          .maybeSingle();

        if (existingByEmail) {
          toast({ 
            title: "Email já cadastrado!", 
            description: `Este email já está registrado para ${existingByEmail.city}.`,
          });
          setIsSubmitting(false);
          return;
        }
      }

      const { error } = await supabase.from('franchise_leads').insert({
        name: leadForm.name,
        phone: phone,
        email: leadForm.email || null,
        city: leadForm.city,
        state: leadForm.state || null,
        source_page: 'franquia',
      });
      
      if (error) {
        if (error.code === '23505') {
          toast({ title: "Cadastro já existe!", description: "Você já registrou interesse. Nossa equipe entrará em contato.", variant: "destructive" });
        } else {
          throw error;
        }
      } else {
        toast({ title: "Interesse registrado!", description: "Nossa equipe entrará em contato em breve." });
        setLeadForm({ name: '', phone: '', email: '', city: '', state: '' });
      }
    } catch (error) {
      toast({ title: "Erro ao enviar", description: "Tente novamente", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  // Estados paginados
  const paginatedStates = useMemo(() => {
    const start = statesPage * STATES_PER_PAGE;
    return BRAZILIAN_STATES.slice(start, start + STATES_PER_PAGE);
  }, [statesPage]);

  const totalStatePages = Math.ceil(BRAZILIAN_STATES.length / STATES_PER_PAGE);

  // Filtrar cidades por busca
  const filteredCities = useMemo(() => {
    if (!citySearch) return operatingCities;
    const search = citySearch.toLowerCase();
    return operatingCities.filter(
      c => c.name.toLowerCase().includes(search) || c.state.toLowerCase().includes(search)
    );
  }, [operatingCities, citySearch]);

  const menuItems = [
    { label: 'Início', id: 'hero' },
    { label: 'Vantagens', id: 'vantagens' },
    { label: 'Cidades', id: 'cidades' },
    { label: 'Investimento', id: 'investimento' },
    { label: 'FAQ', id: 'faq' },
  ];

  const advantages = [
    {
      icon: Percent,
      title: "Zero Comissão",
      description: "100% do faturamento é seu. Sem taxas sobre corridas.",
      color: "from-emerald-500 to-green-600",
    },
    {
      icon: Building2,
      title: "Painel Completo",
      description: "Gerencie motoristas, corridas, finanças e marketing.",
      color: "from-violet-500 to-purple-600",
    },
    {
      icon: DollarSign,
      title: "Mensalidade Fixa",
      description: "Valor acessível, sem surpresas ou taxas escondidas.",
      color: "from-blue-500 to-cyan-600",
    },
    {
      icon: HeadphonesIcon,
      title: "Suporte 24/7",
      description: "Equipe dedicada para implantação e operação.",
      color: "from-orange-500 to-amber-600",
    },
    {
      icon: Video,
      title: "Marketing Incluso",
      description: "Vídeos, artes e estratégias prontas para usar.",
      color: "from-pink-500 to-rose-600",
    },
    {
      icon: Rocket,
      title: "Lançamento em 7 Dias",
      description: "Da assinatura ao funcionamento em uma semana.",
      color: "from-indigo-500 to-blue-600",
    }
  ];

  const stats = [
    { value: operatingCities.length + "+", label: "Cidades Ativas", icon: MapPin },
    { value: "R$ 15k+", label: "Faturamento Médio", icon: TrendingUp },
    { value: "0%", label: "Comissões", icon: Percent },
    { value: "7 dias", label: "Implantação", icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* NAVBAR - Glassmorphism Premium */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-background/80 backdrop-blur-2xl shadow-2xl border-b border-border/50' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                <img src={logoImage} alt="Bibi Motos" className="h-12 w-12 relative z-10" />
              </div>
              <div>
                <h1 className={`text-xl font-black transition-colors ${scrolled ? 'text-foreground' : 'text-white'}`}>
                  Bibi<span className="text-primary">Motos</span>
                </h1>
                <p className={`text-xs font-semibold tracking-wider ${scrolled ? 'text-primary' : 'text-primary/80'}`}>
                  FRANQUIAS
                </p>
              </div>
            </Link>

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
                className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all hover:scale-105"
                onClick={() => scrollToSection('contato')}
              >
                <Crown className="mr-2 h-4 w-4" />
                Quero Minha Franquia
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
                <Button className="w-full bg-gradient-to-r from-amber-400 to-yellow-400 text-black font-bold" onClick={() => scrollToSection('contato')}>
                  <Crown className="mr-2 h-4 w-4" />
                  Quero Minha Franquia
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* HERO - Ultra Premium */}
      <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
        
        {/* Animated Mesh */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,200,0,0.3),transparent)]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-400/30 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-400/20 rounded-full blur-[100px]" />
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:80px_80px]" />

        <div className="container relative z-10 mx-auto px-4 lg:px-8 pt-32 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left space-y-8">
                {/* Badges */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <Badge className="bg-amber-400/20 text-amber-200 border-amber-400/30 px-4 py-2 backdrop-blur-sm">
                    <Rocket className="h-4 w-4 mr-2" />
                    Oportunidade Exclusiva
                  </Badge>
                  <Badge className="bg-green-400/20 text-green-200 border-green-400/30 px-4 py-2 backdrop-blur-sm animate-pulse">
                    <Timer className="h-4 w-4 mr-2" />
                    Vagas Limitadas
                  </Badge>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight">
                  Seja Dono do
                  <span className="block bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                    Uber de Motos
                  </span>
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold opacity-90">da Sua Cidade</span>
                </h1>

                {/* Subheadline */}
                <p className="text-lg sm:text-xl text-white/80 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  A <strong className="text-amber-300">única franquia</strong> que te dá{" "}
                  <strong className="text-white">100% do controle</strong>. Sem comissões, sem royalties.{" "}
                  <strong className="text-amber-300">O faturamento é todo seu.</strong>
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-bold text-lg px-8 h-14 shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 transition-all hover:scale-105 group"
                    onClick={() => scrollToSection('contato')}
                  >
                    <Crown className="mr-2 h-5 w-5" />
                    Garantir Minha Cidade
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/30 bg-white/5 backdrop-blur-sm hover:bg-white/10 text-white font-semibold text-lg px-8 h-14"
                    onClick={() => scrollToSection('vantagens')}
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Saiba Mais
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4">
                  {["Zero Comissão", "Painel Próprio", "Suporte Total"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-white/90">
                      <div className="h-8 w-8 rounded-full bg-green-400/20 flex items-center justify-center backdrop-blur-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      </div>
                      <span className="text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right - Stats Cards */}
              <div className="hidden lg:grid grid-cols-2 gap-4">
                {stats.map((stat, i) => (
                  <Card 
                    key={i}
                    className="bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/15 transition-all hover:scale-105 hover:-translate-y-1 cursor-default group"
                  >
                    <CardContent className="p-6">
                      <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${
                        i === 0 ? 'from-amber-400 to-yellow-500' :
                        i === 1 ? 'from-green-400 to-emerald-500' :
                        i === 2 ? 'from-purple-400 to-violet-500' :
                        'from-blue-400 to-cyan-500'
                      } flex items-center justify-center mb-4 shadow-xl group-hover:scale-110 transition-transform`}>
                        <stat.icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="text-3xl font-black text-amber-300">{stat.value}</h3>
                      <p className="text-white/70 font-medium">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <button 
          onClick={() => scrollToSection('vantagens')}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-white animate-bounce transition-colors"
        >
          <ChevronDown className="h-8 w-8" />
        </button>
      </section>

      {/* Social Proof Bar */}
      {operatingCities.length > 0 && (
        <section className="py-6 bg-gradient-to-r from-primary/90 to-primary border-y border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap items-center justify-center gap-4 text-white">
              <span className="text-white/70 font-medium">Já operando em:</span>
              <div className="flex flex-wrap justify-center gap-2">
                {operatingCities.slice(0, 6).map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleCityClick(city)}
                    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-all hover:scale-105 flex items-center gap-2 backdrop-blur-sm"
                  >
                    <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                    {city.name}/{city.state}
                  </button>
                ))}
                {operatingCities.length > 6 && (
                  <span className="px-4 py-2 text-white/70 text-sm">
                    +{operatingCities.length - 6} cidades
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* VANTAGENS */}
      <section id="vantagens" className="py-24 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Por Que Escolher
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
              A Franquia Que Mais <span className="text-primary">Entrega</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Diferente de todas as outras, aqui você é o dono de verdade
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {advantages.map((item, i) => (
              <Card 
                key={i}
                className="group relative overflow-hidden border-0 bg-card hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-default"
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <CardContent className="p-8 relative z-10">
                  <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Banner */}
          <div className="mt-16 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground border-0 overflow-hidden">
              <CardContent className="p-8 md:p-12 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-shrink-0">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-2xl">
                      <Crown className="h-10 w-10 text-black" />
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl md:text-3xl font-bold mb-3">
                      Você é o Dono, Não um Parceiro
                    </h3>
                    <p className="text-primary-foreground/80 max-w-xl">
                      Pague apenas a mensalidade fixa e fique com <strong className="text-amber-300">100% do faturamento</strong>. Zero royalties, zero comissões.
                    </p>
                  </div>
                  
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold shadow-xl"
                    onClick={() => scrollToSection('contato')}
                  >
                    Quero Ser Dono
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CIDADES - Escalável para todo Brasil */}
      <section id="cidades" className="py-24 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-amber-500/10 text-amber-600 border-amber-500/20">
              Oportunidade Nacional
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
              <span className="text-primary">{TOTAL_CITIES.toLocaleString()}</span> Cidades
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Todo o Brasil está esperando. Escolha sua cidade e seja pioneiro.
            </p>
          </div>

          {/* Cidades Ativas - Expansível */}
          {operatingCities.length > 0 && (
            <div className="max-w-4xl mx-auto mb-12">
              <Card className="border-2 border-green-500/20 bg-green-500/5 overflow-hidden">
                <button
                  onClick={() => setShowCities(!showCities)}
                  className="w-full p-6 flex items-center justify-between hover:bg-green-500/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                        Cidades em Operação
                      </h3>
                      <p className="text-muted-foreground">
                        {operatingCities.length} franquias ativas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-500 text-white border-0 text-lg px-4">
                      {operatingCities.length}
                    </Badge>
                    {showCities ? <ChevronUp className="h-6 w-6 text-green-600" /> : <ChevronDown className="h-6 w-6 text-green-600" />}
                  </div>
                </button>

                {showCities && (
                  <div className="px-6 pb-6 border-t border-green-500/20 pt-4 space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar cidade..."
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {filteredCities.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => handleCityClick(city)}
                          className="group p-4 rounded-xl bg-card hover:bg-green-500/10 border border-border hover:border-green-500/30 transition-all text-center"
                        >
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-green-600 font-medium">ATIVA</span>
                          </div>
                          <p className="font-bold group-hover:text-green-600 transition-colors">{city.name}</p>
                          <p className="text-sm text-muted-foreground">{city.state}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Estados - Paginado */}
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Cidades Disponíveis por Estado
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setStatesPage(Math.max(0, statesPage - 1))}
                  disabled={statesPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {statesPage + 1}/{totalStatePages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setStatesPage(Math.min(totalStatePages - 1, statesPage + 1))}
                  disabled={statesPage === totalStatePages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {paginatedStates.map((state) => {
                const citiesInState = operatingCities.filter(c => c.state === state.uf).length;
                const available = state.cities - citiesInState;
                const isSelected = selectedState === state.uf;

                return (
                  <button
                    key={state.uf}
                    onClick={() => setSelectedState(isSelected ? null : state.uf)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all hover:shadow-xl ${
                      isSelected 
                        ? 'border-primary bg-primary/5 scale-[1.02] shadow-lg' 
                        : 'border-border hover:border-primary/30 bg-card'
                    }`}
                  >
                    <p className="text-2xl font-black text-primary">{state.uf}</p>
                    <p className="text-sm text-muted-foreground truncate">{state.name}</p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {available} disponíveis
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedState && (
              <div className="mt-8 p-6 bg-primary/5 rounded-2xl border border-primary/20 text-center animate-in fade-in slide-in-from-top-5 duration-300">
                <p className="text-lg mb-4">
                  <strong>{BRAZILIAN_STATES.find(s => s.uf === selectedState)?.name}</strong> tem{' '}
                  <strong className="text-primary">
                    {BRAZILIAN_STATES.find(s => s.uf === selectedState)!.cities - operatingCities.filter(c => c.state === selectedState).length}
                  </strong>{' '}
                  cidades disponíveis!
                </p>
                <Button onClick={() => scrollToSection('contato')} className="bg-primary hover:bg-primary/90">
                  Franquear uma Cidade de {selectedState}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90 shadow-xl"
              onClick={() => scrollToSection('contato')}
            >
              <Target className="mr-2 h-5 w-5" />
              Verificar Minha Cidade
            </Button>
          </div>
        </div>
      </section>

      {/* INVESTIMENTO */}
      <section id="investimento" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20">
              Investimento
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
              O Investimento Mais <span className="text-primary">Acessível</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comece seu negócio com o melhor custo-benefício do mercado
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-primary/20 overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-8 text-center">
                <Badge className="bg-amber-400 text-black border-0 mb-4">Melhor Custo-Benefício</Badge>
                <h3 className="text-3xl font-bold mb-2">Franquia Bibi Motos</h3>
                <p className="text-primary-foreground/80">Tudo incluso para você operar</p>
              </div>
              
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-bold text-lg flex items-center gap-2">
                      <Gift className="h-5 w-5 text-primary" />
                      O Que Está Incluso
                    </h4>
                    <ul className="space-y-3">
                      {[
                        "Painel administrativo completo",
                        "App com sua marca",
                        "Domínio exclusivo",
                        "Treinamento completo",
                        "Suporte ilimitado",
                        "Kit marketing digital",
                        "Estratégias de lançamento"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Diferenciais
                    </h4>
                    <ul className="space-y-3">
                      {[
                        "Zero royalties",
                        "100% do faturamento",
                        "Mensalidade fixa",
                        "Sem taxa abusiva",
                        "Exclusividade territorial",
                        "Atualizações gratuitas",
                        "Suporte vitalício"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl text-center">
                  <p className="text-sm text-muted-foreground mb-2">Investimento inicial a partir de</p>
                  <p className="text-4xl font-black text-primary">Consulte</p>
                  <p className="text-sm text-muted-foreground mt-2">Valores variam por tamanho da cidade</p>
                </div>

                <div className="mt-8 text-center">
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-primary to-primary/80"
                    onClick={() => scrollToSection('contato')}
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Falar com Consultor
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Dúvidas
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">Perguntas Frequentes</h2>
            <p className="text-lg text-muted-foreground">Tire suas dúvidas sobre a franquia</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { q: "Vocês cobram comissão?", a: "NÃO! 100% do faturamento é seu. Cobramos apenas mensalidade fixa." },
              { q: "Preciso de experiência?", a: "Não! Oferecemos treinamento completo e suporte contínuo." },
              { q: "Quanto tempo para começar?", a: "Em 7 dias você está operando com tudo pronto." },
              { q: "Tenho exclusividade na cidade?", a: "SIM! A cidade fica reservada exclusivamente para você." },
              { q: "Vocês ajudam com marketing?", a: "Totalmente! Kit completo com vídeos, artes e estratégias." },
              { q: "Como funciona o suporte?", a: "Suporte ilimitado via WhatsApp, e-mail e telefone." },
            ].map((faq, i) => (
              <Card 
                key={i}
                className={`cursor-pointer transition-all duration-300 ${
                  openFaq === i ? 'border-primary shadow-lg' : 'hover:border-primary/30'
                }`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-bold text-lg">{faq.q}</h3>
                    <ChevronDown className={`h-5 w-5 text-primary transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </div>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 mt-4' : 'max-h-0'}`}>
                    <p className="text-muted-foreground">{faq.a}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CONTATO / CTA FINAL */}
      <section id="contato" className="py-24 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/20 rounded-full blur-[128px]" />
        
        <div className="container relative z-10 mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-amber-400/20 text-amber-300 border-amber-400/30">
                Últimas Vagas
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
                Garanta Sua Cidade Agora
              </h2>
              <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
                Preencha o formulário e receba contato em até 24 horas
              </p>
            </div>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardContent className="p-8">
                <form onSubmit={handleLeadSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome Completo *</label>
                      <Input 
                        placeholder="Seu nome"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm({...leadForm, name: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">WhatsApp *</label>
                      <Input 
                        placeholder="(00) 00000-0000"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">E-mail</label>
                    <Input 
                      type="email"
                      placeholder="seu@email.com"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cidade *</label>
                      <Input 
                        placeholder="Nome da cidade"
                        value={leadForm.city}
                        onChange={(e) => setLeadForm({...leadForm, city: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Estado (UF)</label>
                      <Input 
                        placeholder="SP"
                        value={leadForm.state}
                        onChange={(e) => setLeadForm({...leadForm, state: e.target.value.toUpperCase().slice(0, 2)})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 uppercase"
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit"
                    size="lg"
                    className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-bold h-14"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="h-5 w-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Enviando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Crown className="h-5 w-5" />
                        Quero Minha Franquia
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    )}
                  </Button>

                  <p className="text-center text-primary-foreground/60 text-sm">
                    Ao enviar, você concorda em receber contato comercial.
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* Contact Options */}
            <div className="mt-10 grid sm:grid-cols-3 gap-4">
              {[
                { icon: MessageCircle, title: "WhatsApp", sub: "Atendimento imediato", color: "green" },
                { icon: Phone, title: "Telefone", sub: "Seg-Sex 8h-18h", color: "purple" },
                { icon: Mail, title: "E-mail", sub: "franquias@bibimotos.com.br", color: "blue" },
              ].map((item, i) => (
                <Card key={i} className="bg-white/10 backdrop-blur border-white/20 text-center hover:bg-white/15 transition-colors">
                  <CardContent className="p-6">
                    <div className={`h-12 w-12 rounded-full bg-${item.color}-500/20 flex items-center justify-center mx-auto mb-4`}>
                      <item.icon className={`h-6 w-6 text-${item.color}-400`} />
                    </div>
                    <h3 className="font-bold mb-1">{item.title}</h3>
                    <p className="text-primary-foreground/60 text-sm">{item.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-card border-t py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src={logoImage} alt="Bibi Motos" className="h-12 w-12" />
                <div>
                  <h3 className="text-xl font-bold">Bibi Motos</h3>
                  <p className="text-primary text-sm font-medium">Franquias</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                A franquia de mobilidade que mais cresce no Brasil.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-lg mb-4">Franquias</h4>
              <div className="space-y-2 text-muted-foreground">
                {menuItems.map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => scrollToSection(item.id)} 
                    className="block hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-lg mb-4">Cidades Ativas</h4>
              <div className="space-y-2 text-muted-foreground">
                {operatingCities.slice(0, 5).map((city) => (
                  <button 
                    key={city.id}
                    onClick={() => handleCityClick(city)}
                    className="block hover:text-foreground transition-colors"
                  >
                    {city.name}/{city.state}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-lg mb-4">Acesso</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link to="/register">Cadastre-se</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t pt-8 text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} Bibi Motos. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}