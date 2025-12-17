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
  ImageIcon,
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
  Gift
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@/assets/logo-simbolo.png";

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

// Cidades de demonstração (serão substituídas por dados do banco)
const operatingCities = [
  { id: "1", name: "Jundiaí", state: "SP", subdomain: "jundiai" },
  { id: "2", name: "Franca", state: "SP", subdomain: "franca" },
  { id: "3", name: "Rio Preto", state: "SP", subdomain: "riopreto" },
  { id: "4", name: "Salvador", state: "BA", subdomain: "salvador" },
  { id: "5", name: "Passos", state: "MG", subdomain: "passos" },
  { id: "6", name: "Aracaju", state: "SE", subdomain: "aracaju" },
];

export default function FranchiseLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [leadForm, setLeadForm] = useState({ name: '', phone: '', email: '', city: '', state: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone || !leadForm.city) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      // TODO: Integrar com API
      toast({ title: "Interesse registrado!", description: "Nossa equipe entrará em contato em breve." });
      setLeadForm({ name: '', phone: '', email: '', city: '', state: '' });
    } catch (error) {
      toast({ title: "Erro ao enviar", description: "Tente novamente", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const menuItems = [
    { label: 'Início', id: 'hero' },
    { label: 'Vantagens', id: 'vantagens' },
    { label: 'Cidades', id: 'cidades' },
    { label: 'Como Funciona', id: 'como-funciona' },
    { label: 'Investimento', id: 'investimento' },
    { label: 'FAQ', id: 'faq' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header Navigation Premium */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl shadow-lg border-b' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Bibi Motos" className="h-12 w-12" />
              <div>
                <h1 className={`text-xl font-bold transition-colors ${scrolled ? 'text-purple-700' : 'text-white'}`}>
                  Bibi Motos
                </h1>
                <p className={`text-xs font-medium transition-colors ${scrolled ? 'text-purple-500' : 'text-purple-200'}`}>
                  Franquias
                </p>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    scrolled 
                      ? 'text-gray-700 hover:text-purple-600 hover:bg-purple-50' 
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <Button 
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-purple-900 font-bold shadow-lg"
                onClick={() => scrollToSection('contato')}
              >
                <Crown className="mr-2 h-4 w-4" />
                Quero Minha Franquia
              </Button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg ${scrolled ? 'text-gray-700' : 'text-white'}`}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-gray-950 border-t shadow-xl">
            <div className="container mx-auto px-4 py-4 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="w-full text-left px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4">
                <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-900 font-bold" onClick={() => scrollToSection('contato')}>
                  <Crown className="mr-2 h-4 w-4" />
                  Quero Minha Franquia
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* HERO - Alta Conversão */}
      <section id="hero" className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-400/20 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:60px_60px]"></div>
          <div className="absolute top-20 right-20 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-72 h-72 bg-purple-400/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container relative mx-auto px-4 pt-32 pb-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left space-y-8">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <Badge className="bg-yellow-400/20 text-yellow-300 border-yellow-400/30 px-4 py-2 text-sm font-semibold">
                    <Rocket className="h-4 w-4 mr-2" />
                    Oportunidade Exclusiva
                  </Badge>
                  <Badge className="bg-green-400/20 text-green-300 border-green-400/30 px-4 py-2 text-sm font-semibold">
                    <Timer className="h-4 w-4 mr-2" />
                    Vagas Limitadas
                  </Badge>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
                  Seja Dono do
                  <br />
                  <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                    Uber de Motos
                  </span>
                  <br />
                  <span className="text-3xl sm:text-4xl lg:text-5xl">da Sua Cidade</span>
                </h1>
                
                <p className="text-lg sm:text-xl text-purple-100 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  A <strong className="text-yellow-400">única franquia de mobilidade urbana</strong> que te dá 100% do controle. 
                  Sem comissões, sem participação nos lucros. <strong className="text-white">O faturamento é todo seu.</strong>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button 
                    size="lg" 
                    className="bg-yellow-400 hover:bg-yellow-500 text-purple-900 font-bold text-lg px-8 py-6 shadow-2xl shadow-yellow-400/30 h-auto group"
                    onClick={() => scrollToSection('contato')}
                  >
                    <Crown className="mr-2 h-5 w-5" />
                    Garantir Minha Cidade
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-2 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold text-lg px-8 py-6 h-auto"
                    onClick={() => scrollToSection('como-funciona')}
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Como Funciona
                  </Button>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-6">
                  <div className="flex items-center gap-2 text-white/90">
                    <div className="h-10 w-10 rounded-full bg-green-400/20 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    </div>
                    <span className="text-sm">Zero Comissão</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90">
                    <div className="h-10 w-10 rounded-full bg-green-400/20 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    </div>
                    <span className="text-sm">Painel Próprio</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90">
                    <div className="h-10 w-10 rounded-full bg-green-400/20 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    </div>
                    <span className="text-sm">Suporte Total</span>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="hidden lg:block relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-yellow-400/20 to-purple-600/20 rounded-3xl blur-2xl"></div>
                
                <div className="relative grid gap-4">
                  <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-yellow-400 flex items-center justify-center">
                        <MapPin className="h-7 w-7 text-purple-900" />
                      </div>
                      <div>
                        <h3 className="font-bold text-3xl text-yellow-400">{operatingCities.length}+</h3>
                        <p className="text-purple-200">Cidades Operando</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-green-400 flex items-center justify-center">
                        <TrendingUp className="h-7 w-7 text-green-900" />
                      </div>
                      <div>
                        <h3 className="font-bold text-3xl text-green-400">R$ 15k+</h3>
                        <p className="text-purple-200">Faturamento Médio/Mês</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-purple-400 flex items-center justify-center">
                        <Percent className="h-7 w-7 text-purple-900" />
                      </div>
                      <div>
                        <h3 className="font-bold text-3xl text-purple-300">0%</h3>
                        <p className="text-purple-200">Royalties ou Comissões</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-xl border-white/20 text-white p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-blue-400 flex items-center justify-center">
                        <Calendar className="h-7 w-7 text-blue-900" />
                      </div>
                      <div>
                        <h3 className="font-bold text-3xl text-blue-300">7 dias</h3>
                        <p className="text-purple-200">Implantação Completa</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <button onClick={() => scrollToSection('vantagens')} className="text-white/60 hover:text-white">
            <ChevronDown className="h-8 w-8" />
          </button>
        </div>
      </section>

      {/* PROVA SOCIAL - Cidades Operando */}
      <section className="py-12 bg-gradient-to-r from-purple-900 to-purple-800 border-y border-purple-700">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-white">
            <span className="text-purple-300 font-medium">Já operando em:</span>
            <div className="flex flex-wrap justify-center gap-2">
              {operatingCities.map((city) => (
                <span
                  key={city.id}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                  {city.name}/{city.state}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VANTAGENS EXCLUSIVAS */}
      <section id="vantagens" className="py-24 bg-gradient-to-b from-background to-purple-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">Por Que Escolher</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              A Franquia Que <span className="text-purple-600">Mais Entrega</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Diferente de todas as outras, aqui você é o dono de verdade
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Percent,
                title: "Zero Comissão",
                description: "Não cobramos porcentagem sobre suas corridas. O faturamento é 100% seu.",
                highlight: true,
                color: "from-green-500 to-emerald-600"
              },
              {
                icon: Building2,
                title: "Painel Administrativo Próprio",
                description: "Sistema completo e independente para gerenciar motoristas, corridas e finanças.",
                color: "from-purple-500 to-purple-600"
              },
              {
                icon: DollarSign,
                title: "Mensalidade Acessível",
                description: "Valor fixo mensal muito abaixo do mercado. Sem surpresas, sem taxas escondidas.",
                color: "from-blue-500 to-blue-600"
              },
              {
                icon: HeadphonesIcon,
                title: "Suporte Completo",
                description: "Equipe dedicada para te ajudar em tudo: implantação, operação e crescimento.",
                color: "from-orange-500 to-orange-600"
              },
              {
                icon: Video,
                title: "Marketing Incluso",
                description: "Acesso a vídeos, artes, criativos e estratégias prontas para você usar.",
                color: "from-pink-500 to-pink-600"
              },
              {
                icon: Rocket,
                title: "Implantação em 7 Dias",
                description: "Da assinatura ao lançamento em apenas uma semana. Suporte total no processo.",
                color: "from-yellow-500 to-yellow-600"
              }
            ].map((item, index) => (
              <Card 
                key={index} 
                className={`border-2 hover:shadow-xl transition-all duration-300 group ${item.highlight ? 'border-green-300 bg-green-50/50' : ''}`}
              >
                <CardContent className="p-6">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Diferencial */}
          <div className="mt-16 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-r from-purple-600 to-purple-800 text-white border-0 overflow-hidden">
              <CardContent className="p-8 md:p-12 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 text-center space-y-6">
                  <Crown className="h-16 w-16 mx-auto text-yellow-400" />
                  <h3 className="text-2xl md:text-3xl font-bold">
                    Você é o Dono, Não um Parceiro
                  </h3>
                  <p className="text-lg text-purple-100 max-w-2xl mx-auto">
                    Em outras franquias você paga royalties, comissões e taxas que comem seu lucro. 
                    Na Bibi Motos, você paga apenas a mensalidade fixa e fica com <strong className="text-yellow-400">100% do faturamento</strong>.
                  </p>
                  <Button 
                    size="lg" 
                    className="bg-yellow-400 hover:bg-yellow-500 text-purple-900 font-bold mt-4"
                    onClick={() => scrollToSection('contato')}
                  >
                    Quero Ser Dono da Minha Cidade
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CIDADES DISPONÍVEIS */}
      <section id="cidades" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-yellow-100 text-yellow-700 border-yellow-200">Oportunidade</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              <span className="text-purple-600">5.570 Cidades</span> Esperando por Você
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Escolha sua cidade e seja o pioneiro na mobilidade urbana da sua região
            </p>
          </div>

          {/* Cidades Já Operando */}
          <div className="mb-16">
            <h3 className="text-xl font-bold text-center mb-8 flex items-center justify-center gap-2">
              <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
              Cidades Já Operando ({operatingCities.length})
            </h3>
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {operatingCities.map((city) => (
                <span
                  key={city.id}
                  className="px-4 py-2 rounded-lg bg-green-100 hover:bg-green-200 text-green-800 font-medium transition-colors flex items-center gap-2 text-sm"
                >
                  <MapPin className="h-4 w-4" />
                  {city.name}/{city.state}
                </span>
              ))}
            </div>
          </div>

          {/* Estados Disponíveis */}
          <div className="max-w-5xl mx-auto">
            <h3 className="text-xl font-bold text-center mb-8">
              Cidades Disponíveis por Estado
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {BRAZILIAN_STATES.map((state) => {
                const citiesInState = operatingCities.filter(c => c.state === state.uf).length;
                const available = state.cities - citiesInState;
                return (
                  <button
                    key={state.uf}
                    onClick={() => setSelectedState(selectedState === state.uf ? null : state.uf)}
                    className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                      selectedState === state.uf 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <p className="font-bold text-lg">{state.uf}</p>
                    <p className="text-xs text-muted-foreground">{state.name}</p>
                    <p className="text-sm mt-2">
                      <span className="text-green-600 font-bold">{available}</span>
                      <span className="text-muted-foreground"> disponíveis</span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
              onClick={() => scrollToSection('contato')}
            >
              <Target className="mr-2 h-5 w-5" />
              Verificar Disponibilidade da Minha Cidade
            </Button>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-24 bg-gradient-to-b from-purple-50 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">Processo Simples</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Como Funciona</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Em 4 passos você já está operando sua franquia
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: 1,
                icon: MessageCircle,
                title: "Contato",
                description: "Preencha o formulário e nossa equipe entra em contato para tirar todas as dúvidas."
              },
              {
                step: 2,
                icon: Lock,
                title: "Reserva",
                description: "Escolha sua cidade e faça a reserva exclusiva. Ninguém mais poderá adquirir."
              },
              {
                step: 3,
                icon: Rocket,
                title: "Implantação",
                description: "Em 7 dias configuramos tudo: painel, app, domínio, materiais de marketing."
              },
              {
                step: 4,
                icon: TrendingUp,
                title: "Operação",
                description: "Comece a faturar! Cadastre motoristas, receba corridas e cresça seu negócio."
              }
            ].map((item, index) => (
              <div key={item.step} className="relative text-center">
                {index < 3 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-purple-400 to-purple-200"></div>
                )}
                
                <div className="relative z-10">
                  <div className="relative mx-auto w-fit mb-6">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                      <item.icon className="h-10 w-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-yellow-400 text-purple-900 flex items-center justify-center font-bold text-sm shadow-lg">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INVESTIMENTO */}
      <section id="investimento" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 border-green-200">Investimento</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Quanto Custa Ser <span className="text-purple-600">Franqueado</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              O investimento mais acessível do mercado de mobilidade
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-purple-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-8 text-center">
                <Badge className="bg-yellow-400 text-purple-900 border-0 mb-4">Melhor Custo-Benefício</Badge>
                <h3 className="text-3xl font-bold mb-2">Franquia Bibi Motos</h3>
                <p className="text-purple-200">Tudo incluso para você começar a operar</p>
              </div>
              
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-bold text-lg flex items-center gap-2">
                      <Gift className="h-5 w-5 text-purple-600" />
                      O Que Está Incluso
                    </h4>
                    <ul className="space-y-3">
                      {[
                        "Painel administrativo completo",
                        "App personalizado com sua marca",
                        "Domínio exclusivo da cidade",
                        "Treinamento completo",
                        "Suporte técnico ilimitado",
                        "Kit de marketing digital",
                        "Vídeos e artes prontas",
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
                      <Shield className="h-5 w-5 text-purple-600" />
                      Diferenciais
                    </h4>
                    <ul className="space-y-3">
                      {[
                        "Zero royalties ou comissões",
                        "100% do faturamento é seu",
                        "Mensalidade fixa e acessível",
                        "Sem taxa de adesão abusiva",
                        "Contrato flexível",
                        "Exclusividade territorial",
                        "Suporte vitalício",
                        "Atualizações gratuitas"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <Sparkles className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground mb-2">Investimento inicial a partir de</p>
                  <p className="text-4xl font-bold text-green-600">Consulte</p>
                  <p className="text-sm text-muted-foreground mt-2">Valores variam de acordo com o tamanho da cidade</p>
                </div>

                <div className="mt-8 text-center">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-purple-600 to-purple-800 text-white font-bold"
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

      {/* FAQ - QUEBRA OBJEÇÕES */}
      <section id="faq" className="py-24 bg-gradient-to-b from-purple-50 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">Dúvidas</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Perguntas Frequentes</h2>
            <p className="text-lg text-muted-foreground">Tire todas as suas dúvidas sobre a franquia</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "Vocês cobram comissão sobre as corridas?",
                a: "NÃO! Esse é nosso maior diferencial. Você fica com 100% do faturamento da sua operação. Cobramos apenas uma mensalidade fixa muito acessível para manter a plataforma funcionando."
              },
              {
                q: "Preciso ter experiência no ramo?",
                a: "Não precisa! Oferecemos treinamento completo e suporte contínuo. Vamos te ensinar tudo que você precisa saber para operar sua franquia com sucesso."
              },
              {
                q: "Quanto tempo leva para começar a operar?",
                a: "Em apenas 7 dias após a confirmação do contrato, você já estará com tudo pronto: painel, app, domínio e materiais de marketing. É só começar a cadastrar motoristas e divulgar!"
              },
              {
                q: "E se minha cidade for pequena?",
                a: "Temos planos para cidades de todos os tamanhos. Cidades menores têm mensalidades menores. O importante é que você seja o primeiro a oferecer o serviço na sua região."
              },
              {
                q: "Tenho exclusividade na minha cidade?",
                a: "SIM! Quando você adquire a franquia de uma cidade, ela fica reservada exclusivamente para você. Ninguém mais poderá operar a Bibi Motos naquela cidade."
              },
              {
                q: "Vocês ajudam com marketing?",
                a: "Totalmente! Você recebe um kit completo com vídeos, artes, posts para redes sociais, estratégias de lançamento e muito mais. Tudo pronto para você usar."
              },
              {
                q: "Como funciona o suporte?",
                a: "Oferecemos suporte ilimitado via WhatsApp, e-mail e telefone. Nossa equipe está sempre disponível para te ajudar com qualquer dúvida ou problema técnico."
              },
              {
                q: "Posso cancelar o contrato?",
                a: "Sim, nosso contrato é flexível. Mas você vai ver que depois de começar a faturar, não vai querer parar! Nossos franqueados estão muito satisfeitos."
              }
            ].map((faq, i) => (
              <Card 
                key={i} 
                className={`border-2 cursor-pointer transition-all duration-300 ${
                  openFaq === i ? 'border-purple-300 shadow-lg' : 'hover:border-purple-200'
                }`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-bold text-lg">{faq.q}</h3>
                    <ChevronDown className={`h-5 w-5 flex-shrink-0 text-purple-600 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </div>
                  <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-60 mt-4' : 'max-h-0'}`}>
                    <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FORMULÁRIO DE CONTATO */}
      <section id="contato" className="py-24 bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl"></div>
        
        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-yellow-400/20 text-yellow-300 border-yellow-400/30">Últimas Vagas</Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Garanta Sua Cidade Agora
              </h2>
              <p className="text-lg text-purple-100 max-w-2xl mx-auto">
                Preencha o formulário e nossa equipe entra em contato em até 24 horas
              </p>
            </div>

            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardContent className="p-8">
                <form onSubmit={handleLeadSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Nome Completo *</label>
                      <Input 
                        placeholder="Seu nome"
                        value={leadForm.name}
                        onChange={(e) => setLeadForm({...leadForm, name: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">WhatsApp *</label>
                      <Input 
                        placeholder="(00) 00000-0000"
                        value={leadForm.phone}
                        onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">E-mail</label>
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
                      <label className="text-sm font-medium text-white">Cidade de Interesse *</label>
                      <Input 
                        placeholder="Nome da cidade"
                        value={leadForm.city}
                        onChange={(e) => setLeadForm({...leadForm, city: e.target.value})}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Estado (UF)</label>
                      <Input 
                        placeholder="SP, MG, RJ..."
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
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-purple-900 font-bold text-lg h-14"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="h-5 w-5 border-2 border-purple-900/30 border-t-purple-900 rounded-full animate-spin"></div>
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

                  <p className="text-center text-purple-200 text-sm">
                    Ao enviar, você concorda em receber contato da nossa equipe comercial.
                  </p>
                </form>
              </CardContent>
            </Card>

            {/* Contato Alternativo */}
            <div className="mt-12 grid sm:grid-cols-3 gap-6">
              <Card className="bg-white/10 backdrop-blur border-white/20 text-center">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-6 w-6 text-green-400" />
                  </div>
                  <h3 className="font-bold mb-2">WhatsApp</h3>
                  <p className="text-purple-200 text-sm">Atendimento imediato</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20 text-center">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                    <Phone className="h-6 w-6 text-purple-300" />
                  </div>
                  <h3 className="font-bold mb-2">Telefone</h3>
                  <p className="text-purple-200 text-sm">Seg a Sex, 8h às 18h</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20 text-center">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-6 w-6 text-blue-300" />
                  </div>
                  <h3 className="font-bold mb-2">E-mail</h3>
                  <p className="text-purple-200 text-sm">franquias@bibimotos.com.br</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img src={logoImage} alt="Bibi Motos" className="h-12 w-12" />
                <div>
                  <h3 className="text-xl font-bold">Bibi Motos</h3>
                  <p className="text-purple-400 text-sm">Franquias</p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed">
                A franquia de mobilidade urbana que mais cresce no Brasil.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-lg mb-4">Franquias</h4>
              <div className="space-y-2 text-gray-400">
                <button onClick={() => scrollToSection('vantagens')} className="block hover:text-white transition-colors">Vantagens</button>
                <button onClick={() => scrollToSection('cidades')} className="block hover:text-white transition-colors">Cidades Disponíveis</button>
                <button onClick={() => scrollToSection('investimento')} className="block hover:text-white transition-colors">Investimento</button>
                <button onClick={() => scrollToSection('faq')} className="block hover:text-white transition-colors">Dúvidas</button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-lg mb-4">Cidades</h4>
              <div className="space-y-2 text-gray-400">
                {operatingCities.slice(0, 5).map((city) => (
                  <span 
                    key={city.id}
                    className="block"
                  >
                    {city.name}/{city.state}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-lg mb-4">Contato</h4>
              <div className="space-y-2 text-gray-400">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  franquias@bibimotos.com.br
                </p>
                <p className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Comercial
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © {new Date().getFullYear()} Bibi Motos. Todos os direitos reservados.
              </p>
              <div className="flex gap-6 text-gray-400 text-sm">
                <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
                <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
